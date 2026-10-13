import { posterExtents } from './poster-physics.js';

export const FIRST_CHAT_PRESS = 7;
export const WARNING_PRESS = FIRST_CHAT_PRESS + 5;

export function chatStage({ presses, posterCount, gift = false, recovered = false, pickup = false }) {
  if (recovered && presses < FIRST_CHAT_PRESS) return 'recovered';
  if (!posterCount) return gift ? (pickup ? 'pickup' : 'gift') : 'hidden';
  if (pickup && presses >= FIRST_CHAT_PRESS) return 'pickup';
  if (presses >= WARNING_PRESS) return 'warning';
  return presses >= FIRST_CHAT_PRESS ? 'dirty' : 'hidden';
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
    const startColumn = Math.max(0, Math.floor((poster.x - extent.x * scale) / cellWidth));
    const endColumn = Math.min(columns - 1, Math.floor((poster.x + extent.x * scale) / cellWidth));
    const startRow = Math.max(0, Math.floor((poster.y - extent.y * scale) / cellHeight));
    const endRow = Math.min(rows - 1, Math.floor((poster.y + extent.y * scale) / cellHeight));
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

export function floorPile(posters, height) {
  const candidates = posters.filter(poster => poster.mode === 'loose' && poster.age > .5
    && (poster.asleep || (poster.touching && poster.vy > -120))).map(poster => {
    const extent = posterExtents(poster);
    return { left: poster.x - extent.x, right: poster.x + extent.x, top: poster.y - extent.y, bottom: poster.y + extent.y };
  }).sort((a, b) => b.bottom - a.bottom);
  const pile = [];
  for (const rect of candidates) {
    const supported = rect.bottom >= height - 6 || pile.some(base =>
      rect.left <= base.right + 8 && rect.right >= base.left - 8
      && rect.bottom >= base.top - 8 && rect.top < base.top);
    if (supported) pile.push(rect);
  }
  return pile;
}

export function cleanupBottom({ pile, left, right, height, bubbleHeight, baseBottom, topInset = 16, avoidRect }) {
  let pileTop = height;
  for (const rect of pile) {
    if (rect.right >= left - 12 && rect.left <= right + 12) pileTop = Math.min(pileTop, rect.top);
  }
  let wanted = Math.max(baseBottom, height - pileTop + 20);
  if (avoidRect && avoidRect.right >= left && avoidRect.left <= right
    && height - wanted > avoidRect.top - 20
    && height - wanted - bubbleHeight < avoidRect.bottom + 20
    && avoidRect.top >= topInset + bubbleHeight + 20) {
    wanted = height - avoidRect.top + 20;
  }
  return Math.max(baseBottom, Math.min(wanted, height - bubbleHeight - topInset));
}
