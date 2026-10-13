const careerSection = document.querySelector('#career');
const careerFlow = careerSection.querySelector('.career-flow');
const chapters = [...careerSection.querySelectorAll('.career-chapter')];
const stops = [...careerSection.querySelectorAll('.career-stop')];
const nextChapter = careerSection.querySelector('.career-next');
const chapterNumber = careerSection.querySelector('.career-current-number');
const careerMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeChapter = 0;
let scrollFrame = 0;
let nextTarget = 1;

function setActiveChapter(index) {
  activeChapter = index;
  careerSection.style.setProperty('--career-accent', chapters[index].dataset.accent);
  chapterNumber.textContent = String(index + 1).padStart(2, '0');
  nextChapter.querySelector('span').textContent = index === chapters.length - 1 ? 'Back to start' : 'Next chapter';
  nextChapter.classList.toggle('is-last', index === chapters.length - 1);
  stops.forEach((stop, position) => {
    stop.classList.toggle('is-active', position === index);
    stop.classList.toggle('is-past', position < index);
    if (position === index) stop.setAttribute('aria-current', 'step');
    else stop.removeAttribute('aria-current');
    chapters[position].classList.toggle('is-active', position === index);
  });
}

function updateJourney() {
  scrollFrame = 0;
  if (document.hidden || document.body.classList.contains('is-crashed')) return;
  const bounds = careerSection.getBoundingClientRect();
  if (bounds.top > innerHeight || bounds.bottom < 0) return;
  const headerHeight = document.querySelector('.site-header').getBoundingClientRect().height;
  const readingLine = headerHeight + (innerHeight - headerHeight) * .46;
  const centers = chapters.map(chapter => {
    const rect = chapter.getBoundingClientRect();
    return rect.top + rect.height / 2;
  });
  let closest = 0;
  for (let index = 1; index < centers.length; index++) {
    if (Math.abs(centers[index] - readingLine) < Math.abs(centers[closest] - readingLine)) closest = index;
  }
  const distance = centers.at(-1) - centers[0];
  const progress = Math.max(0, Math.min(1, (readingLine - centers[0]) / distance));
  careerSection.style.setProperty('--career-progress', String(closest === chapters.length - 1 ? 1 : progress));
  if (closest !== activeChapter) setActiveChapter(closest);
  const firstAhead = chapters[0].getBoundingClientRect().top >= innerHeight * .75;
  nextTarget = firstAhead ? 0 : (activeChapter + 1) % chapters.length;
  nextChapter.querySelector('span').textContent = firstAhead ? 'Start journey' : activeChapter === chapters.length - 1 ? 'Back to start' : 'Next chapter';
}

function requestJourneyUpdate() {
  if (!scrollFrame && !document.hidden) scrollFrame = requestAnimationFrame(updateJourney);
}

function goToChapter(index) {
  chapters[index].classList.add('is-revealed');
  chapters[index].scrollIntoView({ block: innerWidth <= 980 ? 'start' : 'center', behavior: careerMotion.matches ? 'instant' : 'smooth' });
  requestJourneyUpdate();
}

stops.forEach((stop, index) => {
  stop.addEventListener('click', event => { event.preventDefault(); goToChapter(index); });
  stop.addEventListener('keydown', event => {
    const target = { ArrowDown: Math.min(index + 1, chapters.length - 1), ArrowRight: Math.min(index + 1, chapters.length - 1),
      ArrowUp: Math.max(index - 1, 0), ArrowLeft: Math.max(index - 1, 0), Home: 0, End: chapters.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    stops[target].focus({ preventScroll: true });
    goToChapter(target);
  });
});
nextChapter.addEventListener('click', () => goToChapter(nextTarget));
careerSection.querySelector('.career-replay').addEventListener('click', () => goToChapter(0));

const reveal = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-revealed');
    reveal.unobserve(entry.target);
  }
}, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
chapters.forEach(chapter => {
  reveal.observe(chapter);
  chapter.addEventListener('pointermove', event => {
    if (careerMotion.matches || event.pointerType !== 'mouse') return;
    const rect = chapter.getBoundingClientRect();
    chapter.style.setProperty('--tilt-x', `${(event.clientY - rect.top - rect.height / 2) / rect.height * -8}deg`);
    chapter.style.setProperty('--tilt-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 8}deg`);
  });
  chapter.addEventListener('pointerleave', () => {
    chapter.style.setProperty('--tilt-x', '0deg');
    chapter.style.setProperty('--tilt-y', '0deg');
  });
});
careerMotion.addEventListener('change', () => {
  if (careerMotion.matches) chapters.forEach(chapter => {
    chapter.classList.add('is-revealed');
    chapter.style.setProperty('--tilt-x', '0deg');
    chapter.style.setProperty('--tilt-y', '0deg');
  });
  requestJourneyUpdate();
});
window.addEventListener('scroll', requestJourneyUpdate, { passive: true });
window.addEventListener('resize', requestJourneyUpdate);
window.addEventListener('poster-crash', () => { cancelAnimationFrame(scrollFrame); scrollFrame = 0; });
document.addEventListener('visibilitychange', requestJourneyUpdate);
new ResizeObserver(requestJourneyUpdate).observe(careerFlow);
careerFlow.classList.add('is-ready');
if (careerMotion.matches) chapters.forEach(chapter => chapter.classList.add('is-revealed'));
setActiveChapter(0);
requestJourneyUpdate();
