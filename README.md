# Adil's portfolio

A static Astro portfolio with vanilla JavaScript interactions. No database or admin panel.

## Run locally

```sh
npm install
npm run dev
```

Use Node.js 22.22 or newer, with an even-numbered major version. Open http://127.0.0.1:5173. Astro serves the page and reloads changes during development.

The home page is `src/pages/index.astro`. Its sections live in `src/components/`, the shared document is `src/layouts/BaseLayout.astro`, and global styling is in `src/styles/global.css`. Browser interactions and physics live in `src/scripts/`; these remain ordinary JavaScript modules. Files in `public/` are copied into the build unchanged.

## Poster playground

The hero button scatters posters that collect at the bottom of the viewport and collide with each other, visible navigation text, headings, and project artwork as you scroll. Posters tumble off content and can be grabbed, dragged, and thrown. Further presses wait until the button pops back out. Stars fade away; posters remain until you clean them.

Posters launch from a small ring around the button. Their collision shapes grow with the visible cards, and collisions run from the first frame so there is no delayed switch into physics.

The cleanup chat appears after seven accepted presses. Click the vacuum icon to pick it up; the button becomes an empty outline while the vacuum is in use. Move or drag near posters to suck them up, or move the vacuum with the arrow keys. Cleaning every poster resets the press count and keeps the vacuum as a gift. Clicking the empty outline or pressing Escape puts it away and restores the icon.

The chat pops into view and rises above posters piled beneath it. Five more presses turn it red with "Please! Stop! Clean up!" You can keep pressing. When posters cover most of the viewport, the page shows a platform-themed crash screen. Reloading clears the pile and shows "Don't do it again." once. The pile lasts for the current page visit; only the reload reminder uses session storage.

Each message has a portrait and a close button. Closing it animates it away. In the red phase, another accepted hero-button press brings the warning back, including during the closing animation. Picking up the vacuum briefly shows "Oooh, nice." Error screens include a scannable, clickable QR code with an encoded destination; it sits beside the full error content on large screens.

The Career section contains a four-chapter demo with sample roles and dates. Scroll through it or use the chapter guide and next button. Each paper card reveals on arrival, its artefact tilts with the pointer, and the notebook controls expand the story. The guide stays beside the cards on desktop and becomes a compact sticky route on mobile. The last chapter can replay the journey. Career content is in `src/components/Career.astro`, with motion and navigation in `src/scripts/career-flow.js`; reduced-motion preferences are respected.

Run `npm test` for the physics checks, including stacking, moving surfaces, suction, and reduced motion.

## Update the project folders

All project content lives in **`public/projects.json`**. Each entry in `folders` becomes a clickable folder with its title centered on the front, and its first three images spill out of the preview. Clicking the folder shows all its images in a three-column grid inside Projects, with names beneath them and the folder name as the section heading. The Back button returns to the folders with a smooth fade and slide transition. Reduced-motion preferences skip the animation. The section grows for additional rows, with two columns on tablets and one on phones.

1. Put your images in an ordinary folder, such as `public/projects/my-project/`.
2. Add or edit an entry in `public/projects.json` using the example below. Image URLs omit `public/`.
3. Refresh the browser. No build is needed during local development.

```json
{
  "title": "My project",
  "color": "#d5b77c",
  "images": [
    { "src": "./projects/my-project/01.jpg", "alt": "Describe the first image", "title": "First image caption" },
    { "src": "./projects/my-project/02.png", "alt": "Describe the second image", "title": "Second image caption" },
    { "src": "./projects/my-project/03.webp", "alt": "Describe the third image", "title": "Third image caption" }
  ]
}
```

- Copy an entry to add a folder; remove it to hide a folder.
- Reorder entries to reorder folders; reorder images to change the three previews.
- Keep at least **three images** per folder. There is no upper limit.
- `title`, image `src`, and image `alt` are required. Other fields are optional.
- `color` accepts a six-digit hex color. The folder's `title` appears on its front; each image's `title` appears beneath its image, falling back to `alt` when omitted.
- JPG, PNG, WebP, AVIF, GIF, and SVG images are supported. Landscape images crop in the folder preview and display in full in the image grid.
- The included SVGs are **sample artwork**, ready to replace with actual project images.
- More than three folders flow into additional rows. Desktop sections occupy at least one viewport; mobile layouts grow naturally.

## Build and deploy

```sh
npm run check
npm test
npm run build
npm run preview
```

The build validates project content and image paths, then Astro generates the static site in `dist/`. `npm run preview` serves that production build locally.

The GitHub Pages workflow installs dependencies, runs checks and tests, and deploys changes pushed to `main`. It supplies `SITE_URL` and `BASE_PATH` from GitHub Pages so assets work at the repository URL or a configured custom domain. Local development and ordinary builds default to `/`; to test a repository deployment locally, set `BASE_PATH=/Adil/` when building and previewing. Update the JSON and images and commit them together to update the live portfolio.
