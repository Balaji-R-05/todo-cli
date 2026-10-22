# >_ Todo CLI
A simple command-line todo manager built with **Node.js**, **Commander**, and **Chalk**.
Stores todos in a JSON file and supports managing tasks via a command-line interface for individual folders.


## ✨ Features
- Create, edit, and delete todos directly from the terminal
- View todos with clear completion indicators (`[✔]` / `[ ]`)
- Mark tasks as completed or toggle their status
- Search todos by keyword
- View completion statistics (completed vs pending)
- Clear all todos with a single command
- Persistent local storage using `todos.json`


## Prerequisites

Before installing, ensure you have the following:
- **Node.js**: `v20.0.0` or higher (Required for Commander.js 14)
```bash
node --version
```
- **npm**: Node Package Manager (comes with Node.js)
```bash
npm --version
```

If not installed, install it from [here](https://nodejs.org/en/download/)


### 1. Clone the repository
```bash
git clone https://github.com/Balaji-R-05/todo-cli.git
cd todo-cli
```


### 2. One-Click Install
Run the script for your Operating System to install dependencies and link the command globally:

- **Windows:** Double-click `setup.bat` or run:
  ```cmd
  setup.bat
  ```
> If `npm link` fails, re-run `setup.bat` as **Administrator**.

- **Linux / macOS:** Run:
  ```bash
  chmod +x setup.sh && ./setup.sh
  ```


## Usage

Once installed, you can run the `todo` command from **any directory** in your terminal. Note that todos are stored locally in a `todos.json` file in whichever folder you run the command.

| Command | Shorthand | Description |
| :--- | :--- | :--- |
| `todo init` | - | Initialize todo-cli (optional) |
| `todo add "task"` | `a` | Add a new task (local or global) |
| `todo show` | `ls` | List all tasks |
| `todo toggle <id>` | `t` | Toggle completion of task |
| `todo complete <id>` | `c` | Mark task as completed |
| `todo edit <id> "text"`| `e` | Update task text |
| `todo delete <id>` | `d` | Remove task |
| `todo stats` | `st` | See completion stats |
| `todo search "key"` | `se` | Find tasks by keyword |
| `todo clear` | `cls` | Delete ALL tasks (asks to confirm; use `-y` to skip) |

Tasks are referenced by the short ID shown in `todo ls` (for example `a1b2c3`). IDs don't change when other tasks are deleted. You can type any unique prefix of at least 4 characters.

### ✨ Global Storage
Use the `-g` or `--global` flag with any command to manage a central todo list in your home directory (`~/.todo-cli/todos.json`). This allows you to access the same tasks from any project folder.

```bash
todo -g a "Central task"
todo -g ls
todo -g stats
```

### Examples
```bash
# Managed separately
todo a "Local task for this folder"
todo -g a "Global task for my main list"

# View both
todo ls
todo -g ls
```


## Development

Run the test suite (unit tests for ID matching + integration tests that
spawn the CLI against a temp directory) with:
```bash
npm test
```
No extra dependencies needed — it uses Node's built-in test runner
(`node --test`).


## Uninstallation

To fully remove the global `todo` command and clean up:

1.  **Open your terminal** inside the `todo-cli` folder.
2.  **Run the script** for your OS:
    - **Windows:** `uninstall.bat`
    - **Linux / macOS:** `./uninstall.sh`
3.  **Close the terminal.**
4.  **Delete the `todo-cli` folder** from your computer.