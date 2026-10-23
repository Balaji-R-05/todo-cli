#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import { Command } from 'commander';
import chalk from 'chalk';
import { shortId, findTodoIndex, normalizeTodo, MIN_ID_QUERY_LENGTH } from './lib.js';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const program = new Command();

const localFilePath = path.resolve('todos.json');
const globalDir = path.join(os.homedir(), '.todo-cli');
const globalFilePath = path.join(globalDir, 'todos.json');

const getFilePath = () => {
    const options = program.opts();
    if (options.global) {
        if (!fs.existsSync(globalDir)) {
            fs.mkdirSync(globalDir, { recursive: true });
        }
        if (!fs.existsSync(globalFilePath)) {
            fs.writeFileSync(globalFilePath, JSON.stringify([]));
        }
        return globalFilePath;
    }
    return localFilePath;
};

const isJsonMode = () => Boolean(program.opts().json);

// Prints a single JSON line on success.
// Only ever called in --json mode.
const printSuccess = (data) => {
    console.log(JSON.stringify({ ok: true, data }));
};

// Exit code convention: 
// 0 success, 1 generic/user error, 2 ambiguous ID match, 3 corrupted data file.
// Agents/scripts should rely on this, not on parsing stdout text.
const EXIT_GENERIC_ERROR = 1;
const EXIT_AMBIGUOUS = 2;
const EXIT_CORRUPTED = 3;

// Prints an error either as a JSON line or as chalk-colored text, depending on --json, and sets the process exit code.
// Used for both validation and "no match" cases.
const printError = (message, extra = {}, exitCode = EXIT_GENERIC_ERROR) => {
    if (isJsonMode()) {
        console.log(JSON.stringify({ ok: false, error: message, ...extra }));
    } else {
        console.log(chalk.red(message));
    }
    process.exitCode = exitCode;
};


/* ------------------ Utils ------------------ */

const readTodo = () => {
    const filePath = getFilePath();
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    try {
        const todos = JSON.parse(raw);
        if (!Array.isArray(todos)) {
            throw new Error('expected a JSON array');
        }
        // Older todos.json files predate fields normalizeTodo fills in
        // (e.g. createdAt/updatedAt). Backfill them so a missing field never
        // crashes a read, and write the result straight back so the file is
        // migrated to the current schema on its very next read, not just
        // whenever a todo happens to be mutated next.
        const now = new Date().toISOString();
        const normalized = todos.map((todo) => normalizeTodo(todo, now));
        if (JSON.stringify(normalized) !== JSON.stringify(todos)) {
            saveTodo(normalized);
        }
        return normalized;
    } catch (error) {
        // Stop before any command can write over the broken file.
        const backupPath = `${filePath}.corrupt-${Date.now()}.bak`;
        fs.copyFileSync(filePath, backupPath);
        if (isJsonMode()) {
            console.log(JSON.stringify({
                ok: false,
                error: `Todo file is corrupted (${error.message}).`,
                backupPath,
                originalPath: filePath
            }));
        } else {
            console.error(chalk.red(`Todo file is corrupted (${error.message}).`));
            console.error(chalk.yellow(`Backup saved to: ${backupPath}`));
            console.error(chalk.yellow(`Original left untouched: ${filePath}`));
        }
        process.exit(EXIT_CORRUPTED);
    }
};

// Write to a temp file first, then rename over the original,
// so a crash mid-write cannot leave a half-written todos.json.
const saveTodo = (todos) => {
    const filePath = getFilePath();
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(todos, null, 2));
    fs.renameSync(tmpPath, filePath);
};

// Resolves a short ID (or any unique prefix of the full ID) to a list index.
// Prints an error and returns null if nothing or more than one todo matches.
const resolveTodo = (todos, query) => {
    const result = findTodoIndex(todos, query);
    switch (result.status) {
        case 'too-short':
            printError(`Todo ID must be at least ${MIN_ID_QUERY_LENGTH} characters. Use the ID shown by "todo ls".`);
            return null;
        case 'not-found':
            printError(`No todo found with ID "${query}".`);
            return null;
        case 'ambiguous':
            printError(`ID "${query}" matches ${result.count} todos. Type more characters.`, { matchCount: result.count }, EXIT_AMBIGUOUS);
            return null;
        default:
            return result.index;
    }
};

const formatTodo = (todo) => {
    const status = todo.completed
        ? chalk.green('[✔]')
        : chalk.red('[ ]');
    return `${chalk.gray(shortId(todo))} ${status} ${todo.text}`;
};

// Adds "todos.json" to an existing .gitignore so the local todo file isn't committed.
// No-op if there's no .gitignore, or it already ignores the file.
const addToGitignore = () => {
    const gitignorePath = path.resolve('.gitignore');
    if (!fs.existsSync(gitignorePath)) {
        return false;
    }

    const contents = fs.readFileSync(gitignorePath, 'utf-8');
    const alreadyIgnored = contents.split('\n').some((line) => line.trim() === 'todos.json');
    if (alreadyIgnored) {
        return false;
    }

    const prefix = contents.length === 0 || contents.endsWith('\n') ? '' : '\n';
    fs.appendFileSync(gitignorePath, `${prefix}todos.json\n`);
    return true;
};

const confirm = (question) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(/^y(es)?$/i.test(answer.trim()));
        });
    });
};

/* ------------------ CLI Setup ------------------ */

program
    .name('Todo-CLI')
    .description('CLI Todo Manager with JSON and short IDs. Built using Commander.js')
    .version(pkg.version)
    .option('-g, --global', 'Use global todo list stored in home directory')
    .option('-j, --json', 'Output machine-readable JSON instead of formatted text')
    .option('--no-color', 'Disable colored output (the NO_COLOR env var works too)');

// chalk already auto-detects NO_COLOR/non-TTY output, but --no-color is an
// explicit opt-in that should win even in a color-capable terminal.
program.hook('preAction', (thisCommand) => {
    if (thisCommand.opts().color === false) {
        chalk.level = 0;
    }
});

/* ------------------ CLI Commands ------------------ */

// Init
program
    .command('init')
    .description('Initialize todo-cli (local or global)')
    .action(() => {
        const filePath = getFilePath();
        const isGlobal = program.opts().global;
        const gitignored = isGlobal ? false : addToGitignore();

        if (fs.existsSync(filePath)) {
            if (isJsonMode()) {
                printSuccess({ path: filePath, created: false, gitignored });
            } else {
                console.log(chalk.yellow(`Todo file already exists: ${filePath}`));
                if (gitignored) {
                    console.log(chalk.green('Added todos.json to .gitignore'));
                }
            }
            return;
        }
        saveTodo([]);
        if (isJsonMode()) {
            printSuccess({ path: filePath, created: true, gitignored });
        } else {
            console.log(chalk.green(`Todo file initialized: ${filePath}`));
            if (gitignored) {
                console.log(chalk.green('Added todos.json to .gitignore'));
            }
        }
    });

// Add
program.command('add')
    .alias('a')
    .description('Add a new todo')
    .argument('<string>', 'Todo text')
    .action((text) => {
        const trimmed = text.trim();
        if (!trimmed) {
            printError('Todo text cannot be empty.');
            return;
        }

        const todos = readTodo();
        const now = new Date().toISOString();
        const newTodo = {
            id: randomUUID(),
            text: trimmed,
            completed: false,
            createdAt: now,
            updatedAt: now
        };
        todos.push(newTodo);
        saveTodo(todos);

        if (isJsonMode()) {
            printSuccess(newTodo);
        } else {
            console.log(chalk.green(`✔ Todo added (${shortId(newTodo)}): ${trimmed}`));
        }
    });

// Show
program
    .command('show')
    .alias('ls')
    .description('Show all todos')
    .action(() => {
        const todos = readTodo();

        if (isJsonMode()) {
            printSuccess(todos);
            return;
        }

        if (todos.length === 0) {
            console.log(chalk.yellow('No todos found.'));
            console.log(chalk.gray(`Using: ${getFilePath()}`));
            console.log(chalk.gray('Add one with "todo a <text>", or use -g for the global list.'));
            return;
        }

        todos.forEach((todo) => {
            console.log(formatTodo(todo));
        });
    });

// Delete
program
    .command('delete')
    .alias('d')
    .description('Delete a todo')
    .argument('<id>', 'Todo ID from show command')
    .action((id) => {
        const todos = readTodo();
        const index = resolveTodo(todos, id);
        if (index === null) {
            return;
        }

        const [removed] = todos.splice(index, 1);
        saveTodo(todos);

        if (isJsonMode()) {
            printSuccess(removed);
        } else {
            console.log(chalk.blue(`🗑 Deleted: ${removed.text}`));
        }
    });

// Edit
program
    .command('edit')
    .alias('e')
    .description('Edit a todo')
    .argument('<id>', 'Todo ID from show command')
    .argument('<newText>', 'New todo text')
    .action((id, newText) => {
        const todos = readTodo();
        const index = resolveTodo(todos, id);
        if (index === null) {
            return;
        }

        const trimmed = newText.trim();
        if (!trimmed) {
            printError('Todo text cannot be empty.');
            return;
        }

        todos[index].text = trimmed;
        todos[index].updatedAt = new Date().toISOString();
        saveTodo(todos);

        if (isJsonMode()) {
            printSuccess(todos[index]);
        } else {
            console.log(chalk.green(`✔ Todo ${shortId(todos[index])} updated`));
        }
    });

// Complete
program
    .command('complete')
    .alias('c')
    .description('Mark a todo as completed')
    .argument('<id>', 'Todo ID from show command')
    .action((id) => {
        const todos = readTodo();
        const index = resolveTodo(todos, id);
        if (index === null) {
            return;
        }

        todos[index].completed = true;
        todos[index].updatedAt = new Date().toISOString();
        saveTodo(todos);

        if (isJsonMode()) {
            printSuccess(todos[index]);
        } else {
            console.log(chalk.green(`✔ Todo ${shortId(todos[index])} marked as completed`));
        }
    });

// Toggle
program
    .command('toggle')
    .alias('t')
    .description('Toggle completion status of a todo')
    .argument('<id>', 'Todo ID from show command')
    .action((id) => {
        const todos = readTodo();
        const index = resolveTodo(todos, id);
        if (index === null) {
            return;
        }

        todos[index].completed = !todos[index].completed;
        todos[index].updatedAt = new Date().toISOString();
        saveTodo(todos);

        if (isJsonMode()) {
            printSuccess(todos[index]);
            return;
        }

        const status = todos[index].completed ? 'completed' : 'pending';
        console.log(
            chalk.green(`✔ Todo ${shortId(todos[index])} marked as ${status}`)
        );
    });

// Stats
program
    .command('stats')
    .alias('st')
    .description('Show todo statistics')
    .action(() => {
        const todos = readTodo();

        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const pending = total - completed;

        if (isJsonMode()) {
            printSuccess({ total, completed, pending });
            return;
        }

        console.log(chalk.cyan('Todo Stats'));
        console.log(chalk.green(`✔ Completed: ${completed}`));
        console.log(chalk.red(`✗ Pending: ${pending}`));
        console.log(chalk.white(`Total: ${total}`));
    });

// Search
program
    .command('search')
    .alias('se')
    .description('Search todos by keyword')
    .argument('<keyword>', 'Keyword to search for')
    .action((keyword) => {
        const todos = readTodo();
        const lowerKeyword = keyword.toLowerCase();

        const results = todos.filter(todo => todo.text.toLowerCase().includes(lowerKeyword));

        if (isJsonMode()) {
            printSuccess(results);
            return;
        }

        if (results.length === 0) {
            console.log(chalk.yellow(`No todos found for "${keyword}"`));
            return;
        }

        results.forEach((todo) => {
            console.log(formatTodo(todo));
        });
    });

// Clear
program
    .command('clear')
    .alias('cls')
    .description('Clear all todos')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (options) => {
        const todos = readTodo();
        if (todos.length === 0) {
            if (isJsonMode()) {
                printSuccess({ clearedCount: 0 });
            } else {
                console.log(chalk.yellow('No todos to clear.'));
            }
            return;
        }

        if (!options.yes) {
            if (isJsonMode()) {
                // An interactive prompt would hang a non-interactive/agent caller.
                printError('Refusing to clear without confirmation in --json mode. Pass --yes to proceed.');
                return;
            }

            if (!process.stdin.isTTY) {
                // No one can answer a prompt here; refuse instead of hanging.
                printError('Refusing to clear without confirmation in a non-interactive session. Pass --yes to proceed.');
                return;
            }

            const confirmed = await confirm(
                chalk.yellow(`This will delete ${todos.length} todo(s). Continue? (y/N) `)
            );
            if (!confirmed) {
                console.log(chalk.yellow('Cancelled.'));
                return;
            }
        }

        const clearedCount = todos.length;
        saveTodo([]);

        if (isJsonMode()) {
            printSuccess({ clearedCount });
        } else {
            console.log(chalk.green('✔ Todos cleared successfully'));
        }
    });


program.addHelpText('after', `
Todos are referenced by the short ID shown in "todo ls" (e.g. a1b2c3).
IDs stay the same when other todos are deleted.

Examples:
    todo init
    todo a "Project Task"
    todo -g a "Global Task"
    todo ls
    todo -g ls
    todo c a1b2c3
    todo t a1b2c3
    todo e a1b2c3 "Updated Task"
    todo -g e a1b2c3 "Updated Global Task"
    todo d a1b2c3
    todo st
    todo -g st
    todo se "node"
    todo clear | cls
`);

program.parse();
