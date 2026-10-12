import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
await mkdir(output, { recursive: true });
await Promise.all(['index.html', 'styles.css', 'app.js', 'favicon.svg'].map((file) => copyFile(join(root, file), join(output, file))));
console.log('Built static site in dist/');
