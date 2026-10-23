#!/bin/bash
# Downloads the latest todo-cli standalone binary release and installs it
# as `todo` on PATH. No Node.js required.
#
# Usage: curl -fsSL https://raw.githubusercontent.com/Balaji-R-05/todo-cli/main/install.sh | bash
set -e

REPO="Balaji-R-05/todo-cli"
INSTALL_DIR="${TODO_CLI_INSTALL_DIR:-$HOME/.local/bin}"

case "$(uname -s)" in
    Linux) os="linux" ;;
    Darwin) os="macos" ;;
    *)
        echo "Error: unsupported OS '$(uname -s)'. Use the npm-based install instead (see README)." >&2
        exit 1
        ;;
esac

case "$(uname -m)" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *)
        echo "Error: unsupported architecture '$(uname -m)'." >&2
        exit 1
        ;;
esac

asset="todo-${os}-${arch}"
url="https://github.com/${REPO}/releases/latest/download/${asset}"

echo "Downloading ${asset}..."
mkdir -p "$INSTALL_DIR"
if ! curl -fsSL "$url" -o "$INSTALL_DIR/todo"; then
    echo "Error: no release binary found for ${os}/${arch} (${url})." >&2
    echo "Check https://github.com/${REPO}/releases/latest for available binaries." >&2
    exit 1
fi
chmod +x "$INSTALL_DIR/todo"

echo "------------------------------------------"
echo "Installed to $INSTALL_DIR/todo"
case ":$PATH:" in
    *":$INSTALL_DIR:"*)
        echo "Try running: todo --help"
        ;;
    *)
        echo "$INSTALL_DIR is not on your PATH yet. Add this to your shell profile:"
        echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
        ;;
esac
echo "------------------------------------------"
