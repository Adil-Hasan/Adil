document.querySelectorAll('#career .career-image').forEach(image => {
  const direction = Math.random() < .5 ? -1 : 1;
  const angle = direction * (1 + Math.random());
  image.style.setProperty('--career-image-tilt', `${angle.toFixed(2)}deg`);
});

const stickers = [...document.querySelectorAll('#career .career-sticker')];
const tipAnimations = new WeakMap();
const tipMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let openSticker;
let pinnedSticker;

function animateTip(sticker, opening) {
  const tip = sticker.querySelector('.career-sticker-tip');
  const style = !tip.hidden ? getComputedStyle(tip) : null;
  const start = style
    ? { opacity: style.opacity, translate: style.translate, scale: style.scale }
    : { opacity: 0, translate: '0 8px', scale: '.94' };
  tipAnimations.get(tip)?.cancel();
  tipAnimations.delete(tip);
  if (tipMotion.matches) {
    tip.hidden = !opening;
    return;
  }
  tip.hidden = false;
  const frames = opening
    ? [start, { opacity: 1, translate: '0 -2px', scale: '1.015', offset: .72 }, { opacity: 1, translate: '0 0', scale: '1' }]
    : [start, { opacity: 0, translate: '0 5px', scale: '.97' }];
  const animation = tip.animate(frames, {
    duration: opening ? 260 : 130,
    easing: opening ? 'cubic-bezier(.22,.75,.25,1)' : 'ease-in',
    fill: 'both',
  });
  tipAnimations.set(tip, animation);
  animation.finished.then(() => {
    if (tipAnimations.get(tip) !== animation) return;
    if (!opening) tip.hidden = true;
    tipAnimations.delete(tip);
    animation.cancel();
  }, () => {});
}

function closeSticker() {
  if (!openSticker) return;
  openSticker.querySelector('button').setAttribute('aria-expanded', 'false');
  animateTip(openSticker, false);
  openSticker = undefined;
  pinnedSticker = undefined;
}

function showSticker(sticker) {
  if (openSticker === sticker) return;
  closeSticker();
  openSticker = sticker;
  sticker.querySelector('button').setAttribute('aria-expanded', 'true');
  animateTip(sticker, true);
}

tipMotion.addEventListener('change', () => {
  if (tipMotion.matches) {
    for (const sticker of stickers) tipAnimations.get(sticker.querySelector('.career-sticker-tip'))?.finish();
  }
});

stickers.forEach(sticker => {
  const button = sticker.querySelector('button');
  sticker.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') showSticker(sticker);
  });
  sticker.addEventListener('pointerleave', () => {
    if (openSticker === sticker && pinnedSticker !== sticker && !sticker.contains(document.activeElement)) closeSticker();
  });
  button.addEventListener('focus', () => showSticker(sticker));
  button.addEventListener('click', () => {
    if (pinnedSticker === sticker) closeSticker();
    else {
      showSticker(sticker);
      pinnedSticker = sticker;
    }
  });
  sticker.addEventListener('focusout', event => {
    if (openSticker === sticker && !sticker.contains(event.relatedTarget)) closeSticker();
  });
});

document.addEventListener('pointerdown', event => {
  if (openSticker && !openSticker.contains(event.target)) closeSticker();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeSticker();
});
