#!/usr/bin/env node

import fs from 'fs';
import { Command } from 'commander';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

const program = new Command();
const filePath = 'todos.json'

/* ------------------ Utils ------------------ */

const readTodo = () => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([]));
            return [];
        }
        const todos = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(todos);
    } catch (error) {
        console.error(chalk.red('Error reading todo file:'), error);
        return [];
    }
}

const saveTodo = (todos) => {
    fs.writeFileSync(filePath, JSON.stringify(todos, null, 2));
};

/* ------------------ CLI Setup ------------------ */

program
    .name('Todo-CLI')
    .description('CLI Todo Manager with JSON and IDs. Built using Commander.js')
    .version('1.1.0');

/* ------------------ CLI Commands ------------------ */

// Add
program.command('add')
    .description('Add a new todo')
    .argument('<string>', 'Todo text')
    .action((text) => {
        const todos = readTodo();
        const newTodo = {
            id: uuidv4(),
            text: text,
            completed: false
        };
        todos.push(newTodo);
        saveTodo(todos);
        console.log(chalk.green(`✔ Todo added: ${text}`));
        // console.log(chalk.green(`ID: ${newTodo.id}`));
    });


// Show
program
    .command('show')
    .description('Show all todos')
    .action(() => {
        const todos = readTodo();

        if (todos.length === 0) {
            console.log(chalk.yellow('No todos found.'));
            return;
        }

        todos.forEach((todo, index) => {
            const status = todo.completed
                ? chalk.green('[✔]')
                : chalk.red('[ ]');

            console.log(`${index + 1}. ${status} ${todo.text}`);
        });
    });

// Delete
program
    .command('delete')
    .description('Delete a todo')
    .argument('<number>', 'Todo number')
    .action((num) => {
        const index = Number(num) - 1;
        const todos = readTodo();

        if (!todos[index]) {
            console.log(chalk.red('Invalid todo number.'));
            return;
        }

        const removed = todos.splice(index, 1);
        saveTodo(todos);

        console.log(chalk.blue(`🗑 Deleted: ${removed[0].text}`));
    });


// Edit
program
    .command('edit')
    .description('Edit a todo')
    .argument('<number>', 'Todo number')
    .argument('<newText>', 'New todo text')
    .action((num, newText) => {
        const index = Number(num) - 1;
        const todos = readTodo();

        if (!todos[index]) {
            console.log(chalk.red('Invalid todo number.'));
            return;
        }

        todos[index].text = newText;
        saveTodo(todos);

        console.log(chalk.green(`✔ Todo #${num} updated`));
    });

// Complete
program
    .command('complete')
    .description('Mark a todo as completed')
    .argument('<number>', 'Todo number from show command')
    .action((num) => {
        const index = Number(num) - 1;
        const todos = readTodo();

        if (!todos[index]) {
            console.log(chalk.red('Invalid todo number.'));
            return;
        }

        todos[index].completed = true;
        saveTodo(todos);

        console.log(chalk.green(`✔ Todo #${num} marked as completed`));
    });

//Toggle
program
  .command('toggle')
  .description('Toggle completion status of a todo')
  .argument('<number>', 'Todo number from show command')
  .action((num) => {
    const index = Number(num) - 1;
    const todos = readTodo();

    if (!todos[index]) {
      console.log(chalk.red('Invalid todo number.'));
      return;
    }

    todos[index].completed = !todos[index].completed;
    saveTodo(todos);

    const status = todos[index].completed ? 'completed' : 'pending';
    console.log(
      chalk.green(`✔ Todo #${num} marked as ${status}`)
    );
  });


// Stats
program
  .command('stats')
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

program
  .command('search')
  .description('Search todos by keyword')
  .argument('<keyword>', 'Keyword to search for')
  .action((keyword) => {
    const todos = readTodo();

    const results = todos.filter(todo =>
      todo.text.toLowerCase().includes(keyword.toLowerCase())
    );

    if (results.length === 0) {
      console.log(chalk.yellow(`No todos found for "${keyword}"`));
      return;
    }

    results.forEach(todo => {
      const index = todos.indexOf(todo);
      const status = todo.completed
        ? chalk.green('[✔]')
        : chalk.red('[ ]');

      console.log(`${index + 1}. ${status} ${todo.text}`);
    });
  });

program
  .command('clear')
  .description('Clear all todos')
  .action(() => {
    fs.writeFileSync(filePath, JSON.stringify([]));
    console.log(chalk.green('✔ Todos cleared successfully'));
  });


program.addHelpText('after', `
Examples:
  node todo.js add "Learn Node.js"
  node todo.js show
  node todo.js complete 1
  node todo.js toggle 1
  node todo.js edit 1 "Master Commander.js"
  node todo.js delete 1
`);

program.parse();