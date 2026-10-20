// Discover visible content instead of maintaining a list of section classes.
// Layout containers stay open; only rendered artwork, controls, and text collide.
export function collectPosterColliders(document) {
  const geometrySelector = 'main img, main svg, main button:not(.physical-button):not(.project-folder), '
    + '.folder-front, .folder-preview, .button-face, .burst-star, [data-poster-collision="solid"]';
  const ignored = '[data-poster-collision="none"], [hidden], .sr-only, .skip-link, script, style';
  const geometry = [...document.querySelectorAll(geometrySelector)].filter(element => !element.closest(ignored));
  // A marked solid surface replaces its descendants to avoid duplicate contacts.
  const surfaces = geometry.filter(element => element.matches('.career-sticker img, [data-poster-collision="solid"]')
    || !geometry.some(parent => parent !== element && parent.contains(element)));
  const colliders = surfaces.map(element => ({ element, range: null }));
  const main = document.querySelector('main');
  if (!main) return colliders;
  const walker = document.createTreeWalker(main, 4); // SHOW_TEXT
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const element = node.parentElement;
    if (!node.textContent.trim() || !element || element.closest(ignored)
      || surfaces.some(surface => surface.contains(element))) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    colliders.push({ element, range });
  }
  return colliders;
}
