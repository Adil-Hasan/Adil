import { createPoster, posterExtents, stepPosters } from './poster-physics.js';
import { chatStage, cleanComboMessage, screenCoverage, crashPlatform } from './poster-layout.js';
import posterContent from '../../public/posters.json';
import { collectPosterColliders } from './poster-colliders.js';
import { cleanupAppearance, MESSAGE_FONTS } from './cleanup-appearance.js';

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
const { designs, settings: burstSettings } = posterContent;
const stars = new Set();
const vacuum = { active: false, inside: false, x: 0, y: 0, radius: 110 };
const previousSurfaces = new Map();
let posters = [];
let frame = 0;
let lastTime = 0;
let cleaned = false;
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
let thanksTimer = 0;
let cleanComboCount = 0;
let comboMessage = null;
let comboTimer = 0;
const crashStorageKey = 'adil:poster-crash';
let recoveryNotice = consumeCrashNotice();
let popupAnimation;
let closeAnimation;
let chatClosing = false;

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
  clearThanksTimer();
  clearCleanCombo(true);
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
  const content = posterContent.crash.platforms[platform];
  crashScreen.dataset.platform = platform;
  document.querySelector('.crash-symbol').textContent = content.symbol;
  document.querySelector('#crash-title').textContent = content.title;
  document.querySelector('#crash-description').textContent = posterContent.crash.description;
  crashScreen.hidden = false;
  window.dispatchEvent(new Event('poster-crash'));
  crashReload.focus({ preventScroll: true });
}

function checkCoverage(forceCoverage = false) {
  if (crashed) return;
  const now = performance.now();
  if (presses >= burstSettings.cleanupAfterClicks + 5 && (forceCoverage || now - lastCoverageCheck > 200)) {
    lastCoverageCheck = now;
    if (screenCoverage(posters, { width: innerWidth, height: innerHeight }) >= .72) showCrash();
  }
}

function updateChat(comboClick = false) {
  const wasHidden = chat.hidden;
  const wasClosing = chatClosing;
  const previousStage = currentStage;
  const state = { presses, posterCount: posters.length, vacuumActive: vacuum.active, cleaned, recovered: recoveryNotice, threshold: burstSettings.cleanupAfterClicks };
  const nextBaseStage = chatStage(state);
  if (nextBaseStage !== chatBaseStage) dismissedStage = null;
  chatBaseStage = nextBaseStage;
  currentStage = vacuum.active && comboMessage ? 'combo' : nextBaseStage;
  const shouldHide = crashed || currentStage === 'hidden' || dismissedStage === chatBaseStage;
  if (!shouldHide && chatClosing) cancelChatClose();
  chat.hidden = shouldHide && !chatClosing;
  if (currentStage === 'hidden') return;
  const text = currentStage === 'combo' ? comboMessage : posterContent.messages[currentStage] ?? posterContent.messages.dirty;
  const messageChanged = message.textContent !== text;
  if (messageChanged) message.textContent = text;
  const appearance = cleanupAppearance(currentStage, cleanComboCount, posterContent.messageStyles);
  chat.dataset.box = appearance.box;
  chat.style.setProperty('--box-paper', appearance.paper);
  chat.style.setProperty('--box-accent', appearance.accent);
  message.style.setProperty('--message-color', appearance.color);
  message.style.setProperty('--message-font', MESSAGE_FONTS[appearance.font]);
  message.style.setProperty('--message-size', `${appearance.size}px`);
  message.style.setProperty('--message-weight', String(appearance.weight));
  message.style.setProperty('--message-style', appearance.italic ? 'italic' : 'normal');
  const action = posterContent.actions[vacuum.active ? 'putAway' : 'clean'];
  cleanButtonLabel.textContent = action;
  cleanButton.setAttribute('aria-label', action);
  cleanButton.title = action;
  cleanButton.hidden = ['recovered', 'thanks', 'hidden'].includes(currentStage);
  cleanButton.classList.add('is-icon-only');
  cleanButton.setAttribute('aria-pressed', String(vacuum.active));
  if (currentStage === 'recovered') cleanButton.removeAttribute('aria-describedby');
  else cleanButton.setAttribute('aria-describedby', 'vacuum-instructions');
  chat.classList.toggle('is-clean', ['cleaning', 'completed', 'thanks', 'combo'].includes(currentStage));
  chat.classList.remove('is-overloaded');
  chat.dataset.stage = currentStage;
  chat.dataset.comboTier = currentStage === 'combo' ? cleanComboCount > 10 ? 'god' : String(cleanComboCount) : '';
  if (!shouldHide && (wasHidden || wasClosing || previousStage !== currentStage || (currentStage === 'combo' && (messageChanged || comboClick)))) popChat(wasHidden || wasClosing);
}

function clearCleanCombo(resetCount = false) {
  clearTimeout(comboTimer);
  comboTimer = 0;
  comboMessage = null;
  if (resetCount) cleanComboCount = 0;
}

function showCleanCombo() {
  clearCleanCombo();
  cleanComboCount = Math.min(cleanComboCount + 1, 11);
  comboMessage = cleanComboMessage(cleanComboCount, posterContent.messages.cleanCombos, posterContent.messages.cleaningGod);
  dismissedStage = null;
  comboTimer = setTimeout(() => {
    comboTimer = 0;
    comboMessage = null;
    updateChat();
  }, burstSettings.comboDurationMs);
}

function clearThanksTimer() {
  clearTimeout(thanksTimer);
  thanksTimer = 0;
}

function dismissChat({ restoreFocus = true } = {}) {
  if (chat.hidden || chatClosing) return;
  dismissedStage = chatBaseStage;
  clearThanksTimer();
  clearCleanCombo();
  const style = getComputedStyle(chat);
  const from = { opacity: style.opacity, transform: style.transform };
  popupAnimation?.cancel();
  chatClosing = true;
  chat.inert = true;
  if (restoreFocus) burstButton.focus({ preventScroll: true });
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
    colliderElements = collectPosterColliders(document);
    previousSurfaces.clear();
    refreshColliders = false;
  }
  const surfaces = [];
  for (const { element, range } of colliderElements) {
    const rects = (range ? [...range.getClientRects()] : [element.getBoundingClientRect()])
      .filter(rect => rect.width && rect.height);
    const key = range || element;
    const previousRects = previousSurfaces.get(key) || [];
    previousSurfaces.set(key, rects);
    const repel = element.classList.contains('button-face');
    const launchThrough = Boolean(element.closest('.hero-quote'));
    const animated = element.matches('.career-sticker img, .burst-star') && !motion.matches;
    rects.forEach((rect, index) => {
      if (rect.bottom < -100 || rect.top > innerHeight + 100 || rect.right < 0 || rect.left > innerWidth) return;
      const previous = previousRects[index] || rect;
      const padding = repel ? 6 : 0;
      surfaces.push({ left: rect.left - padding, right: rect.right + padding,
        top: rect.top - padding, bottom: rect.bottom + padding, repel, launchThrough, animated,
        previousTop: previous.top - padding,
        vx: Math.max(-1400, Math.min(1400, (rect.left - previous.left) / dt)),
        vy: Math.max(-1400, Math.min(1400, (rect.top - previous.top) / dt)) });
    });
  }
  return surfaces;
}

function positionVacuum() {
  const visible = vacuum.active && vacuum.inside;
  cursor.hidden = field.hidden = !visible;
  if (!visible) return;
  cursor.style.transform = `translate(${vacuum.x - 8}px, ${vacuum.y - 43}px)`;
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
    if (!posters.length) { cleaned = true; presses = 0; clearThanksTimer(); }
    updateChat();
  }
  const sucking = posters.some(poster => poster.mode === 'sucking');
  cursor.classList.toggle('is-sucking', sucking);
  field.classList.toggle('is-sucking', sucking);
  checkCoverage(!result.moving);
  // A floating sticker can touch a settled poster, so keep checking while visible.
  if ((result.moving || removed || surfaces.some(surface => surface.animated)) && posters.length) requestFrame();
  else lastTime = 0;
}

function createCard(size) {
  const design = designs[Math.floor(Math.random() * designs.length)];
  const card = document.createElement('span');
  card.className = `burst-particle burst-card burst-card--${design.kind}`;
  card.style.setProperty('--card-size', `${size}px`);
  card.style.setProperty('--card-paper', design.paper);
  card.style.setProperty('--card-ink', design.ink);
  card.style.setProperty('--card-accent', design.accent);
  card.style.setProperty('--card-symbol', design.symbolColor ?? design.ink);
  if (design.image) {
    const image = document.createElement('img');
    image.className = 'burst-card-image';
    image.src = `${import.meta.env.BASE_URL}${design.image.src.replace(/^\.?\//, '')}`;
    image.alt = design.image.alt;
    image.draggable = false;
    card.append(image);
    return card;
  }
  for (const [className, text] of [
    ['burst-card-graphic', ''], ['burst-card-symbol', design.symbol], ['burst-card-caption', design.caption],
  ]) {
    const part = document.createElement('span');
    part.className = className;
    part.textContent = text;
    card.append(part);
  }
  return card;
}

function burstStars(x, y, scale) {
  if (motion.matches) return;
  for (let index = 0; index < burstSettings.starCount; index++) {
    const star = document.createElement('span');
    star.className = 'burst-particle burst-star';
    const size = (8 + Math.random() * 12) * scale;
    star.style.width = star.style.height = `${size}px`;
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    star.style.setProperty('--star-color', burstSettings.starColors[index % burstSettings.starColors.length]);
    layer.append(star);
    const angle = Math.PI * 2 * index / burstSettings.starCount + (Math.random() - .5) * .5;
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
  clearThanksTimer();
  cleaned = false;
  presses++;
  if (presses >= burstSettings.cleanupAfterClicks) { dismissedStage = null; recoveryNotice = false; }
  const scale = Math.max(.55, Math.min(innerWidth / 1000, 1.2));
  vacuum.radius = Math.max(75, 110 * scale);
  const cards = document.createDocumentFragment();
  for (let index = 0; index < burstSettings.postersPerClick; index++) {
    const size = (burstSettings.minSize + Math.random() * (burstSettings.maxSize - burstSettings.minSize)) * scale;
    const launchAngle = Math.PI * 2 * index / burstSettings.postersPerClick;
    const angle = launchAngle + (Math.random() - .5) * .5;
    const speed = (burstSettings.minLaunchSpeed + Math.random() * (burstSettings.maxLaunchSpeed - burstSettings.minLaunchSpeed)) * scale;
    // A small ring gives each growing card room to launch without collision immunity.
    const launchRadius = burstSettings.launchRadius * scale;
    const poster = createPoster({
      x: motion.matches ? (index + .5) * innerWidth / burstSettings.postersPerClick : x + Math.cos(launchAngle) * launchRadius,
      y: motion.matches ? innerHeight - size : y + Math.sin(launchAngle) * launchRadius,
      size, vx: motion.matches ? 0 : Math.cos(angle) * speed,
      vy: motion.matches ? 0 : Math.sin(angle) * speed - burstSettings.upwardBoost * scale,
      angle: (Math.random() - .5) * 1.2,
      spin: motion.matches ? 0 : (Math.random() - .5) * 5,
      scale: motion.matches ? 1 : .2,
      leavingHero: !motion.matches,
    });
    poster.element = createCard(size);
    poster.element.style.transform = `translate(${poster.x}px, ${poster.y}px) translate(-50%, -50%) rotate(${poster.angle}rad) scale(${poster.scale})`;
    poster.element.classList.add('is-over-button');
    cards.append(poster.element);
    enableDragging(poster);
    posters.push(poster);
  }
  layer.append(cards);
  burstStars(x, y, scale);
  if (vacuum.active) showCleanCombo();
  updateChat(vacuum.active);
  checkCoverage();
  // New posters are awake; collisions will wake any settled posters they hit.
  requestFrame();
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
  const returning = vacuum.active && !active;
  clearThanksTimer();
  clearCleanCombo(true);
  if (active) for (const poster of posters) releasePoster(poster, true);
  vacuum.active = active;
  dismissedStage = null;
  document.body.classList.toggle('vacuum-active', active);
  if (active && !vacuum.inside) {
    vacuum.x = innerWidth - 100;
    vacuum.y = innerHeight - 55;
    vacuum.inside = true;
  }
  positionVacuum();
  updateChat();
  wakePosters();
  if (returning && cleaned && !posters.length) {
    thanksTimer = setTimeout(() => {
      thanksTimer = 0;
      if (!cleaned || vacuum.active || posters.length) return;
      dismissChat({ restoreFocus: chat.contains(document.activeElement) });
      cleaned = false;
      updateChat();
    }, burstSettings.thanksDurationMs);
  }
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

cleanButton.addEventListener('click', () => {
  setVacuum(!vacuum.active);
});
closeChatButton.addEventListener('click', dismissChat);
crashReload.addEventListener('click', () => location.reload());
crashQr.addEventListener('click', () => {
  window.open(posterContent.crash.errorDetailsUrl, '_blank', 'noopener,noreferrer');
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
  checkCoverage(true);
  wakePosters();
});
new MutationObserver(() => { refreshColliders = true; wakePosters(); }).observe(document.body,
  { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'src', 'data-poster-collision'], characterData: true });
document.querySelector('#main').addEventListener('transitionrun', wakePosters);
document.querySelector('#main').addEventListener('load', wakePosters, true);
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
