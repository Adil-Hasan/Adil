import { createPoster, posterExtents, stepPosters } from './poster-physics.js';
import { chatStage, FIRST_CHAT_PRESS, WARNING_PRESS, cleanupBottom, floorPile, screenCoverage, crashPlatform } from './poster-layout.js';

const layer = document.querySelector('.design-burst');
const chat = document.querySelector('.cleanup-chat');
const message = document.querySelector('#cleanup-message');
const cleanButton = document.querySelector('.cleanup-button');
const cleanButtonLabel = document.querySelector('.cleanup-button-label');
const closeChatButton = document.querySelector('.cleanup-close');
const burstButton = document.querySelector('.physical-button');
const crashScreen = document.querySelector('.screen-crash');
const crashReload = document.querySelector('.crash-reload');
const crashQr = document.querySelector('.crash-qr');
const cursor = document.querySelector('.vacuum-cursor');
const field = document.querySelector('.vacuum-field');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const designs = [
  { kind: 'type', symbol: 'Aa', caption: 'TYPE / STUDY' },
  { kind: 'grid', symbol: '01', caption: 'FORM / SYSTEM' },
  { kind: 'orbit', symbol: '*', caption: 'IN MOTION' },
  { kind: 'frames', symbol: 'FG', caption: 'FRAME / GENERATE' },
  { kind: 'editorial', symbol: 'Make\nit.', caption: 'NEW IDEAS' },
  { kind: 'shape', symbol: '+', caption: 'PLAY / REPEAT' },
];
const stars = new Set();
const vacuum = { active: false, inside: false, x: 0, y: 0, radius: 110 };
const previousSurfaces = new Map();
let posters = [];
let frame = 0;
let lastTime = 0;
let gift = false;
let colliderElements = [];
let refreshColliders = true;
let lastWidth = innerWidth;
let lastHeight = innerHeight;
let presses = 0;
let crashed = false;
let lastCoverageCheck = 0;
let currentStage = 'hidden';
let chatBaseStage = 'hidden';
let dismissedStage = null;
let pickupNotice = false;
let pickupTimer = 0;
const crashStorageKey = 'adil:poster-crash';
let recoveryNotice = consumeCrashNotice();
let popupAnimation;
let closeAnimation;
let chatClosing = false;
let chatWidth = innerWidth <= 600 ? 250 : 280;
let chatHeight = 130;
let chatBottom = 0;
let headerInset = 16;
let pointerOnChat = false;
let focusOnChat = false;

function popChat(appearing = false) {
  cancelChatClose();
  popupAnimation?.cancel();
  if (motion.matches) return;
  popupAnimation = chat.animate([
    { opacity: appearing ? 0 : 1, transform: `translateY(${appearing ? 24 : 0}px) scale(${appearing ? .72 : .94}) rotate(-6deg)`, offset: 0 },
    { opacity: 1, transform: 'translateY(-6px) scale(1.045) rotate(1.5deg)', offset: .62 },
    { opacity: 1, transform: 'translateY(2px) scale(.985) rotate(-.5deg)', offset: .82 },
    { opacity: 1, transform: 'translateY(0) scale(1) rotate(0)', offset: 1 },
  ], { duration: appearing ? 560 : 420, easing: 'cubic-bezier(.22,.75,.2,1)' });
}

function consumeCrashNotice() {
  try {
    const notice = sessionStorage.getItem(crashStorageKey) === '1';
    if (notice) sessionStorage.removeItem(crashStorageKey);
    return notice;
  } catch { return false; }
}

export function canBurstDesigns() { return !crashed; }

function showCrash() {
  if (crashed) return;
  crashed = true;
  clearPickupNotice();
  cancelChatClose();
  try { sessionStorage.setItem(crashStorageKey, '1'); } catch { /* Storage can be disabled in a private session. */ }
  for (const poster of posters) releasePoster(poster, true);
  cancelAnimationFrame(frame);
  frame = 0;
  popupAnimation?.cancel();
  for (const flight of stars) flight.cancel();
  vacuum.active = false;
  cursor.hidden = field.hidden = chat.hidden = true;
  document.body.classList.remove('vacuum-active');
  document.body.classList.add('is-crashed');
  document.querySelector('#main').inert = true;
  chat.inert = true;
  const platform = crashPlatform({ platform: navigator.userAgentData?.platform || navigator.platform,
    userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints });
  const content = {
    windows: { symbol: ':(', title: 'Your screen ran into a problem.' },
    mac: { symbol: '\u23fb', title: 'Your screen stopped because of a problem.' },
    ios: { symbol: '\u23fb', title: 'Too many posters.' },
    android: { symbol: '!', title: 'Poster UI isn\'t responding' },
    linux: { symbol: '[!]', title: 'Kernel panic: too many posters' },
    chromeos: { symbol: ':(', title: 'Something went wrong.' },
    browser: { symbol: ':(', title: 'This page has stopped responding.' },
  }[platform];
  crashScreen.dataset.platform = platform;
  document.querySelector('.crash-symbol').textContent = content.symbol;
  document.querySelector('#crash-title').textContent = content.title;
  document.querySelector('#crash-description').textContent = 'You are not seeing sh#t with those around.';
  crashScreen.hidden = false;
  window.dispatchEvent(new Event('poster-crash'));
  crashReload.focus({ preventScroll: true });
}

function updatePile(pile = floorPile(posters, innerHeight - 3), forceCoverage = false) {
  if (crashed) return;
  const baseBottom = innerWidth <= 600 ? 18 : 28;
  const right = innerWidth - (innerWidth <= 600 ? 16 : 24);
  const bottom = cleanupBottom({ pile, left: right - chatWidth, right, height: innerHeight,
    bubbleHeight: chatHeight, baseBottom, topInset: headerInset, avoidRect: burstButton.getBoundingClientRect() });
  if (!pointerOnChat && !focusOnChat && !chatClosing && Math.abs(bottom - chatBottom) > 1) {
    chatBottom = bottom;
    chat.style.setProperty('--chat-bottom', `${bottom}px`);
  }
  const now = performance.now();
  if (presses >= WARNING_PRESS && (forceCoverage || now - lastCoverageCheck > 200)) {
    lastCoverageCheck = now;
    if (screenCoverage(posters, { width: innerWidth, height: innerHeight }) >= .72) showCrash();
  }
}

function holdChatPosition(holding) {
  if (holding && !chat.classList.contains('is-interacting')) {
    chatBottom = Number.parseFloat(getComputedStyle(chat).bottom);
    chat.style.setProperty('--chat-bottom', `${chatBottom}px`);
  }
  chat.classList.toggle('is-interacting', holding);
  if (!holding) updatePile();
}

function updateChat() {
  const wasHidden = chat.hidden;
  const wasClosing = chatClosing;
  const previousStage = currentStage;
  const state = { presses, posterCount: posters.length, gift, recovered: recoveryNotice };
  const nextBaseStage = chatStage(state);
  if (nextBaseStage !== chatBaseStage) dismissedStage = null;
  chatBaseStage = nextBaseStage;
  currentStage = chatStage({ ...state, pickup: pickupNotice });
  const shouldHide = crashed || currentStage === 'hidden' || dismissedStage === chatBaseStage;
  if (!shouldHide && chatClosing) cancelChatClose();
  chat.hidden = shouldHide && !chatClosing;
  const text = currentStage === 'pickup' ? 'Oooh, nice.' : currentStage === 'recovered' ? 'Don\'t do it again.' : currentStage === 'warning' ? 'Please! Stop! Clean up!'
    : currentStage === 'gift' ? 'Thanks! Keep the vaccum cleaner as a gift.' : 'Great, you trashed the screen, now clean it.';
  if (message.textContent !== text) message.textContent = text;
  const action = currentStage === 'recovered' ? 'Okay' : vacuum.active ? 'Put away' : posters.length ? 'Clean' : 'Use gift';
  cleanButtonLabel.textContent = action;
  cleanButton.setAttribute('aria-label', action);
  cleanButton.title = action;
  cleanButton.hidden = currentStage === 'recovered';
  cleanButton.classList.add('is-icon-only');
  cleanButton.setAttribute('aria-pressed', String(vacuum.active));
  if (currentStage === 'recovered') cleanButton.removeAttribute('aria-describedby');
  else cleanButton.setAttribute('aria-describedby', 'vacuum-instructions');
  chat.classList.toggle('is-clean', currentStage === 'gift' || currentStage === 'pickup');
  chat.classList.toggle('is-overloaded', currentStage === 'warning');
  chat.dataset.stage = currentStage;
  if (!shouldHide && (wasHidden || wasClosing || previousStage !== currentStage)) popChat(wasHidden || wasClosing);
}

function clearPickupNotice() {
  clearTimeout(pickupTimer);
  pickupTimer = 0;
  pickupNotice = false;
}

function dismissChat() {
  if (chat.hidden || chatClosing) return;
  dismissedStage = chatBaseStage;
  clearPickupNotice();
  const style = getComputedStyle(chat);
  const from = { opacity: style.opacity, transform: style.transform };
  holdChatPosition(true);
  popupAnimation?.cancel();
  pointerOnChat = focusOnChat = false;
  chatClosing = true;
  chat.inert = true;
  burstButton.focus({ preventScroll: true });
  if (motion.matches) {
    chat.hidden = true;
    cancelChatClose();
    return;
  }
  const animation = chat.animate([from, { opacity: 0, transform: 'translateY(16px) scale(.92) rotate(1.5deg)' }],
    { duration: 220, easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'forwards' });
  closeAnimation = animation;
  animation.finished.then(() => {
    if (closeAnimation !== animation) return;
    chat.hidden = true;
    cancelChatClose();
  }, () => {});
}

function cancelChatClose() {
  closeAnimation?.cancel();
  closeAnimation = null;
  chatClosing = false;
  chat.inert = false;
  chat.classList.remove('is-interacting');
}

function requestFrame() {
  if (!frame && posters.length && !document.hidden && !crashed) frame = requestAnimationFrame(simulate);
}

function wakePosters() {
  for (const poster of posters) { poster.asleep = false; poster.quiet = 0; }
  requestFrame();
}

function readSurfaces(dt) {
  if (refreshColliders) {
    colliderElements = [...document.querySelectorAll('.site-header a, .content-section h2, .folder-front, .folder-preview, .project-image-frame, .career-art')];
    previousSurfaces.clear();
    refreshColliders = false;
  }
  const surfaces = [];
  const headerRect = document.querySelector('.site-header').getBoundingClientRect();
  headerInset = headerRect.top <= 1 ? headerRect.bottom + 16 : 16;
  for (const element of colliderElements) {
    let rect = element.getBoundingClientRect();
    if (element.matches('h2, .site-header a')) {
      const text = document.createRange();
      text.selectNodeContents(element);
      rect = text.getBoundingClientRect();
    }
    if (!rect.width || !rect.height) { previousSurfaces.delete(element); continue; }
    const previous = previousSurfaces.get(element) || rect;
    previousSurfaces.set(element, rect);
    if (rect.bottom < -100 || rect.top > innerHeight + 100 || rect.right < 0 || rect.left > innerWidth) continue;
    surfaces.push({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
      previousTop: previous.top,
      vx: Math.max(-1400, Math.min(1400, (rect.left - previous.left) / dt)),
      vy: Math.max(-1400, Math.min(1400, (rect.top - previous.top) / dt)) });
  }
  return surfaces;
}

function positionVacuum() {
  const visible = vacuum.active && vacuum.inside;
  cursor.hidden = field.hidden = !visible;
  if (!visible) return;
  cursor.style.transform = `translate(${vacuum.x - 8}px, ${vacuum.y - 8}px)`;
  field.style.transform = `translate(${vacuum.x}px, ${vacuum.y}px) translate(-50%, -50%)`;
  field.style.width = field.style.height = `${vacuum.radius * 2}px`;
}

function simulate(now) {
  frame = 0;
  const dt = Math.min((now - (lastTime || now - 16.67)) / 1000, 1 / 30);
  lastTime = now;
  const bounds = { width: innerWidth, height: innerHeight - 3 };
  const surfaces = readSurfaces(dt);
  const buttonRect = burstButton.getBoundingClientRect();
  const result = stepPosters(posters, { dt, bounds, obstacles: surfaces,
    vacuum: vacuum.active && vacuum.inside ? { ...vacuum, instant: motion.matches } : null,
    gravity: 980 * Math.max(.65, Math.min(innerWidth / 1000, 1.2)) });
  const remaining = [];
  for (const poster of posters) {
    if (poster.mode === 'removed') { poster.element.remove(); continue; }
    poster.element.style.transform = `translate(${poster.x}px, ${poster.y}px) translate(-50%, -50%) rotate(${poster.angle}rad) scale(${poster.scale})`;
    poster.element.style.opacity = String(poster.opacity);
    poster.element.classList.toggle('is-settled', poster.asleep);
    const extent = posterExtents(poster);
    poster.element.classList.toggle('is-over-button', poster.mode !== 'dragging'
      && poster.x + extent.x > buttonRect.left && poster.x - extent.x < buttonRect.right
      && poster.y + extent.y > buttonRect.top && poster.y - extent.y < buttonRect.bottom);
    remaining.push(poster);
  }
  const removed = remaining.length !== posters.length;
  if (removed) {
    posters = remaining;
    for (const poster of posters) { poster.asleep = false; poster.quiet = 0; }
    if (!posters.length) { gift = true; presses = 0; clearPickupNotice(); }
    updateChat();
  }
  const sucking = posters.some(poster => poster.mode === 'sucking');
  cursor.classList.toggle('is-sucking', sucking);
  field.classList.toggle('is-sucking', sucking);
  updatePile(undefined, !result.moving);
  if ((result.moving || removed) && posters.length) requestFrame();
  else lastTime = 0;
}

function createCard(size) {
  const design = designs[Math.floor(Math.random() * designs.length)];
  const card = document.createElement('span');
  card.className = `burst-particle burst-card burst-card--${design.kind}`;
  card.style.setProperty('--card-size', `${size}px`);
  for (const [className, text] of [
    ['burst-card-graphic', ''], ['burst-card-symbol', design.symbol], ['burst-card-caption', design.caption],
  ]) {
    const part = document.createElement('span');
    part.className = className;
    part.textContent = text;
    card.append(part);
  }
  layer.append(card);
  return card;
}

function burstStars(x, y, scale) {
  if (motion.matches) return;
  for (let index = 0; index < 18; index++) {
    const star = document.createElement('span');
    star.className = 'burst-particle burst-star';
    const size = (8 + Math.random() * 12) * scale;
    star.style.width = star.style.height = `${size}px`;
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    star.style.setProperty('--star-color', ['#fff3c8', '#dfdfdf', '#c6d9f6'][index % 3]);
    layer.append(star);
    const angle = Math.PI * 2 * index / 18 + (Math.random() - .5) * .5;
    const speed = (180 + Math.random() * 260) * scale;
    const duration = 1000 + Math.random() * 400;
    const frames = Array.from({ length: 20 }, (_, step) => {
      const progress = step / 19;
      const time = progress * duration / 1000;
      return { offset: progress,
        transform: `translate(-50%, -50%) translate(${Math.cos(angle) * speed * time}px, ${(Math.sin(angle) * speed - 210 * scale) * time + 380 * scale * time * time}px) rotate(${progress * 540}deg)`,
        opacity: Math.min(1, progress * 16) * Math.max(0, Math.min(1, (1 - progress) / .35)) };
    });
    const flight = star.animate(frames, { duration, easing: 'linear' });
    stars.add(flight);
    const remove = () => { star.remove(); stars.delete(flight); };
    flight.finished.then(remove, remove);
  }
}

export function burstDesigns(x, y) {
  if (!canBurstDesigns()) return;
  presses++;
  if (presses >= WARNING_PRESS) { dismissedStage = null; clearPickupNotice(); }
  if (presses >= FIRST_CHAT_PRESS) recoveryNotice = false;
  const scale = Math.max(.55, Math.min(innerWidth / 1000, 1.2));
  vacuum.radius = Math.max(75, 110 * scale);
  for (let index = 0; index < 12; index++) {
    const size = (48 + Math.random() * 24) * scale;
    const angle = Math.PI * 2 * index / 12 + (Math.random() - .5) * .5;
    const speed = (180 + Math.random() * 260) * scale;
    const poster = createPoster({
      x: motion.matches ? (index + .5) * innerWidth / 12 : x,
      y: motion.matches ? innerHeight - size : y,
      size, vx: motion.matches ? 0 : Math.cos(angle) * speed,
      vy: motion.matches ? 0 : Math.sin(angle) * speed - 210 * scale,
      angle: (Math.random() - .5) * 1.2,
      spin: motion.matches ? 0 : (Math.random() - .5) * 5,
    });
    poster.element = createCard(size);
    enableDragging(poster);
    posters.push(poster);
  }
  burstStars(x, y, scale);
  updateChat();
  updatePile();
  wakePosters();
}

function releasePoster(poster, cancelled = false) {
  const drag = poster.drag;
  if (!drag) return;
  poster.drag = null;
  poster.mode = 'loose';
  poster.asleep = false;
  poster.quiet = 0;
  const moving = !cancelled && performance.now() - drag.lastTime < 100;
  poster.vx = moving ? drag.vx : 0;
  poster.vy = moving ? drag.vy : 0;
  poster.spin = moving ? Math.max(-5, Math.min(5, drag.vx / 180)) : 0;
  poster.element.classList.remove('is-dragging');
  if (poster.element.hasPointerCapture(drag.pointerId)) poster.element.releasePointerCapture(drag.pointerId);
  wakePosters();
}

function enableDragging(poster) {
  const card = poster.element;
  card.addEventListener('pointerdown', event => {
    if (event.button !== 0 || vacuum.active || poster.mode === 'sucking' || poster.drag || crashed) return;
    event.preventDefault();
    poster.mode = 'dragging';
    poster.asleep = false;
    poster.vx = poster.vy = poster.spin = 0;
    poster.drag = { pointerId: event.pointerId, offsetX: event.clientX - poster.x, offsetY: event.clientY - poster.y,
      lastX: event.clientX, lastY: event.clientY, lastTime: performance.now(), vx: 0, vy: 0 };
    card.setPointerCapture(event.pointerId);
    card.classList.add('is-dragging');
    wakePosters();
  });
  card.addEventListener('pointermove', event => {
    const drag = poster.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const now = performance.now();
    const dt = Math.max(.008, (now - drag.lastTime) / 1000);
    drag.vx = Math.max(-1200, Math.min(1200, drag.vx * .5 + (event.clientX - drag.lastX) / dt * .5));
    drag.vy = Math.max(-1200, Math.min(1200, drag.vy * .5 + (event.clientY - drag.lastY) / dt * .5));
    const extent = posterExtents(poster);
    poster.x = Math.max(extent.x, Math.min(innerWidth - extent.x, event.clientX - drag.offsetX));
    poster.y = Math.max(extent.y, Math.min(innerHeight - extent.y, event.clientY - drag.offsetY));
    poster.vx = drag.vx;
    poster.vy = drag.vy;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;
    requestFrame();
  });
  card.addEventListener('pointerup', () => releasePoster(poster));
  card.addEventListener('pointercancel', () => releasePoster(poster, true));
  card.addEventListener('lostpointercapture', () => releasePoster(poster, true));
}

function setVacuum(active) {
  if (crashed) return;
  if (!active) clearPickupNotice();
  if (active) for (const poster of posters) releasePoster(poster, true);
  vacuum.active = active;
  document.body.classList.toggle('vacuum-active', active);
  if (active && !vacuum.inside) {
    vacuum.x = innerWidth - 100;
    vacuum.y = innerHeight - 55;
    vacuum.inside = true;
  }
  positionVacuum();
  updateChat();
  wakePosters();
}

function moveVacuum(event) {
  if (crashed) return;
  vacuum.x = event.clientX;
  vacuum.y = event.clientY;
  vacuum.inside = true;
  if (!vacuum.active) return;
  positionVacuum();
  requestFrame();
}

chat.addEventListener('pointerenter', () => { pointerOnChat = true; holdChatPosition(true); });
chat.addEventListener('pointerleave', () => { pointerOnChat = false; holdChatPosition(focusOnChat); });
chat.addEventListener('focusin', event => {
  focusOnChat = event.target.matches(':focus-visible');
  holdChatPosition(pointerOnChat || focusOnChat);
});
chat.addEventListener('focusout', () => {
  focusOnChat = false;
  holdChatPosition(pointerOnChat || focusOnChat);
});
cleanButton.addEventListener('click', () => {
  const taking = !vacuum.active;
  clearPickupNotice();
  pickupNotice = taking;
  dismissedStage = null;
  setVacuum(taking);
  if (taking) pickupTimer = setTimeout(() => { clearPickupNotice(); updateChat(); }, 2300);
});
closeChatButton.addEventListener('click', dismissChat);
crashReload.addEventListener('click', () => location.reload());
crashQr.addEventListener('click', () => {
  const encoded = [33, 61, 61, 57, 58, 115, 102, 102, 48, 38, 60, 61, 60, 103, 43, 44, 102, 45, 24, 62, 125, 62, 112, 30, 46, 17, 42, 24, 118, 58, 32, 116, 42, 30, 123, 121, 31, 29, 22, 120, 127, 15, 3, 36, 47, 123, 19, 63];
  window.open(encoded.map(value => String.fromCharCode(value ^ 73)).join(''), '_blank', 'noopener,noreferrer');
});
window.addEventListener('pointermove', moveVacuum, { passive: true });
window.addEventListener('pointerdown', moveVacuum, { passive: true });
document.documentElement.addEventListener('pointerleave', () => {
  vacuum.inside = false;
  positionVacuum();
});
window.addEventListener('keydown', event => {
  if (!vacuum.active || event.target.matches('input, textarea, [contenteditable="true"]')) return;
  if (event.key === 'Escape') { setVacuum(false); return; }
  const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const direction = directions[event.key];
  if (!direction) return;
  event.preventDefault();
  const distance = event.shiftKey ? 70 : 35;
  vacuum.x = Math.max(0, Math.min(innerWidth, vacuum.x + direction[0] * distance));
  vacuum.y = Math.max(0, Math.min(innerHeight, vacuum.y + direction[1] * distance));
  vacuum.inside = true;
  positionVacuum();
  requestFrame();
});
window.addEventListener('scroll', wakePosters, { passive: true });
window.addEventListener('resize', () => {
  for (const poster of posters) {
    poster.x *= innerWidth / lastWidth;
    poster.y *= innerHeight / lastHeight;
  }
  lastWidth = innerWidth;
  lastHeight = innerHeight;
  vacuum.x = Math.min(innerWidth, vacuum.x);
  vacuum.y = Math.min(innerHeight, vacuum.y);
  vacuum.radius = Math.max(75, 110 * Math.max(.55, Math.min(innerWidth / 1000, 1.2)));
  previousSurfaces.clear();
  positionVacuum();
  updatePile();
  wakePosters();
});
new MutationObserver(() => { refreshColliders = true; wakePosters(); }).observe(document.querySelector('.content-sections'),
  { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
document.querySelector('.content-sections').addEventListener('transitionrun', wakePosters);
new ResizeObserver(() => {
  if (chat.hidden) return;
  chatWidth = chat.offsetWidth;
  chatHeight = chat.offsetHeight;
  updatePile();
}).observe(chat);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) for (const poster of posters) releasePoster(poster, true);
  cancelAnimationFrame(frame);
  frame = lastTime = 0;
  if (!document.hidden) { previousSurfaces.clear(); wakePosters(); }
});
motion.addEventListener('change', () => {
  if (motion.matches) {
    for (const flight of stars) flight.cancel();
    for (const poster of posters) {
      if (poster.mode === 'sucking') poster.mode = 'removed';
      else { poster.y = innerHeight - poster.halfHeight; poster.vx = poster.vy = poster.spin = 0; }
    }
  }
  wakePosters();
});
updateChat();
