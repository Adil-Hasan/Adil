import { burstDesigns, canBurstDesigns } from './poster-playground.js';
import posterContent from '../../public/posters.json';

const canvas = document.querySelector('#dot-grid');
const context = canvas.getContext('2d');
const header = document.querySelector('.site-header');
const navigationLinks = [...header.querySelectorAll('a[href^="#"]')];
const sections = [...document.querySelectorAll('main section[id]')];
const button = document.querySelector('.physical-button');
const buttonFace = button.querySelector('.button-face');
const status = document.querySelector('#button-status');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

let width = 0;
let height = 0;
let unit = 1;
let grid = [];
let animation = 0;
let navigationFrame = 0;
let pointerInside = false;
let pressAnimation;
let statusTimer;
let ambientTimer;
let ripples = [];
let ambientWaves = [];
const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
const dotColors = Array.from({ length: 128 }, (_, value) => `rgb(${value}, ${value}, ${value})`);

function waveOffsets(wave) {
  return grid.map(point => {
    const x = point.x - width / 2;
    const y = point.y - height / 2;
    const across = -x * wave.directionY + y * wave.directionX;
    return x * wave.directionX + y * wave.directionY
      + Math.sin(across / (wave.wavelength * unit) + wave.phase) * wave.amplitude * unit;
  });
}

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

  const batches = [];
  const activeRipples = ripples.map(ripple => {
    const elapsed = now - ripple.started;
    return { ...ripple, front: elapsed * ripple.speed * unit,
      fade: (1 - elapsed / ripple.duration) * ripple.intensity };
  });
  for (let index = 0; index < grid.length; index++) {
    const point = grid[index];
    const dx = point.x - pointer.x;
    const dy = point.y - pointer.y;
    const squaredDistance = dx * dx + dy * dy;
    const t = squaredDistance >= radius * radius ? 1 : Math.sqrt(squaredDistance) / radius;
    const glow = motionPreference.matches ? 0 : 1 - t * t * (3 - 2 * t);
    let wave = 0;
    for (const traveling of travelingWaves) {
      const distance = Math.min(1, Math.abs(traveling.offsets[index] - traveling.front) / traveling.bandWidth);
      const strength = (1 - distance * distance * (3 - 2 * distance)) * traveling.fade * traveling.intensity;
      wave = Math.max(wave, strength);
    }
    for (const ripple of activeRipples) {
      const strength = Math.max(0, 1 - Math.abs(ripple.distances[index] - ripple.front) / (ripple.ringWidth * unit)) * ripple.fade;
      wave = Math.max(wave, strength);
    }
    const size = 15.76 * unit * 0.19 * (1 + glow + wave * 1.5);
    const color = Math.round(26 + glow * 17 + wave * 50);
    (batches[color] ||= []).push(point.x - size / 2, point.y - size / 2, size);
  }
  for (let color = 0; color < batches.length; color++) {
    const batch = batches[color];
    if (!batch) continue;
    context.fillStyle = dotColors[color];
    for (let index = 0; index < batch.length; index += 3) {
      context.fillRect(batch[index], batch[index + 1], batch[index + 2], batch[index + 2]);
    }
  }
  if ((moving || ripples.length || ambientWaves.length) && !motionPreference.matches && !document.hidden) requestDraw();
}

function requestDraw() {
  if (!animation && canBurstDesigns()) animation = requestAnimationFrame(draw);
}

function addRipple(x, y, { duration = 1100, speed = 0.4, ringWidth = 38, intensity = 1 } = {}) {
  ripples.push({ x, y, started: performance.now(), duration, speed, ringWidth, intensity,
    distances: grid.map(point => Math.hypot(point.x - x, point.y - y)) });
  requestDraw();
}

function scheduleAmbientWave(initial = false) {
  clearTimeout(ambientTimer);
  ambientTimer = undefined;
  if (motionPreference.matches || document.hidden || !context || !width || !height || !canBurstDesigns()) return;
  ambientTimer = setTimeout(() => {
    const angle = Math.random() * Math.PI * 2;
    const wave = {
      started: performance.now(),
      duration: 8000 + Math.random() * 4000,
      directionX: Math.cos(angle),
      directionY: Math.sin(angle),
      bandWidth: 60 + Math.random() * 35,
      amplitude: 30 + Math.random() * 30,
      wavelength: 140 + Math.random() * 100,
      phase: Math.random() * Math.PI * 2,
      intensity: 0.35 + Math.random() * 0.15,
    };
    wave.offsets = waveOffsets(wave);
    ambientWaves.push(wave);
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
  for (const wave of ambientWaves) wave.offsets = waveOffsets(wave);
  for (const ripple of ripples) ripple.distances = grid.map(point => Math.hypot(point.x - ripple.x, point.y - ripple.y));
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
  if (pressAnimation || !canBurstDesigns()) return;
  clearTimeout(statusTimer);
  const bounds = buttonFace.getBoundingClientRect();
  const restingStyle = getComputedStyle(buttonFace);
  const resting = { transform: restingStyle.transform, boxShadow: restingStyle.boxShadow };
  const canvasBounds = canvas.getBoundingClientRect();
  const pressed = { transform: 'translateY(0)', boxShadow: 'inset 0 1px 2px #0002, 0 0 0 #8a8a8a' };
  pressAnimation = buttonFace.animate([
    { ...resting, offset: 0 },
    { ...pressed, offset: .18 },
    { ...pressed, offset: .55 },
    { ...resting, offset: 1 },
  ], { duration: motionPreference.matches ? 0 : 440, easing: 'cubic-bezier(.2, .8, .2, 1)' });
  button.classList.add('is-pressed');
  button.setAttribute('aria-disabled', 'true');
  const release = () => {
    button.classList.remove('is-pressed');
    if (canBurstDesigns()) button.removeAttribute('aria-disabled');
    pressAnimation = undefined;
  };
  pressAnimation.finished.then(release, release);
  status.textContent = posterContent.messages.scattered;
  statusTimer = setTimeout(() => { status.textContent = ''; }, 1100);
  const x = bounds.left + bounds.width / 2;
  const y = bounds.top + bounds.height / 2;
  burstDesigns(x, y);
  if (motionPreference.matches || !canBurstDesigns()) return;
  addRipple(x - canvasBounds.left, y - canvasBounds.top);
});

button.addEventListener('keydown', (event) => {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
});
window.addEventListener('poster-crash', () => {
  cancelAnimationFrame(animation);
  animation = 0;
  clearTimeout(ambientTimer);
  ambientTimer = undefined;
  pressAnimation?.cancel();
});

motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) {
    pressAnimation?.finish();
  }
  ripples = [];
  ambientWaves = [];
  centerPointer();
  requestDraw();
  scheduleAmbientWave(true);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pressAnimation?.cancel();
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
  header.classList.toggle('is-scrolled', header.getBoundingClientRect().top <= 1);
}

function requestNavigationUpdate() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
}

window.addEventListener('scroll', requestNavigationUpdate, { passive: true });
window.addEventListener('resize', requestNavigationUpdate);
window.addEventListener('hashchange', requestNavigationUpdate);
new ResizeObserver(resize).observe(canvas);
updateNavigation();
// Temporary frame diagnostics, removed after profiling.
{
  const raf = window.requestAnimationFrame.bind(window);
  let sample;
  window.requestAnimationFrame = callback => raf(time => {
    const start = performance.now();
    callback(time);
    if (sample) {
      const name = callback.name || 'anonymous';
      (sample.work[name] ||= []).push(performance.now() - start);
      if (sample.times.at(-1) !== time) sample.times.push(time);
    }
  });
  new PerformanceObserver(list => {
    if (!sample) return;
    for (const e of list.getEntries()) sample.long.push({ duration:e.duration, render:e.duration - (e.renderStart - e.startTime), scripts:e.scripts.map(s=>({name:s.sourceFunctionName, duration:s.duration, forced:s.forcedStyleAndLayoutDuration})) });
  }).observe({type:'long-animation-frame'});
  button.addEventListener('click', () => {
    if (sample) return;
    sample = {work:{},times:[],long:[]};
    const started = performance.now();
    raf(() => raf(() => { if(sample) sample.firstPaint = performance.now()-started; }));
    setTimeout(() => {
      const gaps = sample.times.slice(1).map((t,i)=>t-sample.times[i]).sort((a,b)=>a-b);
      const stats = a => ({n:a.length,mean:+(a.reduce((s,n)=>s+n,0)/a.length).toFixed(2),p95:+a[Math.floor(a.length*.95)]?.toFixed(2),max:+a.at(-1)?.toFixed(2)});
      console.log('FRAME_PROFILE',JSON.stringify({cards:document.querySelectorAll('.burst-card').length,firstPaint:sample.firstPaint,gaps:stats(gaps),work:Object.fromEntries(Object.entries(sample.work).map(([k,v])=>[k,stats(v.sort((a,b)=>a-b))])),long:sample.long}));
      sample = null;
    },1500);
  },{capture:true});
}
