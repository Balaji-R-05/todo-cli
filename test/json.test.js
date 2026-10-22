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
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-cli-json-test-'));
});

afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
});

// Runs the CLI in --json mode and parses the single JSON line it prints.
const runJson = (args) => JSON.parse(
    execFileSync('node', [todoBin, '--json', ...args], { cwd, encoding: 'utf-8' })
);

describe('--json add / show / stats / search', () => {
    test('add returns the created todo with a full UUID', () => {
        const result = runJson(['add', 'Buy milk']);
        assert.equal(result.ok, true);
        assert.match(result.data.id, /^[0-9a-f-]{36}$/);
        assert.equal(result.data.text, 'Buy milk');
        assert.equal(result.data.completed, false);
    });

    test('add rejects empty text as a JSON error', () => {
        const result = runJson(['add', '   ']);
        assert.equal(result.ok, false);
        assert.match(result.error, /cannot be empty/);
    });

    test('show returns an array, empty or not', () => {
        assert.deepEqual(runJson(['show']), { ok: true, data: [] });
        runJson(['add', 'Buy milk']);
        const result = runJson(['show']);
        assert.equal(result.data.length, 1);
        assert.equal(result.data[0].text, 'Buy milk');
    });

    test('stats returns total/completed/pending as numbers', () => {
        runJson(['add', 'A']);
        const [id] = runJson(['show']).data.map((t) => t.id);
        runJson(['complete', id]);
        runJson(['add', 'B']);

        const result = runJson(['stats']);
        assert.deepEqual(result, { ok: true, data: { total: 2, completed: 1, pending: 1 } });
    });

    test('search returns matching todos as an array', () => {
        runJson(['add', 'Buy milk']);
        runJson(['add', 'Walk the dog']);

        const result = runJson(['search', 'milk']);
        assert.equal(result.data.length, 1);
        assert.equal(result.data[0].text, 'Buy milk');
    });
});

describe('--json complete / toggle / edit / delete', () => {
    const addAndGetId = (text) => runJson(['add', text]).data.id;

    test('complete returns the updated todo', () => {
        const id = addAndGetId('Finish report');
        const result = runJson(['complete', id]);
        assert.equal(result.ok, true);
        assert.equal(result.data.completed, true);
    });

    test('toggle returns the flipped todo', () => {
        const id = addAndGetId('Water plants');
        assert.equal(runJson(['toggle', id]).data.completed, true);
        assert.equal(runJson(['toggle', id]).data.completed, false);
    });

    test('edit returns the updated todo', () => {
        const id = addAndGetId('Old text');
        const result = runJson(['edit', id, 'New text']);
        assert.equal(result.data.text, 'New text');
    });

    test('delete returns the removed todo', () => {
        const id = addAndGetId('Temporary');
        const result = runJson(['delete', id]);
        assert.equal(result.ok, true);
        assert.equal(result.data.text, 'Temporary');
        assert.deepEqual(runJson(['show']).data, []);
    });

    test('an unresolvable id returns a JSON error, not a text error', () => {
        addAndGetId('Something');
        const result = runJson(['complete', 'zzzzzz']);
        assert.equal(result.ok, false);
        assert.match(result.error, /No todo found/);
    });

    test('an ambiguous prefix returns a JSON error with the match count', () => {
        fs.writeFileSync(path.join(cwd, 'todos.json'), JSON.stringify([
            { id: 'aaaa1111-0000-0000-0000-000000000000', text: 'first', completed: false },
            { id: 'aaaa2222-0000-0000-0000-000000000000', text: 'second', completed: false },
        ]));

        const result = runJson(['complete', 'aaaa']);
        assert.equal(result.ok, false);
        assert.equal(result.matchCount, 2);
    });
});

describe('--json clear', () => {
    test('refuses to clear without --yes, as a JSON error', () => {
        runJson(['add', 'A']);
        const result = runJson(['clear']);
        assert.equal(result.ok, false);
        assert.match(result.error, /Pass --yes/);
        assert.equal(runJson(['show']).data.length, 1);
    });

    test('clears with --yes and reports the cleared count', () => {
        runJson(['add', 'A']);
        runJson(['add', 'B']);
        const result = runJson(['clear', '--yes']);
        assert.deepEqual(result, { ok: true, data: { clearedCount: 2 } });
    });

    test('clearing an empty list reports zero without error', () => {
        const result = runJson(['clear', '--yes']);
        assert.deepEqual(result, { ok: true, data: { clearedCount: 0 } });
    });
});

describe('--json init', () => {
    test('reports created vs already-exists', () => {
        const first = runJson(['init']);
        assert.equal(first.data.created, true);

        const second = runJson(['init']);
        assert.equal(second.data.created, false);
    });
});
