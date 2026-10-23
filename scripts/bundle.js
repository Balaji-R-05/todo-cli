// Bundles todo.js + its dependencies into a single CommonJS file so it can
// be fed to Node's SEA (Single Executable Application) tooling, which needs
// one self-contained entry point rather than an ESM module graph on disk.
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

await build({
    entryPoints: [path.join(root, 'todo.js')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: path.join(root, 'dist', 'todo.cjs'),
});

console.log('Bundled todo.js -> dist/todo.cjs');
