import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
import { validateProjectArticle } from '../src/scripts/project-content.js';

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
const { folders } = JSON.parse(await readFile(new URL('../public/projects.json', import.meta.url), 'utf8'));
if (!Array.isArray(folders)) throw new Error('projects.json must contain a folders array.');
for (const folder of folders) {
  if (!folder.title || !Array.isArray(folder.images) || folder.images.length < 3) {
    throw new Error('Every project folder needs a title and at least three images.');
  }
  for (const image of folder.images) {
    if (!image.src || !image.alt) throw new Error(`Every image in ${folder.title} needs src and alt text.`);
    validateProjectArticle(image.article, `${folder.title}: ${image.title || image.alt} article`);
    if (/^https?:\/\//.test(image.src)) continue;
    const file = resolve(publicRoot, image.src);
    if (!file.startsWith(resolve(publicRoot, 'projects') + sep) || !(await stat(file)).isFile()) {
      throw new Error(`Project image must be a file under public/projects/: ${image.src}`);
    }
  }
}
console.log('Project content and image paths are valid.');
