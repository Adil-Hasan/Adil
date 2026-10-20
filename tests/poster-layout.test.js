import test from 'node:test';
import assert from 'node:assert/strict';
import { createPoster } from '../src/scripts/poster-physics.js';
import { chatStage, cleanComboMessage, screenCoverage, crashPlatform } from '../src/scripts/poster-layout.js';
import { cleanupAppearance } from '../src/scripts/cleanup-appearance.js';
import { readFileSync } from 'node:fs';

test('the cleanup prompt starts after the configured number of presses', () => {
  assert.equal(chatStage({ presses: 6, posterCount: 72 }), 'hidden');
  assert.equal(chatStage({ presses: 7, posterCount: 84 }), 'dirty');
  assert.equal(chatStage({ presses: 20, posterCount: 240 }), 'dirty');
  assert.equal(chatStage({ presses: 2, posterCount: 24, threshold: 3 }), 'hidden');
  assert.equal(chatStage({ presses: 3, posterCount: 36, threshold: 3 }), 'dirty');
});

test('vacuum-button combos advance through ten entries then keep showing Cleaning GOD', () => {
  const messages = ['InstaClean', 'DoubleClean!', 'TrippleClean!!!', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  assert.equal(cleanComboMessage(1, messages), 'InstaClean');
  assert.equal(cleanComboMessage(2, messages), 'DoubleClean!');
  assert.equal(cleanComboMessage(3, messages), 'TrippleClean!!!');
  for (let click = 1; click <= 10; click++) assert.equal(cleanComboMessage(click, messages, 'Cleaning GOD!'), messages[click - 1]);
  assert.equal(cleanComboMessage(10, messages), 'ten');
  for (const click of [11, 12, 20, 100]) assert.equal(cleanComboMessage(click, messages, 'Cleaning GOD!'), 'Cleaning GOD!');
  assert.equal(cleanComboMessage(0, messages), null);
  assert.equal(cleanComboMessage(1, []), null);
});

test('each cleanup phase and combo level selects its configured typography', () => {
  const { messageStyles } = JSON.parse(readFileSync(new URL('../public/posters.json', import.meta.url), 'utf8'));
  for (const stage of ['dirty', 'cleaning', 'completed', 'thanks', 'recovered']) {
    assert.deepEqual(cleanupAppearance(stage, 0, messageStyles), messageStyles[stage]);
  }
  assert.equal(new Set(Object.values(messageStyles).filter(style => !Array.isArray(style)).map(style => `${style.color}:${style.font}`)).size, 6);
  for (let count = 1; count <= 10; count++) assert.deepEqual(cleanupAppearance('combo', count, messageStyles), messageStyles.cleanCombos[count - 1]);
  for (const count of [11, 12, 100]) assert.deepEqual(cleanupAppearance('combo', count, messageStyles), messageStyles.cleaningGod);
});

test('the complete cleanup sequence waits for the cleaner to be returned before saying thanks', () => {
  assert.equal(chatStage({ presses: 7, posterCount: 84 }), 'dirty');
  assert.equal(chatStage({ presses: 7, posterCount: 84, vacuumActive: true }), 'cleaning');
  assert.equal(chatStage({ presses: 7, posterCount: 1, vacuumActive: true }), 'cleaning');
  assert.equal(chatStage({ presses: 0, posterCount: 0, vacuumActive: true, cleaned: true }), 'completed');
  assert.equal(chatStage({ presses: 0, posterCount: 0, cleaned: true }), 'thanks');
  assert.equal(chatStage({ presses: 0, posterCount: 0 }), 'hidden');
});

test('putting the cleaner away early returns to the prompt, and picking it up resumes encouragement', () => {
  const state = { presses: 7, posterCount: 20 };
  assert.equal(chatStage({ ...state, vacuumActive: true }), 'cleaning');
  assert.equal(chatStage(state), 'dirty');
  assert.equal(chatStage({ ...state, vacuumActive: true }), 'cleaning');
});

test('new posters interrupt completion and active cleaning always keeps its encouragement', () => {
  assert.equal(chatStage({ presses: 1, posterCount: 12, cleaned: true, vacuumActive: true }), 'cleaning');
  assert.equal(chatStage({ presses: 7, posterCount: 84, cleaned: true }), 'dirty');
  assert.equal(chatStage({ presses: 0, posterCount: 0 }), 'hidden');
});

test('crash recovery remains separate from the cleanup cycle', () => {
  assert.equal(chatStage({ presses: 0, posterCount: 0, recovered: true }), 'recovered');
  assert.equal(chatStage({ presses: 7, posterCount: 84, recovered: true }), 'dirty');
  assert.equal(chatStage({ presses: 7, posterCount: 2, recovered: true, vacuumActive: true }), 'cleaning');
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
