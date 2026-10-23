// Builds a standalone, Node-free executable for the current OS/arch using
// Node's built-in SEA (Single Executable Application) tooling:
//   1. bundle todo.js + deps into one CJS file (esbuild; SEA needs a single
//      entry point, not an ESM module graph)
//   2. turn that bundle into a SEA blob
//   3. copy this Node binary and inject the blob into it (postject)
// Run once per platform (CI builds it in a matrix of ubuntu/macos/windows
// runners) — this only ever produces a binary for the OS/arch it runs on.
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');

// Fixed per the Node.js SEA docs — identifies an injected blob, not a secret.
const SEA_FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

const platformNames = { win32: 'win', darwin: 'macos', linux: 'linux' };
const platformName = platformNames[process.platform];
if (!platformName) {
    throw new Error(`Unsupported platform for binary build: ${process.platform}`);
}
const ext = process.platform === 'win32' ? '.exe' : '';
const binaryName = `todo-${platformName}-${os.arch()}${ext}`;
const binaryPath = path.join(distDir, binaryName);
const blobPath = path.join(distDir, 'todo.blob');

fs.mkdirSync(distDir, { recursive: true });

console.log('1/4 Bundling...');
execFileSync(process.execPath, [path.join(__dirname, 'bundle.js')], { stdio: 'inherit' });

console.log('2/4 Generating SEA blob...');
execFileSync(process.execPath, ['--experimental-sea-config', path.join(root, 'sea-config.json')], {
    cwd: root,
    stdio: 'inherit',
});

console.log('3/4 Copying node binary...');
fs.copyFileSync(process.execPath, binaryPath);
fs.chmodSync(binaryPath, 0o755);
if (process.platform === 'darwin') {
    // A copied node binary on macOS still has node's own code signature,
    // which postject strips to make room for the blob; re-sign ad hoc or
    // Gatekeeper refuses to run it at all.
    execFileSync('codesign', ['--remove-signature', binaryPath]);
}

console.log('4/4 Injecting blob...');
// Run postject's CLI script directly with this Node binary, rather than
// through its .bin/postject(.cmd) shim — on Windows that shim needs a shell
// to resolve, and a shell re-splits args on spaces in this repo's own path.
const postjectCli = path.join(root, 'node_modules', 'postject', 'dist', 'cli.js');
execFileSync(process.execPath, [
    postjectCli,
    binaryPath,
    'NODE_SEA_BLOB',
    blobPath,
    '--sentinel-fuse', SEA_FUSE,
    ...(process.platform === 'darwin' ? ['--macho-segment-name', 'NODE_SEA'] : []),
    '--overwrite',
], { stdio: 'inherit' });

if (process.platform === 'darwin') {
    execFileSync('codesign', ['--sign', '-', binaryPath]);
}

fs.rmSync(blobPath, { force: true });
console.log(`Built dist/${binaryName}`);
