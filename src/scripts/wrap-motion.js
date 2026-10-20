// Animate layout changes separately from each card's own tilt and hover transform.
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const itemSelector = '.project-folder, .project-image, .career-entry, .contact-card';
const states = [...document.querySelectorAll('.project-folders, .project-images, .career-cards, .contact-cards')]
  .map(container => ({ container, width: undefined, positions: new Map() }));
const animations = new Map();

function translation(item) {
  const [x, y] = getComputedStyle(item).translate.split(/\s+/).map(Number.parseFloat);
  return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
}

function stop(item) {
  const animation = animations.get(item);
  animations.delete(item);
  delete item.dataset.reflowing;
  animation?.cancel();
}

function measure(state, animate) {
  const { container } = state;
  const rect = container.getBoundingClientRect();
  const visible = container.getClientRects().length && rect.width > 0;
  const resizing = visible && state.width !== undefined && Math.abs(rect.width - state.width) > .01;
  const next = new Map();
  const moves = [];
  if (visible) {
    for (const item of container.children) {
      if (!item.matches(itemSelector)) continue;
      const bounds = item.getBoundingClientRect();
      const offset = translation(item);
      const position = { x: bounds.left + window.scrollX - offset.x, y: bounds.top + window.scrollY - offset.y };
      const previous = state.positions.get(item);
      next.set(item, position);
      if (!animate || !resizing || !previous || motion.matches) continue;
      const dx = previous.x - position.x;
      const dy = previous.y - position.y;
      if (Math.hypot(dx, dy) > .5) moves.push({ item, x: dx + offset.x, y: dy + offset.y });
    }
  }
  for (const item of state.positions.keys()) if (!next.has(item)) stop(item);
  state.positions = next;
  state.width = visible ? rect.width : undefined;
  return moves;
}

function play(moves) {
  for (const { item, x, y } of moves) {
    stop(item);
    item.dataset.reflowing = 'true';
    const animation = item.animate([
      { translate: `${x}px ${y}px` },
      { translate: '0px 0px' },
    ], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
    animations.set(item, animation);
    animation.finished.then(() => {
      if (animations.get(item) === animation) stop(item);
    }, () => {});
  }
  if (moves.length) document.dispatchEvent(new Event('layout-motion-start'));
}

const resizeObserver = new ResizeObserver(entries => {
  // Apply the inverse translation before paint, with all reads before writes.
  const changed = new Set(entries.map(entry => entry.target));
  play(states.filter(state => changed.has(state.container)).flatMap(state => measure(state, true)));
});

for (const state of states) {
  measure(state, false);
  resizeObserver.observe(state.container);
  new MutationObserver(() => { measure(state, false); }).observe(state.container, { childList: true });
}

motion.addEventListener('change', () => {
  for (const item of animations.keys()) stop(item);
  for (const state of states) measure(state, false);
});
