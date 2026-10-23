# Downloads the latest todo-cli standalone binary release and installs it
# as `todo` on PATH. No Node.js required.
#
# Usage: irm https://raw.githubusercontent.com/Balaji-R-05/todo-cli/main/install.ps1 | iex
$ErrorActionPreference = "Stop"

$repo = "Balaji-R-05/todo-cli"
$installDir = if ($env:TODO_CLI_INSTALL_DIR) { $env:TODO_CLI_INSTALL_DIR } else { "$env:USERPROFILE\.todo-cli\bin" }
$arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
$asset = "todo-win-$arch.exe"
$url = "https://github.com/$repo/releases/latest/download/$asset"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
$dest = Join-Path $installDir "todo.exe"

Write-Host "Downloading $asset..."
try {
    Invoke-WebRequest -Uri $url -OutFile $dest
} catch {
    Write-Error "No release binary found for Windows/$arch ($url). Check https://github.com/$repo/releases/latest for available binaries."
    exit 1
}

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$installDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
    Write-Host "Added $installDir to your user PATH. Restart your terminal, then run: todo --help"
} else {
    Write-Host "Installed to $dest"
    Write-Host "Try running: todo --help"
}
