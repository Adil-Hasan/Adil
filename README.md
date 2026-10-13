# Adil's portfolio

A static HTML/CSS/JavaScript portfolio. No framework, database, or admin panel.

## Run locally

```sh
npm run dev
```

Open http://localhost:5173. Use the local server rather than opening `index.html` directly, because the project content loads from JSON.

## Update the project folders

All project content lives in **`projects.json`**. Each entry in `folders` becomes a clickable folder with its title centered on the front, and its first three images spill out of the preview. Clicking the folder shows all its images in a three-column grid inside Projects, with names beneath them and the folder name as the section heading. The Back button returns to the folders with a smooth fade and slide transition. Reduced-motion preferences skip the animation. The section grows for additional rows, with two columns on tablets and one on phones.

1. Put your images in an ordinary folder, such as `projects/my-project/`.
2. Add or edit an entry in `projects.json` using the example below.
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
npm run build
```

The build copies the page, `projects.json`, and all images under `projects/` into `dist/`. The existing GitHub Pages workflow deploys changes pushed to `main`; update the JSON and images and commit them together to update the live portfolio.
