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
| `todo add "task"` | `a` | Add a new task |
| `todo show` | `ls` | List all tasks |
| `todo toggle <num>` | `t` | Toggle completion of task |
| `todo complete <num>` | `c` | Mark task as completed |
| `todo edit <num> "text"`| `e` | Update task text |
| `todo delete <num>` | `d` | Remove task |
| `todo stats` | `st` | See completion stats |
| `todo search "key"` | `se` | Find tasks by keyword |
| `todo clear` | `cls` | Delete ALL tasks |

### Examples
```bash
todo init
todo add | a "Master Node.js"
todo show | ls 
todo toggle | t 1
todo complete | c 1
todo edit | e 1 "Master Node.js"
todo delete | d 1
todo stats | st
todo search | se "node"
todo clear | cls
```


## Uninstallation

To fully remove the global `todo` command and clean up:

1.  **Open your terminal** inside the `todo-cli` folder.
2.  **Run the script** for your OS:
    - **Windows:** `uninstall.bat`
    - **Linux / macOS:** `./uninstall.sh`
3.  **Close the terminal.**
4.  **Delete the `todo-cli` folder** from your computer.