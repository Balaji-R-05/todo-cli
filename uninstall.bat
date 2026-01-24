@echo off
setlocal

echo Unlinking todo-cli globally...
call npm unlink

echo ------------------------------------------
echo Uninstallation complete!
echo The 'todo' command has been removed.
echo ------------------------------------------
pause
