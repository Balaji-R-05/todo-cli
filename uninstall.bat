@echo off
setlocal

echo "Uninstalling todo-cli globally..."
call npm unlink

echo "------------------------------------------"
echo "Uninstallation complete!"
echo "The 'todo' command has been removed."
echo "------------------------------------------"