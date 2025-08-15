import fs from 'fs';
import { Command } from 'commander';
import chalk from 'chalk';
import { json } from 'stream/consumers';

const program = new Command();
const filePath = 'todos.json'

const readTodo = () => {
    try {
        if(!fs.existsSync(filePath)) {
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

program
    .name('Todo-CLI')
    .description('CLI Todo Manager with JSON and IDs. Built using Commander.js')
    .version('1.0.0');


// Add
program.command('add')
    .description('Add a new todo')
    .argument('<string>', 'Todo text')
    .action((todo) => {
        let todos = readTodo();
        const newTodo = { id: todos.length + 1, text: todo, completed: false };
        todos.push(newTodo);
        saveTodo(todos);
        console.log(chalk.green(`Todo added: ${todo}`));
    });


// Show
program.command('show')
    .description('Show all todos')
    .action(() => {
        let todos = readTodo();
        if (todos.length === 0) {
            console.log(chalk.yellow('Todo list is empty.'));
        } else {
            todos.forEach((todo) => {
                const status = todo.completed ? chalk.green('[Completed]') : chalk.red('[Pending]');
                console.log(`${todo.id}: ${status} ${todo.text}`);
            });
        }
    });

// Delete
program.command('delete')
    .description('Delete a todo by ID')
    .argument('<id>', 'Todo ID')
    .action((id) => {
        let todos = readTodo();
        const index = todos.findIndex(t => t.id === parseInt(id));
        if (index === -1) {
            console.log(chalk.yellow('Todo not found.'));
        } else {
            todos.splice(index, 1);
            // Reassign IDs
            todos = todos.map((t, idx) => ({ ...t, id: idx + 1 }));
            saveTodo(todos);
            console.log(chalk.blue(`Todo with ID ${id} deleted.`));
        }
    });


// Edit
program.command('edit')
    .description('Edit a todo by ID')
    .argument('<id>', 'Todo ID')
    .argument('<newText>', 'New todo text')
    .action((id, newText) => {
        let todos = readTodo();
        const index = todos.findIndex(t => t.id === parseInt(id));
        if (index === -1) {
            console.log(chalk.yellow('Todo not found.'));
        } else {
            todos[index].text = newText;
            saveTodo(todos);
            console.log(chalk.green(`Todo with ID ${id} updated to: ${newText}`));
        }
    });

// Complete
program.command('complete')
    .description('Mark a todo as complete by ID')
    .argument('<id>', 'Todo ID')
    .action((id) => {
        let todos = readTodo();
        const index = todos.findIndex(t => t.id === parseInt(id));
        if (index === -1) {
            console.log(chalk.yellow('Todo not found.'));
        } else {
            todos[index].completed = true;
            saveTodo(todos);
            console.log(chalk.green(`Todo with ID ${id} marked as completed.`));
        }
    });

program.parse();