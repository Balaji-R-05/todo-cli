# >_ Todo CLI
[![CI](https://github.com/Balaji-R-05/todo-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Balaji-R-05/todo-cli/actions/workflows/ci.yml)

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
- `--json` output mode for scripting and AI agent/tool use (Claude Code, Codex, etc.)


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
| `todo init` | - | Initialize todo-cli (optional); also adds `todos.json` to `.gitignore` if one exists |
| `todo add "task"` | `a` | Add a new task (local or global) |
| `todo show` | `ls` | List all tasks |
| `todo toggle <id>` | `t` | Toggle completion of task |
| `todo complete <id>` | `c` | Mark task as completed |
| `todo edit <id> "text"`| `e` | Update task text |
| `todo delete <id>` | `d` | Remove task |
| `todo stats` | `st` | See completion stats |
| `todo search "key"` | `se` | Find tasks by keyword |
| `todo clear` | `cls` | Delete ALL tasks (asks to confirm; use `-y` to skip) |

`todo init` is optional (any other command will create `todos.json` on
first use), but if your project has a `.gitignore`, running it adds a
`todos.json` entry so your local task list doesn't get committed. This
only applies to the local file — `-g`/global init skips it, since the
global list lives in your home directory, not the repo.

`todo clear` asks for confirmation before it will delete everything. Pass
`-y`/`--yes` to skip the prompt (required for scripts/CI anyway, since
`clear` refuses outright — rather than hanging — whenever stdin isn't an
interactive terminal, in both text and `--json` mode).

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

### ✨ JSON Mode (scripting & AI agents)
Add `-j`/`--json` to any command to get a single machine-readable JSON line
on stdout instead of colored text. Success and failure both print JSON, so
scripts and agents (Claude Code, Codex, etc.) can parse the result
reliably instead of regex-matching colored text:
```bash
todo --json add "Buy milk"
# {"ok":true,"data":{"id":"0a21b654-...","text":"Buy milk","completed":false,"createdAt":"2026-10-23T12:00:00.000Z","updatedAt":"2026-10-23T12:00:00.000Z"}}

todo --json show
# {"ok":true,"data":[{"id":"...","text":"Buy milk","completed":false,"createdAt":"...","updatedAt":"..."}]}

todo --json complete zzzzzz
# {"ok":false,"error":"No todo found with ID \"zzzzzz\"."}
```
- Success shape: `{ "ok": true, "data": ... }`
- Error shape: `{ "ok": false, "error": "message" }`
- `data` always includes the full todo ID (not the truncated short ID used
  in text mode), so a script/agent can target a todo unambiguously.
- Every todo carries `createdAt` (set on `add`) and `updatedAt` (bumped by
  `edit`/`complete`/`toggle`), both ISO-8601 timestamps. Todos from an older
  `todos.json` without these fields get them backfilled automatically the
  next time they're read.
- `todo --json clear` requires `--yes` — it refuses rather than hanging on
  an interactive confirmation prompt.

### Exit codes
Every command (in both text and `--json` mode) exits with one of:
| Code | Meaning |
| :--- | :--- |
| `0` | Success |
| `1` | Generic/user error (bad input, not found, empty text) |
| `2` | Ambiguous ID — your prefix matched more than one todo |
| `3` | `todos.json` is corrupted (a backup is written next to it) |

Scripts and agents should check the exit code, not parse stdout text, to
know whether a command succeeded.

### Plain-text output
Color is dropped automatically when output isn't a terminal, or when the
`NO_COLOR` env var is set. Pass the global `--no-color` flag to force
plain text even in a color-capable terminal. `--json` mode never uses
color in the first place.


## Development

Run the test suite (unit tests for ID matching + integration tests that
spawn the CLI against a temp directory) with:
```bash
npm test
```
No extra dependencies needed — it uses Node's built-in test runner
(`node --test`).

CI runs this same suite on every push/PR to `main`, across Node 20.x and
the latest LTS, on both Ubuntu and Windows — see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).


## Uninstallation

To fully remove the global `todo` command and clean up:

1.  **Open your terminal** inside the `todo-cli` folder.
2.  **Run the script** for your OS:
    - **Windows:** `uninstall.bat`
    - **Linux / macOS:** `./uninstall.sh`
3.  **Close the terminal.**
4.  **Delete the `todo-cli` folder** from your computer.