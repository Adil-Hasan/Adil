const projectsSection = document.querySelector('#projects');
const folderContainer = document.querySelector('#project-folders');
const imageContainer = document.querySelector('#project-images');
const projectTitle = document.querySelector('#projects-title');
const projectToolbar = document.querySelector('.projects-toolbar');
const backButton = document.querySelector('.projects-back');
const projectMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeCard;
let changingView = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function scrollToProjects() {
  // A tall folder or image view can shrink; keep its navigation on screen.
  projectsSection.scrollIntoView({ block: 'start', behavior: projectMotion.matches ? 'instant' : 'smooth' });
}

async function transitionProjectView(outgoing, incoming, update, focusTarget, returning = false) {
  if (changingView) return;
  changingView = true;
  projectsSection.setAttribute('aria-busy', 'true');
  outgoing.inert = true;
  try {
    if (!projectMotion.matches) {
      await outgoing.animate([
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: `translateY(${returning ? 10 : -10}px)` },
      ], { duration: 140, easing: 'ease-in' }).finished;
    }
    outgoing.hidden = true;
    update();
    incoming.hidden = false;
    scrollToProjects();
    focusTarget.focus({ preventScroll: true });
    if (!projectMotion.matches) {
      await incoming.animate([
        { opacity: 0, transform: `translateY(${returning ? -16 : 16}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished;
    }
  } finally {
    outgoing.inert = false;
    projectsSection.setAttribute('aria-busy', 'false');
    changingView = false;
  }
}

function openFolder(folder, card) {
  if (changingView) return;
  imageContainer.setAttribute('aria-label', `${folder.title} images`);
  imageContainer.replaceChildren(...folder.images.map((image) => {
    const figure = element('figure', 'project-image');
    const preview = element('img');
    preview.src = image.src;
    preview.alt = image.alt;
    preview.loading = 'lazy';
    preview.decoding = 'async';
    const frame = element('div', 'project-image-frame');
    frame.append(preview);
    figure.append(frame, element('figcaption', 'project-image-name', image.title || image.alt));
    preview.addEventListener('error', () => {
      const fallback = element('span', 'project-image-error', 'Image unavailable');
      fallback.setAttribute('role', 'status');
      frame.replaceChildren(fallback);
    }, { once: true });
    return figure;
  }));
  transitionProjectView(folderContainer, imageContainer, () => {
    activeCard = card;
    projectTitle.textContent = folder.title;
    projectToolbar.hidden = false;
  }, backButton);
}

function closeFolder() {
  if (changingView || !activeCard) return;
  transitionProjectView(imageContainer, folderContainer, () => {
    imageContainer.replaceChildren();
    projectTitle.textContent = 'Projects';
    projectToolbar.hidden = true;
    activeCard = undefined;
  }, activeCard, true);
}

function createFolder(folder) {
  const card = element('button', 'project-folder');
  card.type = 'button';
  card.setAttribute('aria-label', `Open ${folder.title}`);
  card.setAttribute('aria-controls', 'project-images');
  if (/^#[\da-f]{6}$/i.test(folder.color || '')) card.style.setProperty('--folder-color', folder.color);
  const scene = element('span', 'folder-scene');
  scene.setAttribute('aria-hidden', 'true');
  scene.append(element('span', 'folder-shadow'), element('span', 'folder-back'));
  folder.images.slice(0, 3).forEach((image) => {
    const preview = element('img', 'folder-preview');
    preview.src = image.src;
    preview.alt = '';
    preview.loading = 'lazy';
    preview.decoding = 'async';
    scene.append(preview);
  });
  const front = element('span', 'folder-front');
  // Raised tab, curved opening, and rounded base form the folder silhouette.
  front.innerHTML = '<svg viewBox="0 0 320 170" preserveAspectRatio="none" aria-hidden="true"><path d="M12 1 H88 Q97 1 103 10 L112 21 C135 23 147 23 170 22 S250 16 308 16 Q319 16 319 28 L312 155 Q311 169 297 169 H23 Q9 169 8 155 L1 13 Q1 1 12 1 Z" /></svg>';
  front.append(element('span', 'folder-label', folder.title));
  scene.append(front);
  card.append(scene);
  card.addEventListener('click', () => openFolder(folder, card));
  return card;
}

async function loadFolders() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}projects.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Project file returned ${response.status}`);
    const { folders } = await response.json();
    if (!Array.isArray(folders)) throw new Error('projects.json needs a folders array.');
    for (const folder of folders) {
      if (!folder.title || !Array.isArray(folder.images) || folder.images.length < 3) {
        throw new Error('Every folder needs a title and at least three images.');
      }
      for (const image of folder.images) {
        if (!image.src || !image.alt) throw new Error('Every image needs src and alt text.');
        const url = new URL(image.src, document.baseURI);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Images must use local paths or HTTPS URLs.');
        image.src = /^https?:\/\//.test(image.src)
          ? image.src
          : `${import.meta.env.BASE_URL}${image.src.replace(/^\.\//, '')}`;
      }
    }
    folderContainer.replaceChildren(...folders.map(createFolder));
    if (!folders.length) folderContainer.append(element('p', 'projects-status', 'New work is on the way.'));
  } catch (error) {
    console.error('Could not load project folders:', error);
    const message = element('p', 'projects-status', 'The folders couldn’t load. Please try refreshing.');
    message.setAttribute('role', 'status');
    folderContainer.replaceChildren(message);
  }
}

backButton.addEventListener('click', closeFolder);
loadFolders();
