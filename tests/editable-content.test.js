import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateSiteContent, validatePosterContent, validateContactContent, validateFramegenContent } from '../scripts/editable-content.mjs';

const load = name => JSON.parse(readFileSync(new URL(`../public/${name}.json`, import.meta.url), 'utf8'));

test('FrameGen validates its editable button destination and two-image composition', () => {
  const framegen = load('framegen');
  assert.doesNotThrow(() => validateFramegenContent(framegen));
  framegen.button.url = 'javascript:alert(1)';
  assert.throws(() => validateFramegenContent(framegen), /button.url must use HTTP or HTTPS/);
  framegen.button.url = 'https://www.figma.com/community/plugin/1690822817256923421';
  framegen.screenshots.pop();
  assert.throws(() => validateFramegenContent(framegen), /exactly two images/);
});

test('demo contacts accept editable destinations and reject invalid addresses and protocols', () => {
  const contact = load('contact');
  assert.doesNotThrow(() => validateContactContent(contact));
  contact.email = 'hello';
  assert.throws(() => validateContactContent(contact), /email needs an address/);
  contact.email = 'me@example.com';
  contact.cards[1].url = 'javascript:alert(1)';
  assert.throws(() => validateContactContent(contact), /cards\[1\].url must use HTTP or HTTPS/);
  contact.cards[1].url = 'https://www.facebook.com/example';
  assert.doesNotThrow(() => validateContactContent(contact));
  contact.cards.at(-1).icon = '';
  assert.throws(() => validateContactContent(contact), /icon needs an image path/);
});

test('contact icon names, unique platforms, colors, and tilt stay valid after edits', () => {
  const cases = [
    ['platform', 'unknown', /cards\[1\].platform must/],
    ['platform', 'mail', /platform repeats mail/],
    ['color', 'red', /cards\[1\].color/],
    ['rotation', 30, /cards\[1\].rotation/],
  ];
  for (const [key, value, error] of cases) {
    const contact = load('contact');
    contact.cards[1][key] = value;
    assert.throws(() => validateContactContent(contact), error);
  }
});

test('the shipped site and button-poster files contain all required editable fields', () => {
  assert.doesNotThrow(() => validateSiteContent(load('site')));
  assert.doesNotThrow(() => validatePosterContent(load('posters')));
});

test('poster artwork can be replaced with an image without removing its editable design', () => {
  const posters = load('posters');
  posters.designs[0].image = { src: 'posters/my-poster.png', alt: 'My artwork' };
  assert.doesNotThrow(() => validatePosterContent(posters));
  posters.designs[0].image = { src: 'posters/my-poster.png' };
  assert.throws(() => validatePosterContent(posters), /designs\[0\].image.alt/);
});

test('invalid poster amounts and reversed size ranges explain which field to fix', () => {
  for (const amount of [0, 49, 2.5, '12']) {
    const posters = load('posters');
    posters.settings.postersPerClick = amount;
    assert.throws(() => validatePosterContent(posters), /settings.postersPerClick/);
  }
  const posters = load('posters');
  posters.settings.minSize = 100;
  posters.settings.maxSize = 50;
  assert.throws(() => validatePosterContent(posters), /maxSize must be at least minSize/);
});

test('poster designs cannot be empty and bad layout names and colors have clear errors', () => {
  const posters = load('posters');
  posters.designs = [];
  assert.throws(() => validatePosterContent(posters), /at least one poster/);
  const layout = load('posters');
  layout.designs[0].kind = 'unknown';
  assert.throws(() => validatePosterContent(layout), /designs\[0\].kind/);
  const colors = load('posters');
  colors.designs[0].paper = 'green';
  assert.throws(() => validatePosterContent(colors), /designs\[0\].paper/);
});

test('stars can be disabled but their palette must remain valid', () => {
  const posters = load('posters');
  posters.settings.starCount = 0;
  assert.doesNotThrow(() => validatePosterContent(posters));
  posters.settings.starColors = [];
  assert.throws(() => validatePosterContent(posters), /at least one color/);
});

test('cleanup timing settings and all cleanup messages remain editable and validated', () => {
  const posters = load('posters');
  posters.settings.cleanupAfterClicks = 3;
  posters.settings.thanksDurationMs = 3000;
  posters.messages.cleaning = 'Keep going!';
  assert.doesNotThrow(() => validatePosterContent(posters));
  posters.settings.thanksDurationMs = -1;
  assert.throws(() => validatePosterContent(posters), /settings.thanksDurationMs/);
  posters.settings.thanksDurationMs = 3000;
  delete posters.messages.completed;
  assert.throws(() => validatePosterContent(posters), /messages.completed/);
});

test('vacuum combo text requires ten nonempty messages and valid timing', () => {
  const posters = load('posters');
  assert.equal(posters.messages.cleanCombos.length, 10);
  posters.messages.cleanCombos[2] = 'TrippleClean!!!';
  assert.doesNotThrow(() => validatePosterContent(posters));
  posters.messages.cleanCombos.pop();
  assert.throws(() => validatePosterContent(posters), /exactly 10 messages/);
  posters.messages.cleanCombos.push('');
  assert.throws(() => validatePosterContent(posters), /cannot be empty/);
  posters.messages.cleanCombos[9] = 'Ten';
  posters.settings.comboDurationMs = -1;
  assert.throws(() => validatePosterContent(posters), /settings.comboDurationMs/);
});

test('cleanup appearance validates fonts, box presets, colors, and every combo', () => {
  const posters = load('posters');
  posters.messageStyles.dirty.font = 'unknown';
  assert.throws(() => validatePosterContent(posters), /messageStyles.dirty.font/);
  posters.messageStyles.dirty.font = 'display';
  posters.messageStyles.dirty.box = 'unknown';
  assert.throws(() => validatePosterContent(posters), /messageStyles.dirty.box/);
  posters.messageStyles.dirty.box = 'warning';
  posters.messageStyles.cleaning.paper = 'teal';
  assert.throws(() => validatePosterContent(posters), /messageStyles.cleaning.paper/);
  posters.messageStyles.cleaning.paper = '#e0f2e9';
  posters.messageStyles.thanks.accent = 'purple';
  assert.throws(() => validatePosterContent(posters), /messageStyles.thanks.accent/);
  posters.messageStyles.thanks.accent = '#683d86';
  posters.messageStyles.cleaningGod.color = 'gold';
  assert.throws(() => validatePosterContent(posters), /messageStyles.cleaningGod.color/);
  posters.messageStyles.cleaningGod.color = '#8a4a00';
  posters.messageStyles.cleanCombos.pop();
  assert.throws(() => validatePosterContent(posters), /exactly 10 styles/);
});

test('site text edits must retain the desktop and mobile line structure', () => {
  const site = load('site');
  site.hero.desktopLines = ['One line'];
  assert.throws(() => validateSiteContent(site), /desktopLines needs exactly 2 lines/);
  site.hero.desktopLines.push('Another line');
  site.sections.career = 'My work';
  assert.doesNotThrow(() => validateSiteContent(site));
});

test('error destinations must use a web URL', () => {
  const posters = load('posters');
  posters.crash.errorDetailsUrl = 'javascript:alert(1)';
  assert.throws(() => validatePosterContent(posters), /HTTP or HTTPS/);
});
