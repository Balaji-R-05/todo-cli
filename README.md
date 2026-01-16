# 📝 Todo CLI

A simple command-line todo manager built with **Node.js**, **Commander**, and **Chalk**.
Stores todos in a JSON file and supports managing tasks via a command-line interface.

---

## 📦 Features
- Add todos
- View todos with status indicators (`[✔]` / `[ ]`)
- Mark todos as completed
- Toggle todo completion status
- Edit existing todos
- Delete todos
- View statistics (completed vs pending)
- Search todos by keyword
- Clear all todos
- Data stored persistently in `todos.json`

---

## 🚀 Installation & Setup

### 1. Clone or download this repository
```bash
git clone https://github.com/Balaji-R-05/todo-cli.git
cd todo-cli
```

### 2. Install dependencies
```bash
npm install
```

### 3. Usage

All commands use the **Todo Number** (index) shown in the `show` command, not the internal ID.

```bash
node todo.js add <text>            # Add a new todo
node todo.js show                  # List all todos
node todo.js toggle <id>            # Toggle completion status of todo #id
node todo.js complete <id>          # Mark todo #id as completed
node todo.js edit <id> <text>       # Update text of todo #id
node todo.js delete <id>            # Delete todo #id
node todo.js stats                 # Show completion statistics
node todo.js search <keyword>      # Search todos for keyword
node todo.js clear                 # Delete ALL todos
```

### Examples
```bash
node todo.js add "Buy groceries"
node todo.js show
node todo.js toggle 1
node todo.js search "buy"
node todo.js stats
```