#!/bin/bash
set -e

if [ "$EUID" -eq 0 ]; then
  echo "Error: Do not run this script as root or with sudo."
  echo "Please run it as a normal user."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Linking command globally..."
npm link

echo "------------------------------------------"
echo "Installation complete!"
echo "You can now use the 'todo' command."
echo "Try running: todo --help"
echo "------------------------------------------"