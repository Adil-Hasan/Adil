import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutCareerStickers } from '../src/scripts/career-layout.js';

const card = (title, count = 4) => ({ title, image: { src: 'career/demo.png' }, stickers: Array.from({ length: count }, (_, index) => ({ src: `sticker-${index}.png` })) });

test('sticker layouts stay fixed across repeated renders and card reordering', () => {
  const first = card('Visual designer');
  const other = card('Product designer');
  const result = layoutCareerStickers(first);
  layoutCareerStickers(other);
  assert.deepEqual(layoutCareerStickers(first), result);
  assert.notDeepEqual(layoutCareerStickers(other), result);
  assert.ok(first.stickers.every(sticker => sticker.x === undefined));
});

test('four stickers occupy separate edge regions and the first two are diagonal', () => {
  for (let index = 0; index < 30; index++) {
    const result = layoutCareerStickers(card(`Card ${index}`));
    const corners = result.map(({ x, y }) => {
      assert.ok((x >= 4 && x <= 10) || (x >= 90 && x <= 96));
      assert.ok((y >= 12 && y <= 24) || (y >= 76 && y <= 88));
      return `${x < 50}:${y < 50}`;
    });
    assert.equal(new Set(corners).size, 4);
    assert.notEqual(result[0].x < 50, result[1].x < 50);
    assert.notEqual(result[0].y < 50, result[1].y < 50);
  }
});

test('adding stickers preserves the existing positions and accepts zero to four', () => {
  for (let count = 0; count <= 4; count++) {
    assert.deepEqual(layoutCareerStickers(card('Same card', count)), layoutCareerStickers(card('Same card')).slice(0, count));
  }
  assert.throws(() => layoutCareerStickers(card('Too many', 5)), /at most four/);
});

test('explicit coordinates remain available for manual placement', () => {
  const manual = card('Manual', 1);
  manual.stickers[0] = { ...manual.stickers[0], x: 15, y: 80 };
  assert.equal(layoutCareerStickers(manual)[0].x, 15);
  assert.equal(layoutCareerStickers(manual)[0].y, 80);
});
