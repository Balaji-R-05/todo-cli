#!/bin/bash

# Ensure Node.js and npm are installed
if ! [ -x "$(command -v npm)" ]; then
  echo 'Error: npm is not installed.' >&2
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Linking command globally..."
sudo npm link

echo "------------------------------------------"
echo "Installation complete!"
echo "You can now use the 'todo' command."
echo "Try running: todo --help"
echo "------------------------------------------"
