import { posterExtents } from './poster-physics.js';

export const FIRST_CHAT_PRESS = 7;

export function cleanComboMessage(clicks, messages, finalMessage) {
  if (!Number.isInteger(clicks) || clicks < 1 || !messages.length) return null;
  return clicks > messages.length ? finalMessage ?? null : messages[clicks - 1];
}

export function chatStage({ presses, posterCount, vacuumActive = false, cleaned = false, recovered = false, threshold = FIRST_CHAT_PRESS }) {
  if (posterCount) {
    if (vacuumActive) return 'cleaning';
    if (presses >= threshold) return 'dirty';
  }
  if (cleaned && !posterCount) return vacuumActive ? 'completed' : 'thanks';
  if (recovered && presses < threshold) return 'recovered';
  return 'hidden';
}

export function screenCoverage(posters, { width, height }) {
  if (width <= 0 || height <= 0) return 0;
  const columns = Math.ceil(width / 32);
  const rows = Math.ceil(height / 32);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const occupied = new Uint8Array(columns * rows);
  let covered = 0;
  for (const poster of posters) {
    if (!['loose', 'dragging'].includes(poster.mode) || poster.age < .3) continue;
    const scale = poster.scale;
    const extent = posterExtents(poster);
    const startColumn = Math.max(0, Math.floor((poster.x - extent.x) / cellWidth));
    const endColumn = Math.min(columns - 1, Math.floor((poster.x + extent.x) / cellWidth));
    const startRow = Math.max(0, Math.floor((poster.y - extent.y) / cellHeight));
    const endRow = Math.min(rows - 1, Math.floor((poster.y + extent.y) / cellHeight));
    const cosine = Math.cos(poster.angle);
    const sine = Math.sin(poster.angle);
    for (let row = startRow; row <= endRow; row++) {
      for (let column = startColumn; column <= endColumn; column++) {
        const key = row * columns + column;
        if (occupied[key]) continue;
        const dx = (column + .5) * cellWidth - poster.x;
        const dy = (row + .5) * cellHeight - poster.y;
        if (Math.abs(dx * cosine + dy * sine) <= poster.halfWidth * scale
          && Math.abs(-dx * sine + dy * cosine) <= poster.halfHeight * scale) {
          occupied[key] = 1;
          covered++;
        }
      }
    }
  }
  return covered / occupied.length;
}

export function crashPlatform({ platform = '', userAgent = '', maxTouchPoints = 0 }) {
  const device = `${platform} ${userAgent}`;
  if (/Android/i.test(device)) return 'android';
  if (/iPhone|iPad|iPod/i.test(device) || (/Mac/i.test(platform) && maxTouchPoints > 1)) return 'ios';
  if (/Win/i.test(device)) return 'windows';
  if (/Mac/i.test(device)) return 'mac';
  if (/CrOS/i.test(device)) return 'chromeos';
  if (/Linux/i.test(device)) return 'linux';
  return 'browser';
}
