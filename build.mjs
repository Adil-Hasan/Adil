import { copyFile, cp, mkdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, sep } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
const { folders } = JSON.parse(await readFile(join(root, 'projects.json'), 'utf8'));
if (!Array.isArray(folders)) throw new Error('projects.json must contain a folders array.');
for (const folder of folders) {
  if (!folder.title || !Array.isArray(folder.images) || folder.images.length < 3) {
    throw new Error('Every project folder needs a title and at least three images.');
  }
  for (const image of folder.images) {
    if (!image.src || !image.alt) throw new Error(`Every image in ${folder.title} needs src and alt text.`);
    if (/^https?:\/\//.test(image.src)) continue;
    const file = resolve(root, image.src);
    if (!file.startsWith(join(root, 'projects') + sep) || !(await stat(file)).isFile()) {
      throw new Error(`Project image must be a file under projects/: ${image.src}`);
    }
  }
}
await mkdir(output, { recursive: true });
await Promise.all(['index.html', 'styles.css', 'app.js', 'project-gallery.js', 'projects.json', 'favicon.svg'].map((file) => copyFile(join(root, file), join(output, file))));
await cp(join(root, 'projects'), join(output, 'projects'), { recursive: true });
console.log('Built static site in dist/');
