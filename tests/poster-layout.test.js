import test from 'node:test';
import assert from 'node:assert/strict';
import { createPoster } from '../src/scripts/poster-physics.js';
import { chatStage, floorPile, cleanupBottom, screenCoverage, crashPlatform } from '../src/scripts/poster-layout.js';

function restingPoster(x, y) {
  const poster = createPoster({ x, y, size: 60 });
  poster.age = 3;
  poster.asleep = true;
  return poster;
}

test('the first chat waits for seven accepted presses and the warning waits for five more', () => {
  assert.equal(chatStage({ presses: 6, posterCount: 72 }), 'hidden');
  assert.equal(chatStage({ presses: 7, posterCount: 84 }), 'dirty');
  assert.equal(chatStage({ presses: 11, posterCount: 132 }), 'dirty');
  assert.equal(chatStage({ presses: 12, posterCount: 144 }), 'warning');
  assert.equal(chatStage({ presses: 20, posterCount: 240 }), 'warning');
});

test('cleaning and crash recovery have their own chat messages', () => {
  assert.equal(chatStage({ presses: 12, posterCount: 0, gift: true }), 'gift');
  assert.equal(chatStage({ presses: 0, posterCount: 0 }), 'hidden');
  assert.equal(chatStage({ presses: 0, posterCount: 0, recovered: true }), 'recovered');
  assert.equal(chatStage({ presses: 7, posterCount: 84, recovered: true }), 'dirty');
});

test('picking up the vacuum adds a reaction without revealing the chat before press seven', () => {
  assert.equal(chatStage({ presses: 6, posterCount: 72, pickup: true }), 'hidden');
  assert.equal(chatStage({ presses: 7, posterCount: 84, pickup: true }), 'pickup');
  assert.equal(chatStage({ presses: 12, posterCount: 144, pickup: true }), 'pickup');
  assert.equal(chatStage({ presses: 0, posterCount: 0, gift: true, pickup: true }), 'pickup');
  assert.equal(chatStage({ presses: 0, posterCount: 0, recovered: true, pickup: true }), 'recovered');
});

test('screen coverage counts visible paper once rather than counting stacked duplicates', () => {
  const poster = createPoster({ x: 64, y: 80, size: 128 });
  poster.age = 2;
  poster.scale = 1;
  const bounds = { width: 128, height: 160 };
  assert.equal(screenCoverage([], bounds), 0);
  assert.equal(screenCoverage([poster], bounds), 1);
  assert.equal(screenCoverage([poster, { ...poster }, { ...poster }], bounds), 1);
  assert.equal(screenCoverage([{ ...poster, x: -200 }], bounds), 0);
  assert.equal(screenCoverage([{ ...poster, mode: 'sucking' }], bounds), 0);
  const rotated = screenCoverage([{ ...poster, angle: Math.PI / 4 }], bounds);
  assert.ok(rotated > 0 && rotated < 1);
});

test('crash style follows the device rather than viewport width', () => {
  assert.equal(crashPlatform({ platform: 'Win32' }), 'windows');
  assert.equal(crashPlatform({ platform: 'MacIntel' }), 'mac');
  assert.equal(crashPlatform({ platform: 'MacIntel', maxTouchPoints: 5 }), 'ios');
  assert.equal(crashPlatform({ platform: 'iPhone' }), 'ios');
  assert.equal(crashPlatform({ platform: 'Linux arm', userAgent: 'Android 15' }), 'android');
  assert.equal(crashPlatform({ platform: 'Linux x86_64', userAgent: 'X11; CrOS x86_64' }), 'chromeos');
  assert.equal(crashPlatform({ platform: 'Linux x86_64' }), 'linux');
  assert.equal(crashPlatform({ platform: '' }), 'browser');
});

test('the bubble clears a connected pile without following airborne posters', () => {
  const pile = floorPile([restingPoster(550, 562.5), restingPoster(550, 487.5), restingPoster(550, 200)], 600);
  assert.equal(pile.length, 2);
  const bottom = cleanupBottom({ pile, left: 500, right: 780, height: 600, bubbleHeight: 130, baseBottom: 28 });
  assert.equal(bottom, 170);
  assert.ok(600 - bottom < Math.min(...pile.map(rect => rect.top)));
});

test('piles on the other side of the screen do not move the bubble', () => {
  const pile = floorPile([restingPoster(100, 562.5), restingPoster(100, 487.5)], 600);
  assert.equal(cleanupBottom({ pile, left: 500, right: 780, height: 600, bubbleHeight: 130, baseBottom: 28 }), 28);
});

test('bouncing posters do not count as a settled pile', () => {
  const bouncing = restingPoster(550, 562.5);
  bouncing.asleep = false;
  bouncing.touching = true;
  bouncing.vy = -300;
  assert.equal(floorPile([bouncing], 600).length, 0);
});

test('a deep pile keeps the bubble above cards that are still settling', () => {
  const posters = [restingPoster(550, 562.5), restingPoster(550, 487.5), restingPoster(550, 412.5)];
  for (const poster of posters) { poster.asleep = false; poster.touching = true; poster.vy = 80; }
  const pile = floorPile(posters, 600);
  assert.equal(pile.length, 3);
  assert.equal(cleanupBottom({ pile, left: 500, right: 780, height: 600, bubbleHeight: 130, baseBottom: 28 }), 245);
});

test('a deep pile cannot push the bubble beyond the top of the screen', () => {
  assert.equal(cleanupBottom({ pile: [{ left: 500, right: 780, top: 0, bottom: 600 }],
    left: 500, right: 780, height: 600, bubbleHeight: 130, baseBottom: 28, topInset: 90 }), 380);
});

test('the rising bubble leaves the burst button visible and reachable', () => {
  const bottom = cleanupBottom({ pile: [{ left: 124, right: 374, top: 550, bottom: 844 }],
    left: 124, right: 374, height: 844, bubbleHeight: 109, baseBottom: 18,
    avoidRect: { left: 140, right: 240, top: 430, bottom: 470 } });
  assert.ok(844 - bottom <= 410);
});
