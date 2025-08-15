# 📝 Todo CLI (JSON + ID-based)

A simple command-line todo manager built with **Node.js**, **Commander**, and **Chalk**.  
Stores todos in a JSON file, supports adding, viewing, editing, completing, and deleting todos by ID.

---

## 📦 Features
- Add todos with auto-incremented IDs
- View todos with colored status (`[Pending]` / `[Completed]`)
- Edit todos by ID
- Mark todos as completed
- Delete todos by ID (auto reindexes IDs)
- Data stored in `todo.json` file (auto-created if missing)

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
```bash
node todo.js add <todo_text>      # Adds a new todo with given text. 
node todo.js show                  # Displays all todos with ID and status. 
node todo.js edit <id> <new_text>  # Updates a todo’s text by its ID.
node todo.js complete <id>         # Marks a todo as completed by its ID.
node todo.js delete <id>           # Deletes a todo by its ID (reindexes remaining todos).
```