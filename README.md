# Adil's portfolio

A static Astro portfolio with vanilla JavaScript interactions. No database or admin panel.

## Edit content

Start with [EDITING.md](EDITING.md) for the editing guide. Page copy and images live in `public/site.json`, button-click posters and their messages in `public/posters.json`, project folders in `public/projects.json`, and career cards in `public/career.json`. These are ordinary text files. Visible content gets poster collision by default. The standing rules are in `AGENTS.md`.

## Run locally

```sh
npm install
npm run dev
```

Use Node.js 22.22 or newer, with an even-numbered major version. Open http://127.0.0.1:5173. Astro serves the page and reloads changes during development.

The home page is `src/pages/index.astro`. Its sections live in `src/components/`, the shared document is `src/layouts/BaseLayout.astro`, and global styling is in `src/styles/global.css`. Browser interactions and physics live in `src/scripts/`; these remain ordinary JavaScript modules. Files in `public/` are copied into the build unchanged.

## Poster playground

Edit `public/posters.json` for poster symbols, captions, colors, replacement images, quantity, sizes, launch settings, cleanup messages, and error-screen text and imagery. [EDITING.md](EDITING.md#button-click-posters) has examples and valid values.

The hero button scatters posters that collect at the bottom of the viewport and collide with each other, the hero text and button, visible navigation text, headings, and project artwork as you scroll. The button stays above the posters and sends them aside on contact. Posters tumble off content and can be grabbed, dragged, and thrown. Further presses wait until the button pops back out. Stars fade away; posters remain until you clean them. On screens up to 760px wide, the header hides its navigation links and centers the name.

Posters launch from a small ring around the button. Their collision shapes grow with the visible cards. New posters pass through the central hero text and button until they have fully cleared that cluster, then collide with it if they return. Gravity, poster-to-poster collisions, and collisions with the rest of the page run throughout the spill.

After seven accepted button presses, the cleanup popup says "Hey, that's bad. Clean Up!" Click the vacuum icon to pick it up; the button becomes an empty outline. The popup says "Keep going!" throughout cleaning. Move or drag near posters to vacuum them, or use the arrow keys.

When every poster has been removed, the popup says "Thanks, the page lags a little less now. Put the cleaner back." Click the empty outline or press Escape to return it. The popup then says "Thanks." and disappears after three seconds. Returning the cleaner early restores the cleanup prompt. Cleaning everything resets the press count. New posters cancel the final thanks timer. Edit the messages and the cleanup threshold and timing in `public/posters.json`. The popup stays at the bottom right. Continuing to cover most of the screen still triggers the device-themed crash screen; reloading shows the existing reminder.

Clicking the introduction button with the vacuum equipped cycles through ten editable combo messages: "InstaClean", "DoubleClean!", "TrippleClean!!!", and onward. Every click after ten shows "Cleaning GOD!" until the cleaner is returned, which resets the sequence. Each combo briefly replaces the normal cleanup text. Edit the messages, duration, and per-status text colors and fonts in `public/posters.json`.

Each message has a close button and a vacuum icon, with no portrait. Closing it animates it away. After the cleanup threshold, another accepted hero-button press brings the prompt back. Error screens include a scannable, clickable QR code with an encoded destination; it sits beside the full error content on large screens.

## Career cards

Edit `public/career.json` to change career titles, descriptions, frame colors, images, and PNG stickers. Set `settings.imageHeight` to change the shared image height, currently 480 pixels, and `settings.padding` to change frame padding. Width follows each image's proportions, so landscape images get wider cards. Cards wrap onto centered rows and scale down on phones. Copy a card object to add a card, reorder objects to reorder cards, or remove an object to remove a card. Examples and field descriptions are in [EDITING.md](EDITING.md#career-cards).

The [editing guide](EDITING.md#career-cards) has complete card and sticker examples and a field reference. Each card allows up to four PNG stickers. Their edge positions vary by card and stay fixed across refreshes and rebuilds. Optional `x` and `y` fields override placement; width uses a percentage of the image. Stickers animate automatically and show details on hover, keyboard focus, or tap. Press Escape or tap outside to dismiss.

Run `npm test` for the physics checks, including stacking, moving surfaces, suction, and reduced motion.

## Update FrameGen

Edit `public/framegen.json` to replace the logo, tagline, two screenshots, or Try in Figma button destination. Images live in `public/framegen/`. The blue panel follows the supplied design reference, scales down for phones, and keeps poster collision on its visible content. Field descriptions are in [EDITING.md](EDITING.md#framegen-section).

## Update Find Me

Edit `public/contact.json` for the demo email address, social profile URLs, card labels, colors, tilt, and clipboard feedback. Replace `hello@example.com` and the platform homepage links with your own details. Mail copies the address; Facebook, YouTube, LinkedIn, Instagram, GitHub, and SupportKori open their configured links in a new tab. Cards wrap naturally and have poster collision. See [EDITING.md](EDITING.md#find-me-contact-cards) for field descriptions and examples.

## Update the project folders

All project content lives in **`public/projects.json`**. Each entry in `folders` becomes a clickable folder with its title centered on the front, and its first three images spill out of the preview. Clicking the folder shows its images in a wrapping layout inside Projects, with names beneath them and the folder name as the section heading. The Back button returns to the folders with a smooth fade and slide transition. Reduced-motion preferences skip the animation. Folders and gallery images move to another centered row as the available space narrows.

1. Put your images in an ordinary folder, such as `public/projects/my-project/`.
2. Add or edit an entry in `public/projects.json` using the example below. Image URLs omit `public/`.
3. Refresh the browser. No build is needed during local development.

Click a gallery image to read an article featuring that image. Add `"article": { "title": "My project story", "body": ["First paragraph.", "Second paragraph."] }` to its image entry. Back or Escape returns to the gallery. Full field descriptions and a copyable example are in [EDITING.md](EDITING.md#articles-for-project-images).

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
- JPG, PNG, WebP, AVIF, GIF, and SVG images are supported. Landscape images crop in the folder preview and display in full in the image gallery.
- The included SVGs are **sample artwork**, ready to replace with actual project images.
- Folders flow into additional rows whenever they no longer fit. Projects and Career grow with their content, with shared gaps across folder, gallery, and career rows.

## Build and deploy

```sh
npm run check
npm test
npm run build
npm run preview
```

The build validates project content and image paths, then Astro generates the static site in `dist/`. `npm run preview` serves that production build locally.

The GitHub Pages workflow installs dependencies, runs checks and tests, and deploys changes pushed to `main`. It supplies `SITE_URL` and `BASE_PATH` from GitHub Pages so assets work at the repository URL or a configured custom domain. Local development and ordinary builds default to `/`; to test a repository deployment locally, set `BASE_PATH=/Adil/` when building and previewing. Update the JSON and images and commit them together to update the live portfolio.
