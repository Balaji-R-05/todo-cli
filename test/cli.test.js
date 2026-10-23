import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const todoBin = path.join(__dirname, '..', 'todo.js');

let cwd;

beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-cli-test-'));
});

afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
});

// Runs the CLI as a subprocess against the temp cwd. Returns stdout,
// tolerating a non-zero exit (use runWithStatus to assert on the code).
const run = (args) => runWithStatus(args).stdout;

// Same, but also returns the process exit code instead of throwing on it.
const runWithStatus = (args) => {
    try {
        const stdout = execFileSync('node', [todoBin, ...args], { cwd, encoding: 'utf-8' });
        return { stdout, stderr: '', status: 0 };
    } catch (error) {
        return { stdout: error.stdout, stderr: error.stderr, status: error.status };
    }
};

const readTodosFile = () => JSON.parse(fs.readFileSync(path.join(cwd, 'todos.json'), 'utf-8'));

describe('todo add / show', () => {
    test('show reports no todos before anything is added', () => {
        const output = run(['show']);
        assert.match(output, /No todos found/);
    });

    test('add creates a todo visible in show', () => {
        run(['add', 'Buy milk']);
        const output = run(['show']);
        assert.match(output, /Buy milk/);
        assert.match(output, /\[ \]/);
    });

    test('add rejects empty text and writes nothing', () => {
        const { stdout, status } = runWithStatus(['add', '   ']);
        assert.match(stdout, /cannot be empty/);
        assert.equal(status, 1);
        assert.equal(fs.existsSync(path.join(cwd, 'todos.json')), false);
    });

    test('add trims whitespace around the text', () => {
        run(['add', '  Walk the dog  ']);
        const todos = readTodosFile();
        assert.equal(todos[0].text, 'Walk the dog');
    });

    test('add sets createdAt and updatedAt to the same timestamp', () => {
        run(['add', 'Buy milk']);
        const todo = readTodosFile()[0];
        assert.match(todo.createdAt, /^\d{4}-\d{2}-\d{2}T/);
        assert.equal(todo.createdAt, todo.updatedAt);
    });
});

describe('todo complete / toggle / edit / delete', () => {
    const idFromAddOutput = (output) => {
        const match = output.match(/Todo added \(([0-9a-f]+)\)/);
        assert.ok(match, `expected an id in: ${output}`);
        return match[1];
    };

    test('complete marks a todo as completed', () => {
        const id = idFromAddOutput(run(['add', 'Finish report']));
        run(['complete', id]);
        const todos = readTodosFile();
        assert.equal(todos[0].completed, true);
    });

    test('toggle flips completion state both ways', () => {
        const id = idFromAddOutput(run(['add', 'Water plants']));
        run(['toggle', id]);
        assert.equal(readTodosFile()[0].completed, true);
        run(['toggle', id]);
        assert.equal(readTodosFile()[0].completed, false);
    });

    test('edit updates the text', () => {
        const id = idFromAddOutput(run(['add', 'Old text']));
        run(['edit', id, 'New text']);
        assert.equal(readTodosFile()[0].text, 'New text');
    });

    test('edit/complete/toggle bump updatedAt but leave createdAt alone', () => {
        const id = idFromAddOutput(run(['add', 'Task']));
        const { createdAt } = readTodosFile()[0];

        run(['edit', id, 'Task v2']);
        let todo = readTodosFile()[0];
        assert.equal(todo.createdAt, createdAt);
        assert.ok(new Date(todo.updatedAt).getTime() >= new Date(createdAt).getTime());

        run(['complete', id]);
        todo = readTodosFile()[0];
        assert.equal(todo.createdAt, createdAt);

        run(['toggle', id]);
        todo = readTodosFile()[0];
        assert.equal(todo.createdAt, createdAt);
    });

    test('reading a legacy todo without timestamps backfills them instead of crashing', () => {
        fs.writeFileSync(path.join(cwd, 'todos.json'), JSON.stringify([
            { id: 'aaaa1111-0000-0000-0000-000000000000', text: 'legacy', completed: false },
        ]));

        const output = run(['show']);
        assert.match(output, /legacy/);

        run(['complete', 'aaaa1111']);
        const todo = readTodosFile()[0];
        assert.match(todo.createdAt, /^\d{4}-\d{2}-\d{2}T/);
        assert.match(todo.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
    });

    test('reading a legacy todo migrates the file on disk immediately, even on a read-only command', () => {
        fs.writeFileSync(path.join(cwd, 'todos.json'), JSON.stringify([
            { id: 'aaaa1111-0000-0000-0000-000000000000', text: 'legacy', completed: false },
        ]));

        run(['show']);

        const todo = readTodosFile()[0];
        assert.match(todo.createdAt, /^\d{4}-\d{2}-\d{2}T/);
        assert.match(todo.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
    });

    test('reading an already-current todo file does not rewrite it', () => {
        run(['add', 'Task']);
        const before = fs.statSync(path.join(cwd, 'todos.json')).mtimeMs;

        run(['show']);

        const after = fs.statSync(path.join(cwd, 'todos.json')).mtimeMs;
        assert.equal(after, before);
    });

    test('delete removes the todo', () => {
        const id = idFromAddOutput(run(['add', 'Temporary']));
        run(['delete', id]);
        assert.equal(readTodosFile().length, 0);
    });

    test('a query shorter than 4 characters is rejected', () => {
        idFromAddOutput(run(['add', 'Something']));
        const { stdout, status } = runWithStatus(['complete', 'abc']);
        assert.match(stdout, /at least 4 characters/);
        assert.equal(status, 1);
    });

    test('an unknown id reports no match', () => {
        idFromAddOutput(run(['add', 'Something']));
        const { stdout, status } = runWithStatus(['complete', 'zzzzzz']);
        assert.match(stdout, /No todo found/);
        assert.equal(status, 1);
    });

    test('an ambiguous prefix is reported with the match count and exit code 2', () => {
        // Write two todos that deliberately share a 4-char id prefix,
        // rather than looping `add` and hoping for a random UUID collision.
        fs.writeFileSync(path.join(cwd, 'todos.json'), JSON.stringify([
            { id: 'aaaa1111-0000-0000-0000-000000000000', text: 'first', completed: false },
            { id: 'aaaa2222-0000-0000-0000-000000000000', text: 'second', completed: false },
        ]));

        const { stdout, status } = runWithStatus(['complete', 'aaaa']);
        assert.match(stdout, /matches 2 todos/);
        assert.equal(status, 2);
    });
});

describe('todo stats / search', () => {
    test('stats reports totals', () => {
        run(['add', 'A']);
        run(['add', 'B']);
        const [idA] = readTodosFile().map((t) => t.id);
        run(['complete', idA]);

        const output = run(['stats']);
        assert.match(output, /Completed: 1/);
        assert.match(output, /Pending: 1/);
        assert.match(output, /Total: 2/);
    });

    test('search finds matching todos only', () => {
        run(['add', 'Buy milk']);
        run(['add', 'Walk the dog']);

        const output = run(['search', 'milk']);
        assert.match(output, /Buy milk/);
        assert.doesNotMatch(output, /Walk the dog/);
    });

    test('search reports when nothing matches', () => {
        run(['add', 'Buy milk']);
        const output = run(['search', 'nonexistent']);
        assert.match(output, /No todos found for/);
    });
});

describe('todo clear', () => {
    test('clear -y wipes all todos without prompting', () => {
        run(['add', 'A']);
        run(['add', 'B']);
        run(['clear', '-y']);
        assert.equal(readTodosFile().length, 0);
    });

    test('clear on an empty list is a no-op', () => {
        const output = run(['clear', '-y']);
        assert.match(output, /No todos to clear/);
    });

    test('clear without -y in a non-interactive session refuses instead of hanging', () => {
        run(['add', 'A']);
        const { stdout, status } = runWithStatus(['clear']);
        assert.match(stdout, /non-interactive/);
        assert.equal(status, 1);
        assert.equal(readTodosFile().length, 1);
    });
});

describe('exit codes', () => {
    test('a successful command exits 0', () => {
        assert.equal(runWithStatus(['add', 'A']).status, 0);
    });

    test('a corrupted todos.json exits 3', () => {
        fs.writeFileSync(path.join(cwd, 'todos.json'), '{not valid json');
        const { stderr, status } = runWithStatus(['show']);
        assert.match(stderr, /corrupted/);
        assert.equal(status, 3);
    });
});

describe('--no-color', () => {
    // eslint-disable-next-line no-control-regex
    const ansiPattern = /\x1b\[\d+m/;

    test('strips ANSI codes even when the terminal would otherwise force color', () => {
        run(['add', 'Buy milk']);
        const env = { ...process.env, FORCE_COLOR: '1' };

        const withColor = execFileSync('node', [todoBin, 'show'], { cwd, encoding: 'utf-8', env });
        assert.match(withColor, ansiPattern);

        const withoutColor = execFileSync('node', [todoBin, '--no-color', 'show'], { cwd, encoding: 'utf-8', env });
        assert.doesNotMatch(withoutColor, ansiPattern);
        assert.match(withoutColor, /Buy milk/);
    });
});

describe('todo -g (global list)', () => {
    test('is isolated from the local list', () => {
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-cli-home-'));
        const env = { ...process.env, HOME: home, USERPROFILE: home };

        execFileSync('node', [todoBin, 'add', 'Local task'], { cwd, encoding: 'utf-8', env });
        execFileSync('node', [todoBin, '-g', 'add', 'Global task'], { cwd, encoding: 'utf-8', env });

        const localOutput = execFileSync('node', [todoBin, 'show'], { cwd, encoding: 'utf-8', env });
        const globalOutput = execFileSync('node', [todoBin, '-g', 'show'], { cwd, encoding: 'utf-8', env });

        assert.match(localOutput, /Local task/);
        assert.doesNotMatch(localOutput, /Global task/);
        assert.match(globalOutput, /Global task/);
        assert.doesNotMatch(globalOutput, /Local task/);

        fs.rmSync(home, { recursive: true, force: true });
    });
});
