import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';

const publicRoot = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const fail = message => { throw new Error(`public/career.json: ${message}`); };
let content;
try {
  content = JSON.parse(await readFile(new URL('../public/career.json', import.meta.url), 'utf8'));
} catch (error) {
  fail(`Could not read the content file. Check its commas and quotation marks. ${error.message}`);
}

function number(value, name, min, max = Infinity) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    fail(`${name} must be a number ${max === Infinity ? `at least ${min}` : `between ${min} and ${max}`}.`);
  }
}

function text(value, name, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) fail(`${name} needs text.`);
}

async function asset(value, name) {
  text(value, `${name}.src`);
  const file = resolve(publicRoot, value);
  if (!file.startsWith(publicRoot + sep) || value.startsWith('/') || value.startsWith('\\') || value.includes('\\')) {
    fail(`${name}.src must be a relative path inside public/, such as career/photo.jpg.`);
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
  } catch {
    fail(`${name}: image file not found at public/${value}. Copy the image there or update src.`);
  }
}

if (!content || typeof content !== 'object' || !content.settings) fail('Include settings and a cards array.');
number(content.settings.maxWidth, 'settings.maxWidth', 1);
number(content.settings.maxImageHeight, 'settings.maxImageHeight', 1);
number(content.settings.padding, 'settings.padding', 0);
if (!Array.isArray(content.cards)) fail('cards must be an array.');
for (const [index, card] of content.cards.entries()) {
  const name = `Card ${index + 1}`;
  if (!card || typeof card !== 'object') fail(`${name} must be an object.`);
  text(card.title, `${name} title`);
  text(card.description, `${name} description`, true);
  if (!/^#[\da-f]{6}$/i.test(card.color)) fail(`${name} color must be a six-digit hex color, such as #c5d8b6.`);
  if (card.image !== null) {
    if (!card.image || typeof card.image !== 'object') fail(`${name} image must contain src and alt, or be null.`);
    await asset(card.image.src, `${name} image`);
    text(card.image.alt, `${name} image alt`);
  }
  if (!Array.isArray(card.stickers)) fail(`${name} stickers must be an array. Use [] for no stickers.`);
  if (card.stickers.length > 4) fail(`${name} can have at most four PNG stickers. Remove the extra entries from stickers.`);
  for (const [stickerIndex, sticker] of card.stickers.entries()) {
    const stickerName = `${name}, sticker ${stickerIndex + 1}`;
    if (!sticker || typeof sticker !== 'object') fail(`${stickerName} must be an object.`);
    await asset(sticker.src, stickerName);
    text(sticker.title, `${stickerName} title`);
    text(sticker.description, `${stickerName} description`, true);
    if (sticker.x !== undefined || sticker.y !== undefined) {
      number(sticker.x, `${stickerName} x`, 0, 100);
      number(sticker.y, `${stickerName} y`, 0, 100);
    }
    number(sticker.width, `${stickerName} width`, 1, 50);
    if (sticker.rotation !== undefined) number(sticker.rotation, `${stickerName} rotation`, -180, 180);
  }
}
console.log('Career content and image paths are valid.');
