const fail = (file, message) => { throw new Error(`public/${file}.json: ${message}`); };
const object = (value, file, path) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(file, `${path} must be an object.`);
};
const text = (value, file, path) => {
  if (typeof value !== 'string') fail(file, `${path} must be text inside double quotes.`);
};
const color = (value, path) => {
  if (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value)) fail('posters', `${path} needs a six-digit color such as #c5d8b6.`);
};
const number = (value, path, min, max) => {
  if (!Number.isInteger(value) || value < min || value > max) fail('posters', `${path} must be a whole number from ${min} to ${max}.`);
};
const texts = (value, keys, file, path) => {
  object(value, file, path);
  for (const key of keys) text(value[key], file, `${path}.${key}`);
};
const image = (value, path) => {
  object(value, 'posters', path);
  texts(value, ['src', 'alt'], 'posters', path);
  if (!value.src.trim()) fail('posters', `${path}.src needs an image path.`);
};

export function validateSiteContent(site) {
  object(site, 'site', 'Content');
  texts(site, ['name', 'title', 'description', 'favicon'], 'site', 'Content');
  texts(site.sections, ['projects', 'career', 'framegen', 'contact'], 'site', 'sections');
  texts(site.hero, ['desktopLastLine', 'buttonLabel', 'punctuation', 'signature', 'note', 'scrollLabel'], 'site', 'hero');
  for (const [key, count] of [['desktopLines', 2], ['mobileLines', 3]]) {
    const lines = site.hero[key];
    if (!Array.isArray(lines) || lines.length !== count) fail('site', `hero.${key} needs exactly ${count} lines.`);
    lines.forEach((line, index) => text(line, 'site', `hero.${key}[${index}]`));
  }
  texts(site.projects, ['loading', 'empty', 'error', 'imageError', 'back', 'backLabel', 'openLabel', 'imagesLabel'], 'site', 'projects');
  texts(site.accessibility, ['introduction', 'mainNavigation', 'home', 'skipContent'], 'site', 'accessibility');
}

export function validateFramegenContent(framegen) {
  object(framegen, 'framegen', 'Content');
  const artwork = (item, path) => {
    texts(item, ['src', 'alt'], 'framegen', path);
    if (!item.src.trim() || !item.alt.trim()) fail('framegen', `${path} needs a nonempty src and alt.`);
  };
  artwork(framegen.logo, 'logo');
  if (!Array.isArray(framegen.taglineLines) || !framegen.taglineLines.length) fail('framegen', 'taglineLines needs at least one line.');
  framegen.taglineLines.forEach((line, index) => {
    text(line, 'framegen', `taglineLines[${index}]`);
    if (!line.trim()) fail('framegen', `taglineLines[${index}] cannot be empty.`);
  });
  if (!Array.isArray(framegen.screenshots) || framegen.screenshots.length !== 2) fail('framegen', 'screenshots needs exactly two images: back first, front second.');
  framegen.screenshots.forEach((item, index) => artwork(item, `screenshots[${index}]`));
  texts(framegen.button, ['label', 'url'], 'framegen', 'button');
  if (!framegen.button.label.trim()) fail('framegen', 'button.label cannot be empty.');
  let url;
  try { url = new URL(framegen.button.url); } catch { fail('framegen', 'button.url needs a complete HTTP or HTTPS address.'); }
  if (!['http:', 'https:'].includes(url.protocol)) fail('framegen', 'button.url must use HTTP or HTTPS.');
}

export function validateContactContent(contact) {
  object(contact, 'contact', 'Content');
  texts(contact, ['description', 'email'], 'contact', 'Content');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) fail('contact', 'email needs an address such as hello@example.com.');
  texts(contact.copy, ['label', 'pending', 'copied', 'success', 'error', 'emailLabel'], 'contact', 'copy');
  if (!Array.isArray(contact.cards) || !contact.cards.length) fail('contact', 'cards needs at least one card.');
  const platforms = new Set();
  contact.cards.forEach((card, index) => {
    const path = `cards[${index}]`;
    texts(card, ['platform', 'label', 'color'], 'contact', path);
    if (!['mail', 'facebook', 'youtube', 'linkedin', 'instagram', 'github', 'supportkori'].includes(card.platform)) fail('contact', `${path}.platform must be mail, facebook, youtube, linkedin, instagram, github, or supportkori.`);
    if (platforms.has(card.platform)) fail('contact', `${path}.platform repeats ${card.platform}. Use each platform once.`);
    platforms.add(card.platform);
    if (card.icon !== undefined || card.platform === 'supportkori') {
      if (typeof card.icon !== 'string' || !card.icon.trim()) fail('contact', `${path}.icon needs an image path such as contact/supportkori.svg.`);
    }
    if (!card.label.trim()) fail('contact', `${path}.label cannot be empty.`);
    if (!/^#[\da-f]{6}$/i.test(card.color)) fail('contact', `${path}.color needs a six-digit hex color.`);
    if (!Number.isFinite(card.rotation) || Math.abs(card.rotation) > 12) fail('contact', `${path}.rotation must be a number from -12 to 12 degrees.`);
    if (card.platform !== 'mail') {
      texts(card, ['detail', 'url'], 'contact', path);
      let url;
      try { url = new URL(card.url); } catch { fail('contact', `${path}.url needs a complete HTTP or HTTPS address.`); }
      if (!['http:', 'https:'].includes(url.protocol)) fail('contact', `${path}.url must use HTTP or HTTPS.`);
    }
  });
}

export function validatePosterContent(posters) {
  object(posters, 'posters', 'Content');
  object(posters.settings, 'posters', 'settings');
  const settings = posters.settings;
  for (const [key, min, max] of [
    ['postersPerClick', 1, 48], ['minSize', 20, 160], ['maxSize', 20, 160],
    ['minLaunchSpeed', 0, 1200], ['maxLaunchSpeed', 0, 1200], ['upwardBoost', 0, 800],
    ['launchRadius', 0, 200], ['starCount', 0, 80],
    ['cleanupAfterClicks', 1, 48], ['thanksDurationMs', 0, 60000],
    ['comboDurationMs', 0, 60000],
  ]) number(settings[key], `settings.${key}`, min, max);
  if (settings.maxSize < settings.minSize) fail('posters', 'settings.maxSize must be at least minSize.');
  if (settings.maxLaunchSpeed < settings.minLaunchSpeed) fail('posters', 'settings.maxLaunchSpeed must be at least minLaunchSpeed.');
  if (!Array.isArray(settings.starColors) || !settings.starColors.length) fail('posters', 'settings.starColors needs at least one color.');
  settings.starColors.forEach((value, index) => color(value, `settings.starColors[${index}]`));
  if (!Array.isArray(posters.designs) || !posters.designs.length) fail('posters', 'designs needs at least one poster.');
  posters.designs.forEach((design, index) => {
    const path = `designs[${index}]`;
    object(design, 'posters', path);
    if (!['type', 'grid', 'orbit', 'frames', 'editorial', 'shape'].includes(design.kind)) fail('posters', `${path}.kind must be type, grid, orbit, frames, editorial, or shape.`);
    texts(design, ['symbol', 'caption'], 'posters', path);
    for (const key of ['paper', 'ink', 'accent']) color(design[key], `${path}.${key}`);
    if (design.symbolColor !== undefined) color(design.symbolColor, `${path}.symbolColor`);
    if (design.image !== null) image(design.image, `${path}.image`);
  });
  texts(posters.messages, ['dirty', 'cleaning', 'completed', 'thanks', 'recovered', 'scattered', 'cleaningGod'], 'posters', 'messages');
  if (!Array.isArray(posters.messages.cleanCombos) || posters.messages.cleanCombos.length !== 10) fail('posters', 'messages.cleanCombos needs exactly 10 messages.');
  posters.messages.cleanCombos.forEach((message, index) => {
    text(message, 'posters', `messages.cleanCombos[${index}]`);
    if (!message.trim()) fail('posters', `messages.cleanCombos[${index}] cannot be empty.`);
  });
  object(posters.messageStyles, 'posters', 'messageStyles');
  const appearance = (style, path) => {
    object(style, 'posters', path);
    color(style.color, `${path}.color`);
    color(style.paper, `${path}.paper`);
    color(style.accent, `${path}.accent`);
    if (!MESSAGE_BOXES.includes(style.box)) fail('posters', `${path}.box must be ${MESSAGE_BOXES.join(', ')}.`);
    if (!Object.hasOwn(MESSAGE_FONTS, style.font)) fail('posters', `${path}.font must be sans, mono, serif, display, or rounded.`);
    number(style.size, `${path}.size`, 12, 32);
    if (![400, 500, 700, 900].includes(style.weight)) fail('posters', `${path}.weight must be 400, 500, 700, or 900.`);
    if (typeof style.italic !== 'boolean') fail('posters', `${path}.italic must be true or false.`);
  };
  for (const key of ['dirty', 'cleaning', 'completed', 'thanks', 'recovered', 'cleaningGod']) appearance(posters.messageStyles[key], `messageStyles.${key}`);
  if (!Array.isArray(posters.messageStyles.cleanCombos) || posters.messageStyles.cleanCombos.length !== 10) fail('posters', 'messageStyles.cleanCombos needs exactly 10 styles, one per combo message.');
  posters.messageStyles.cleanCombos.forEach((style, index) => appearance(style, `messageStyles.cleanCombos[${index}]`));
  texts(posters.actions, ['putAway', 'clean', 'dismiss', 'cleanupLabel'], 'posters', 'actions');
  text(posters.vacuumInstructions, 'posters', 'vacuumInstructions');
  texts(posters.crash, ['description', 'code', 'brand', 'reloadLabel', 'errorDetailsLabel', 'errorDetailsUrl'], 'posters', 'crash');
  object(posters.crash.platforms, 'posters', 'crash.platforms');
  for (const platform of ['windows', 'mac', 'ios', 'android', 'linux', 'chromeos', 'browser']) {
    texts(posters.crash.platforms[platform], ['symbol', 'title'], 'posters', `crash.platforms.${platform}`);
  }
  image(posters.crash.image, 'crash.image');
  let url;
  try { url = new URL(posters.crash.errorDetailsUrl); } catch { fail('posters', 'crash.errorDetailsUrl must be an HTTP or HTTPS address.'); }
  if (!['http:', 'https:'].includes(url.protocol)) fail('posters', 'crash.errorDetailsUrl must be an HTTP or HTTPS address.');
}
import { MESSAGE_FONTS, MESSAGE_BOXES } from '../src/scripts/cleanup-appearance.js';

