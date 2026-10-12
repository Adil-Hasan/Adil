const canvas = document.querySelector('#dot-grid');
const context = canvas.getContext('2d');
const header = document.querySelector('.site-header');
const navigationLinks = [...header.querySelectorAll('a[href^="#"]')];
const sections = [...document.querySelectorAll('main section[id]')];
const button = document.querySelector('.physical-button');
const status = document.querySelector('#button-status');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

let width = 0;
let height = 0;
let unit = 1;
let grid = [];
let animation = 0;
let navigationFrame = 0;
let pointerInside = false;
let pressTimer;
let statusTimer;
let ambientTimer;
let ripples = [];
let ambientWaves = [];
const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

function draw(now = performance.now()) {
  animation = 0;
  if (!context) return;
  context.clearRect(0, 0, width, height);

  const moving = Math.hypot(pointer.targetX - pointer.x, pointer.targetY - pointer.y) > 0.1;
  pointer.x += (pointer.targetX - pointer.x) * 0.15;
  pointer.y += (pointer.targetY - pointer.y) * 0.15;
  const radius = 200 * unit;
  ripples = ripples.filter((ripple) => now - ripple.started <= ripple.duration);
  ambientWaves = ambientWaves.filter((wave) => now - wave.started <= wave.duration);
  const travelingWaves = ambientWaves.map((wave) => {
    const progress = (now - wave.started) / wave.duration;
    const bandWidth = wave.bandWidth * unit;
    const reach = (Math.abs(wave.directionX) * width + Math.abs(wave.directionY) * height) / 2 + bandWidth;
    return { ...wave, bandWidth, front: -reach + progress * reach * 2, fade: Math.sin(progress * Math.PI) };
  });

  for (const point of grid) {
    const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
    const t = Math.max(0, Math.min(1, distance / radius));
    const glow = motionPreference.matches ? 0 : 1 - t * t * (3 - 2 * t);
    let wave = 0;
    const x = point.x - width / 2;
    const y = point.y - height / 2;
    for (const traveling of travelingWaves) {
      const along = x * traveling.directionX + y * traveling.directionY;
      const across = -x * traveling.directionY + y * traveling.directionX;
      const bend = Math.sin(across / (traveling.wavelength * unit) + traveling.phase) * traveling.amplitude * unit;
      const distance = Math.min(1, Math.abs(along - traveling.front + bend) / traveling.bandWidth);
      const strength = (1 - distance * distance * (3 - 2 * distance)) * traveling.fade * traveling.intensity;
      wave = Math.max(wave, strength);
    }
    for (const ripple of ripples) {
      const elapsed = now - ripple.started;
      const fromPress = Math.hypot(point.x - ripple.x, point.y - ripple.y);
      const strength = Math.max(0, 1 - Math.abs(fromPress - elapsed * ripple.speed * unit) / (ripple.ringWidth * unit)) * (1 - elapsed / ripple.duration) * ripple.intensity;
      wave = Math.max(wave, strength);
    }
    const size = 15.76 * unit * 0.19 * (1 + glow + wave * 1.5);
    const color = Math.round(26 + glow * 17 + wave * 50);
    context.fillStyle = `rgb(${color}, ${color}, ${color})`;
    context.fillRect(point.x - size / 2, point.y - size / 2, size, size);
  }
  if ((moving || ripples.length || ambientWaves.length) && !motionPreference.matches && !document.hidden) requestDraw();
}

function requestDraw() {
  if (!animation) animation = requestAnimationFrame(draw);
}

function addRipple(x, y, { duration = 1100, speed = 0.4, ringWidth = 38, intensity = 1 } = {}) {
  ripples.push({ x, y, started: performance.now(), duration, speed, ringWidth, intensity });
  requestDraw();
}

function scheduleAmbientWave(initial = false) {
  clearTimeout(ambientTimer);
  ambientTimer = undefined;
  if (motionPreference.matches || document.hidden || !context || !width || !height) return;
  ambientTimer = setTimeout(() => {
    const angle = Math.random() * Math.PI * 2;
    ambientWaves.push({
      started: performance.now(),
      duration: 8000 + Math.random() * 4000,
      directionX: Math.cos(angle),
      directionY: Math.sin(angle),
      bandWidth: 60 + Math.random() * 35,
      amplitude: 30 + Math.random() * 30,
      wavelength: 140 + Math.random() * 100,
      phase: Math.random() * Math.PI * 2,
      intensity: 0.35 + Math.random() * 0.15,
    });
    requestDraw();
    scheduleAmbientWave();
  }, initial ? 500 : 2200 + Math.random() * 2000);
}

function resize() {
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  unit = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--unit'));
  if (!Number.isFinite(unit)) unit = width <= 600 ? 1 : Math.max(0.8, Math.min(width / 800, window.innerHeight / 600, 2));
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  const cell = 15.76 * unit;
  grid = [];
  for (let y = cell / 2; y < height; y += cell) {
    for (let x = cell / 2; x < width; x += cell) grid.push({ x, y });
  }
  if (!pointerInside) centerPointer();
  requestDraw();
  if (!ambientTimer) scheduleAmbientWave(true);
}

function centerPointer() {
  pointer.x = pointer.targetX = width / 2;
  pointer.y = pointer.targetY = height / 2;
}

window.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch' || motionPreference.matches) return;
  const bounds = canvas.getBoundingClientRect();
  pointerInside = true;
  pointer.targetX = event.clientX - bounds.left;
  pointer.targetY = event.clientY - bounds.top;
  requestDraw();
});

document.documentElement.addEventListener('pointerleave', () => {
  pointerInside = false;
  pointer.targetX = width / 2;
  pointer.targetY = height / 2;
  requestDraw();
});

button.addEventListener('click', () => {
  clearTimeout(pressTimer);
  clearTimeout(statusTimer);
  button.classList.add('is-pressed');
  pressTimer = setTimeout(() => button.classList.remove('is-pressed'), 160);
  status.textContent = 'Button pressed.';
  statusTimer = setTimeout(() => { status.textContent = ''; }, 1100);
  if (motionPreference.matches) return;
  const bounds = button.getBoundingClientRect();
  const canvasBounds = canvas.getBoundingClientRect();
  addRipple(bounds.left + bounds.width / 2 - canvasBounds.left, bounds.top + bounds.height / 2 - canvasBounds.top);
});

motionPreference.addEventListener('change', () => {
  ripples = [];
  ambientWaves = [];
  centerPointer();
  requestDraw();
  scheduleAmbientWave(true);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animation);
    animation = 0;
    ripples = [];
    ambientWaves = [];
  } else requestDraw();
  scheduleAmbientWave(true);
});
function updateNavigation() {
  navigationFrame = 0;
  const threshold = header.getBoundingClientRect().height + Math.min(120, window.innerHeight * 0.15);
  let currentSection = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top > threshold) break;
    currentSection = section;
  }
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
    currentSection = sections.at(-1);
  }
  for (const link of navigationLinks) {
    if (link.hash === `#${currentSection.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}

function requestNavigationUpdate() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
}

window.addEventListener('scroll', requestNavigationUpdate, { passive: true });
window.addEventListener('resize', requestNavigationUpdate);
window.addEventListener('hashchange', requestNavigationUpdate);
new ResizeObserver(resize).observe(canvas);
updateNavigation();
