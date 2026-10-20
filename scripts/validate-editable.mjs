import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
import { validateSiteContent, validatePosterContent, validateContactContent, validateFramegenContent } from './editable-content.mjs';

const publicRoot = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
async function readContent(file) {
  try { return JSON.parse(await readFile(resolve(publicRoot, `${file}.json`), 'utf8')); }
  catch (error) { throw new Error(`public/${file}.json: could not read JSON. Check commas and double quotes. ${error.message}`); }
}
const [site, posters, contact, framegen] = await Promise.all([readContent('site'), readContent('posters'), readContent('contact'), readContent('framegen')]);
validateSiteContent(site);
validatePosterContent(posters);
validateContactContent(contact);
validateFramegenContent(framegen);
const images = [['site.json favicon', site.favicon], ['posters.json crash.image', posters.crash.image.src],
  ['framegen.json logo', framegen.logo.src],
  ...framegen.screenshots.map((image, index) => [`framegen.json screenshots[${index}]`, image.src]),
  ...contact.cards.flatMap((card, index) => card.icon ? [[`contact.json cards[${index}].icon`, card.icon]] : []),
  ...posters.designs.flatMap((design, index) => design.image ? [[`posters.json designs[${index}].image`, design.image.src]] : [])];
for (const [label, src] of images) {
  const file = resolve(publicRoot, src);
  if (!file.startsWith(publicRoot + sep) || src.startsWith('/') || src.includes('\\')) throw new Error(`${label}: use a relative image path inside public/.`);
  try { if (!(await stat(file)).isFile()) throw new Error('Not a file'); }
  catch { throw new Error(`${label}: image not found at public/${src}. Copy the image there or update src.`); }
}
console.log('Site, contact, FrameGen, and button-poster content and image paths are valid.');
