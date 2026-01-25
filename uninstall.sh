#!/bin/bash

echo "Uninstalling todo-cli globally..."
if [ "$EUID" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
  sudo npm unlink
else
  npm unlink
fi

echo "------------------------------------------"
echo "Uninstallation complete!"
echo "The 'todo' command has been removed."
echo "------------------------------------------"
read -p "Press any key to continue..." -n1 -s
echo ""