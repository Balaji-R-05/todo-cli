#!/bin/bash

if ! [ -x "$(command -v npm)" ]; then
    echo 'Error: npm is not installed.' >&2
    exit 1
fi

echo "Installing dependencies..."
npm install

echo "Linking command globally..."
if [ "$EUID" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
    sudo npm link
else
    npm link
fi

echo "------------------------------------------"
echo "Installation complete!"
echo "You can now use the 'todo' command."
echo "Try running: todo --help"
echo "------------------------------------------"