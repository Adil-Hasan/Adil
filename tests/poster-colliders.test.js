import test from 'node:test';
import assert from 'node:assert/strict';
import { collectPosterColliders } from '../src/scripts/poster-colliders.js';

// Minimal DOM boundary: geometry queries and text traversal are browser APIs.
function element(name, parent = null, { hidden = false, sticker = false, solid = false } = {}) {
  return {
    name, parent, hidden, sticker, solid,
    contains(other) { for (let node = other; node; node = node.parent) if (node === this) return true; return false; },
    closest() { for (let node = this; node; node = node.parent) if (node.hidden) return node; return null; },
    matches() { return this.sticker || this.solid; },
  };
}

function documentFixture(geometry, nodes) {
  return {
    querySelectorAll: () => geometry,
    querySelector: () => ({}),
    createTreeWalker: () => {
      let index = -1;
      return { nextNode() { return ++index < nodes.length; }, get currentNode() { return nodes[index]; } };
    },
    createRange: () => ({ selectNodeContents(node) { this.node = node; } }),
  };
}

test('new text and image content become collision targets without per-section registration', () => {
  const image = element('new image');
  const caption = element('new caption');
  const node = { textContent: 'New editable text', parentElement: caption };
  const colliders = collectPosterColliders(documentFixture([image], [node]));
  assert.deepEqual(colliders.map(target => target.element), [image, caption]);
  assert.equal(colliders[1].range.node, node);
});

test('solid custom surfaces avoid duplicate artwork contacts while animated PNGs remain tracked', () => {
  const frame = element('frame', null, { solid: true });
  const image = element('image', frame);
  const sticker = element('sticker', frame, { sticker: true });
  const targets = collectPosterColliders(documentFixture([frame, image, sticker], []));
  assert.deepEqual(targets.map(target => target.element), [frame, sticker]);
});

test('hidden content and empty text do not become obstacles', () => {
  const hidden = element('hidden', null, { hidden: true });
  const image = element('hidden image', hidden);
  const visible = element('visible');
  const nodes = [{ textContent: 'Hidden copy', parentElement: hidden }, { textContent: '  ', parentElement: visible }];
  assert.deepEqual(collectPosterColliders(documentFixture([image], nodes)), []);
});

test('solid contact links and the email button collide as whole cards without duplicate icons or labels', () => {
  const mail = element('mail button', null, { solid: true });
  const link = element('social link', null, { solid: true });
  const icon = element('social icon', link);
  const label = element('social label', link);
  const targets = collectPosterColliders(documentFixture([mail, link, icon], [{ textContent: 'GitHub', parentElement: label }]));
  assert.deepEqual(targets.map(target => target.element), [mail, link]);
});
