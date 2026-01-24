@echo off
setlocal

:: Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH.
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

echo Linking command globally...
call npm link

echo "------------------------------------------"
echo "Installation complete!"
echo "You can now use the 'todo' command."
echo "Try running: todo --help"
echo "------------------------------------------"
pause