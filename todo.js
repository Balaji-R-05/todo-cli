#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import { Command } from 'commander';
import chalk from 'chalk';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const program = new Command();

const localFilePath = path.resolve('todos.json');
const globalDir = path.join(os.homedir(), '.todo-cli');
const globalFilePath = path.join(globalDir, 'todos.json');

const SHORT_ID_LENGTH = 6;
const MIN_ID_QUERY_LENGTH = 4;

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
        return todos;
    } catch (error) {
        // Stop before any command can write over the broken file.
        const backupPath = `${filePath}.corrupt-${Date.now()}.bak`;
        fs.copyFileSync(filePath, backupPath);
        console.error(chalk.red(`Todo file is corrupted (${error.message}).`));
        console.error(chalk.yellow(`Backup saved to: ${backupPath}`));
        console.error(chalk.yellow(`Original left untouched: ${filePath}`));
        process.exit(1);
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

const shortId = (todo) => String(todo.id).slice(0, SHORT_ID_LENGTH);

// Resolves a short ID (or any unique prefix of the full ID) to a list index.
// Prints an error and returns null if nothing or more than one todo matches.
const resolveTodo = (todos, query) => {
    const q = String(query).trim().toLowerCase();
    if (q.length < MIN_ID_QUERY_LENGTH) {
        console.log(chalk.red(`Todo ID must be at least ${MIN_ID_QUERY_LENGTH} characters. Use the ID shown by "todo ls".`));
        return null;
    }

    const matches = todos
        .map((todo, index) => ({ todo, index }))
        .filter(({ todo }) => String(todo.id).toLowerCase().startsWith(q));

    if (matches.length === 0) {
        console.log(chalk.red(`No todo found with ID "${query}".`));
        return null;
    }
    if (matches.length > 1) {
        console.log(chalk.red(`ID "${query}" matches ${matches.length} todos. Type more characters.`));
        return null;
    }
    return matches[0].index;
};

const formatTodo = (todo) => {
    const status = todo.completed
        ? chalk.green('[✔]')
        : chalk.red('[ ]');
    return `${chalk.gray(shortId(todo))} ${status} ${todo.text}`;
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
    .option('-g, --global', 'Use global todo list stored in home directory');

/* ------------------ CLI Commands ------------------ */

// Init
program
    .command('init')
    .description('Initialize todo-cli (local or global)')
    .action(() => {
        const filePath = getFilePath();
        if (fs.existsSync(filePath)) {
            console.log(chalk.yellow(`Todo file already exists: ${filePath}`));
            return;
        }
        saveTodo([]);
        console.log(chalk.green(`Todo file initialized: ${filePath}`));
    });

// Add
program.command('add')
    .alias('a')
    .description('Add a new todo')
    .argument('<string>', 'Todo text')
    .action((text) => {
        const trimmed = text.trim();
        if (!trimmed) {
            console.log(chalk.red('Todo text cannot be empty.'));
            return;
        }

        const todos = readTodo();
        const newTodo = {
            id: randomUUID(),
            text: trimmed,
            completed: false
        };
        todos.push(newTodo);
        saveTodo(todos);
        console.log(chalk.green(`✔ Todo added (${shortId(newTodo)}): ${trimmed}`));
    });

// Show
program
    .command('show')
    .alias('ls')
    .description('Show all todos')
    .action(() => {
        const todos = readTodo();

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

        const removed = todos.splice(index, 1);
        saveTodo(todos);

        console.log(chalk.blue(`🗑 Deleted: ${removed[0].text}`));
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
            console.log(chalk.red('Todo text cannot be empty.'));
            return;
        }

        todos[index].text = trimmed;
        saveTodo(todos);

        console.log(chalk.green(`✔ Todo ${shortId(todos[index])} updated`));
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
        saveTodo(todos);

        console.log(chalk.green(`✔ Todo ${shortId(todos[index])} marked as completed`));
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
        saveTodo(todos);

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
            console.log(chalk.yellow('No todos to clear.'));
            return;
        }

        if (!options.yes) {
            const confirmed = await confirm(
                chalk.yellow(`This will delete ${todos.length} todo(s). Continue? (y/N) `)
            );
            if (!confirmed) {
                console.log(chalk.yellow('Cancelled.'));
                return;
            }
        }

        saveTodo([]);
        console.log(chalk.green('✔ Todos cleared successfully'));
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
