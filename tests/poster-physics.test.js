import test from 'node:test';
import assert from 'node:assert/strict';
import { createPoster, posterExtents, posterOverlap, stepPosters } from '../src/scripts/poster-physics.js';

const bounds = { width: 800, height: 600 };
function advance(posters, seconds, options = {}) {
  for (let frame = 0; frame < seconds * 60; frame++) {
    stepPosters(posters, { dt: 1 / 60, bounds, ...options });
  }
}

test('posters settle inside the viewport and persist', () => {
  const posters = [createPoster({ x: 400, y: 200, size: 60, vx: 350, vy: -200, angle: .6, spin: 2 })];
  advance(posters, 12);
  const poster = posters[0];
  const extent = posterExtents(poster);
  assert.equal(poster.mode, 'loose');
  assert.equal(poster.asleep, true);
  assert.ok(poster.x >= extent.x && poster.x <= bounds.width - extent.x);
  assert.ok(Math.abs(poster.y + extent.y - bounds.height) < .5);
});

test('new posters collide with each other on their first frame', () => {
  const a = createPoster({ x: 300, y: 250, size: 60, vx: 120 });
  const b = createPoster({ x: 350, y: 250, size: 60, vx: -120 });
  stepPosters([a, b], { dt: 1 / 60, bounds, gravity: 0 });
  assert.ok(a.vx < 0 && b.vx > 0, 'contact should reverse the approaching velocities immediately');
  assert.ok(!posterOverlap(a, b) || posterOverlap(a, b).overlap < 1);
});

test('new posters collide with page surfaces on their first frame', () => {
  const poster = createPoster({ x: 400, y: 300, size: 60, vy: 120 });
  const surface = { left: 300, right: 500, top: 330, bottom: 350, previousTop: 330, vx: 0, vy: 0 };
  const result = stepPosters([poster], { dt: 1 / 60, bounds, obstacles: [surface], gravity: 0 });
  assert.ok(result.impacts > 0);
  assert.ok(poster.y + posterExtents(poster).y <= surface.top + .5);
  assert.ok(poster.vy <= 0);
});

test('launch collisions follow the visible size as posters grow', () => {
  const a = createPoster({ x: 300, y: 250, size: 60, scale: .2 });
  const b = createPoster({ x: 325, y: 250, size: 60, scale: .2 });
  assert.equal(posterOverlap(a, b), null, 'small cards should not collide as full-size rectangles');
  assert.equal(posterExtents(a).x, 6);
  stepPosters([a, b], { dt: 1 / 60, bounds, gravity: 0 });
  assert.equal(a.x, 300);
  assert.equal(b.x, 325);
  advance([a, b], .15, { gravity: 0 });
  assert.equal(a.scale, 1);
  assert.equal(b.scale, 1);
  assert.ok(b.x - a.x > 59, 'growing cards should separate before the former collision delay');
});

test('separating axes distinguish rotated posters from overlapping bounding boxes', () => {
  const a = createPoster({ x: 100, y: 100, size: 60, angle: Math.PI / 4 });
  const b = createPoster({ x: 160, y: 160, size: 60, angle: Math.PI / 4 });
  assert.equal(posterOverlap(a, b), null);
  b.x = b.y = 125;
  assert.ok(posterOverlap(a, b).overlap > 0);
});

test('posters stack without falling through each other', () => {
  const posters = [0, 1, 2].map(index => createPoster({ x: 400, y: 120 + index * 100, size: 60 }));
  advance(posters, 15);
  for (let index = 0; index < posters.length; index++) {
    assert.ok(posters[index].asleep, `poster ${index} should sleep`);
    for (const other of posters.slice(index + 1)) {
      const overlap = posterOverlap(posters[index], other);
      assert.ok(!overlap || overlap.overlap < 1, 'settled posters should not overlap visibly');
    }
  }
  assert.ok(Math.max(...posters.map(poster => poster.y)) - Math.min(...posters.map(poster => poster.y)) > 140);
});

test('a surface entering from below pushes a settled poster up', () => {
  const poster = createPoster({ x: 400, y: 562.5, size: 60 });
  advance([poster], 2);
  const surface = { left: 0, right: 800, top: 540, bottom: 680, previousTop: 610, vx: 0, vy: -600 };
  const result = stepPosters([poster], { dt: 1 / 60, bounds, obstacles: [surface] });
  assert.ok(result.impacts > 0);
  assert.ok(poster.y + posterExtents(poster).y <= surface.top + .5);
  assert.ok(poster.vy < 0);
  assert.equal(poster.asleep, false);
  advance([poster], 8);
  assert.ok(Math.abs(poster.y + posterExtents(poster).y - bounds.height) < .5);
});

test('vacuum captures nearby posters and leaves distant posters alone', () => {
  const nearby = createPoster({ x: 390, y: 520, size: 60 });
  const distant = createPoster({ x: 80, y: 520, size: 60 });
  advance([nearby, distant], 1, { vacuum: { x: 400, y: 550, radius: 100 } });
  assert.equal(nearby.mode, 'removed');
  assert.equal(distant.mode, 'loose');
  assert.ok(nearby.scale < 1);
});

test('a poster tumbles off a content ledge instead of sleeping on it', () => {
  const poster = createPoster({ x: 400, y: 150, size: 60 });
  const surface = { left: 300, right: 500, top: 380, bottom: 405, previousTop: 380, vx: 0, vy: 0 };
  advance([poster], 12, { obstacles: [surface] });
  assert.ok(Math.abs(poster.y + posterExtents(poster).y - bounds.height) < .5);
  assert.equal(poster.asleep, true);
});

test('held posters stay at the pointer and push other posters', () => {
  const held = createPoster({ x: 400, y: 300, size: 60 });
  held.mode = 'dragging';
  held.age = 1;
  const other = createPoster({ x: 445, y: 300, size: 60 });
  other.age = 1;
  stepPosters([held, other], { dt: 1 / 60, bounds, gravity: 0 });
  assert.equal(held.x, 400);
  assert.equal(held.y, 300);
  assert.ok(other.x > 455);
  assert.equal(held.scale, 1.08);
  held.mode = 'loose';
  held.vx = 500;
  advance([held], .2);
  assert.ok(held.x > 490);
});

test('putting the vacuum away mid-capture returns the poster to physics', () => {
  const poster = createPoster({ x: 390, y: 520, size: 60 });
  advance([poster], .1, { vacuum: { x: 450, y: 550, radius: 100 } });
  assert.equal(poster.mode, 'sucking');
  advance([poster], 4);
  assert.equal(poster.mode, 'loose');
  assert.equal(poster.opacity, 1);
  assert.equal(poster.scale, 1);
  assert.equal(poster.asleep, true);
});

test('reduced motion removes captured posters without a suction animation', () => {
  const poster = createPoster({ x: 390, y: 520, size: 60 });
  stepPosters([poster], { dt: 1 / 60, bounds, vacuum: { x: 400, y: 550, radius: 100, instant: true } });
  assert.equal(poster.mode, 'removed');
  assert.equal(poster.x, 390);
  assert.equal(poster.y, 520);
});

test('a large pile remains finite and can be vacuumed completely', () => {
  const posters = Array.from({ length: 120 }, (_, index) => createPoster({
    x: 50 + (index * 83) % 700, y: 60 + index % 8 * 40,
    size: 40 + index % 4 * 6, angle: index * .17, vx: index % 2 ? 90 : -90,
  }));
  advance(posters, 12);
  for (const poster of posters) {
    assert.ok(Number.isFinite(poster.x) && Number.isFinite(poster.y));
    assert.ok(poster.y <= bounds.height);
  }
  advance(posters, 1, { vacuum: { x: 400, y: 300, radius: 1000 } });
  assert.ok(posters.every(poster => poster.mode === 'removed'));
});
