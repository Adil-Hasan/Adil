# Edit your portfolio

The content files below control the page copy, project folders, career cards, and button-click posters. Open them in any text editor. No admin or account is needed.

| What you want to change | File |
| --- | --- |
| Name, browser title, description, favicon, introduction, navigation, section headings | [public/site.json](public/site.json) |
| Button-click poster designs, images, text, colors, quantity, size, launch settings, cleanup messages, error screen | [public/posters.json](public/posters.json) |
| Career titles, descriptions, images, colors, PNG stickers | [public/career.json](public/career.json) |
| Project folder names, colors, images, captions | [public/projects.json](public/projects.json) |
| Find Me email address, platform links, labels, card colors, tilt, copy feedback | [public/contact.json](public/contact.json) |
| FrameGen logo, screenshots, tagline, and Figma button | [public/framegen.json](public/framegen.json) |

## Start here

1. Run `npm run dev` and open http://127.0.0.1:5173.
2. Put your image files in `public/posters/`, `public/career/`, or `public/projects/your-project/`.
3. Edit a content file and save. The site, poster, career, contact, and FrameGen files reload the preview automatically. Refresh after changing project folders.
4. Run `npm run check` before publishing. It reports missing images and invalid fields.

Image paths leave out `public/`. For `public/career/my-photo.jpg`, write `"src": "career/my-photo.jpg"`. Keep image files in the project so they travel with the site.

## Page text and images

Open [public/site.json](public/site.json).

| Field | What to edit |
| --- | --- |
| `name` | Your name in the navigation bar |
| `title`, `description` | Browser tab title and search description |
| `favicon` | Small browser-tab image, as a path inside `public/` |
| `sections` | Navigation labels and section headings. Change the values; keep the keys. |
| `hero.desktopLines` | The first two lines of the desktop introduction. Keep two entries. |
| `hero.mobileLines` | The first three lines of the phone introduction. Keep three entries. |
| `hero.desktopLastLine` | Words before the button on desktop |
| `hero.buttonLabel`, `hero.punctuation` | Button text and the character after it |
| `hero.signature`, `hero.note` | Name and small description under the introduction |
| `hero.scrollLabel` | Accessible label for the scroll arrow |
| `projects` | Back button, loading, empty, and error messages |
| `accessibility` | Screen-reader labels and the keyboard skip link |

Longer introduction lines may wrap. Check both desktop and phone layouts after changing them.

## FrameGen section

Open [public/framegen.json](public/framegen.json). This controls the blue FrameGen panel, using the supplied logo and two plugin screenshots.

| Field | What to edit |
| --- | --- |
| `logo.src`, `logo.alt` | Logo path and accessible heading text |
| `taglineLines` | Tagline text, with one displayed line per entry. Long lines wrap on phones. |
| `screenshots` | Exactly two images. The first sits behind and is slightly dimmed; the second overlaps it in front. Each needs `src` and descriptive `alt`. |
| `button.label` | The button text, currently Try in Figma |
| `button.url` | Complete HTTP or HTTPS link, opened in a new tab |

The current button points to `https://www.figma.com/community/plugin/1690822817256923421`. Edit it directly to change the destination:

```json
"button": {
  "label": "Try in Figma",
  "url": "https://www.figma.com/community/plugin/1690822817256923421"
}
```

Assets live in `public/framegen/`: `logo.svg`, `generate-light.png`, and `export-light.png`. To replace an image, overwrite its file or copy a new image there and update its `src`, leaving out `public/`. Keep both screenshots near the original 475:603 portrait ratio so the overlap fits its reserved space. They scale down without cropping or stretching. The logo, screenshots, tagline, and button collide with falling posters; the blue layout background stays open. The gradient, overlap, sizing, and spacing live in the `.framegen-*` rules in `src/styles/global.css`. The navigation label is `sections.framegen` in `public/site.json`.

## Find Me contact cards

Open [public/contact.json](public/contact.json). The demo includes Mail, Facebook, YouTube, LinkedIn, Instagram, GitHub, and SupportKori. The links currently point to platform homepages, and `hello@example.com` is a placeholder. Replace them with your own details before publishing. Change the section and navigation title through `sections.contact` in `public/site.json`; keep its `contact` key.

| Field | What to edit |
| --- | --- |
| `description` | Small line beneath Find Me |
| `email` | Address copied by the Mail card. Use the address alone, without `mailto:`. |
| `copy.label`, `copy.pending`, `copy.copied` | Mail card text before, during, and after copying |
| `copy.success`, `copy.error` | Feedback beneath the cards |
| `copy.emailLabel` | Label for the manual-copy field if the browser blocks copying |
| `cards` | Ordered list of cards. Reorder entries to reorder the cards; remove an entry to hide that platform. Keep at least one. |

A link card looks like this:

```json
{
  "platform": "github",
  "label": "GitHub",
  "detail": "Behind the builds",
  "url": "https://github.com/YOUR_USERNAME",
  "color": "#c9d6bd",
  "rotation": 2
}
```

`url` is a complete `https://` or `http://` address. Links open in a new tab. `label` is the platform name, and `detail` is the small line below it. `color` requires a six-digit hex color. `rotation` sets the fixed tilt in degrees from -12 to 12; negative values lean left, positive values lean right. Cards straighten and lift on hover or keyboard focus. They wrap according to the available space and collide with posters.

`platform` chooses the built-in icon and behavior. Use `mail`, `facebook`, `youtube`, `linkedin`, `instagram`, `github`, or `supportkori`, once each at most. Built-in icon artwork lives in `src/components/ContactIcon.astro`.

To use your own icon on any card, add `"icon": "contact/my-icon.svg"` and copy that image into `public/contact/`. Paths leave out `public/`. SVG, PNG, and other browser image formats work. Icons fit into a 38px square without stretching. Remove `icon` to return to a built-in icon. SupportKori uses your supplied smile logo at `public/contact/supportkori.svg`; keep an `icon` path on that card. Its empty outer frame was trimmed so the mark has a similar size to the other icons. Replace the file or edit the path to change it later. Card collision includes the icon automatically.

The Mail card has no `url` or `detail`:

```json
{ "platform": "mail", "label": "Mail", "color": "#eed2ae", "rotation": -4 }
```

It copies the root `email` value on click or keyboard activation. It never launches an email app. After copying, the card shows `copy.copied` for 2.4 seconds, then returns to `copy.label`. If copying is blocked, the address appears selected in a read-only field for manual copying. All feedback text is editable in this file.

## Button-click posters

Open [public/posters.json](public/posters.json). This is the file for the posters scattered by the introduction's button.

### Poster designs and images

Each object in `designs` is one possible poster. A random design is chosen for each scattered poster. Copy an object to add a design, or remove it to stop using it. Keep at least one design.

```json
{
  "kind": "type",
  "symbol": "Aa",
  "caption": "MY DESIGN",
  "paper": "#e7e8bb",
  "ink": "#242424",
  "accent": "#687746",
  "image": null
}
```

| Field | What to edit |
| --- | --- |
| `kind` | Built-in layout: `type`, `grid`, `orbit`, `frames`, `editorial`, or `shape` |
| `symbol` | Large text. Use `\n` for a line break, such as `Make\nit.` |
| `caption` | Small text at the bottom |
| `paper` | Background color |
| `ink` | Text and line color |
| `accent` | Decorative shape color |
| `symbolColor` | Optional separate color for the large text; otherwise it uses `ink` |
| `image` | Use `null` for the built-in design, or an image object to replace the whole poster |

Colors use six-digit hex values, such as `#c5d8b6`. To use your own poster artwork, copy it to `public/posters/my-poster.png` and replace `"image": null` with:

```json
"image": {
  "src": "posters/my-poster.png",
  "alt": "Describe your poster"
}
```

Image posters keep the same movement, dragging, vacuum behavior, and collisions. They fill a 4:5 portrait card, cropping as needed. Use artwork with those proportions to show the whole design. The other design fields remain in the object but are hidden while an image is used. PNG, JPG, WebP, AVIF, GIF, and SVG files work.

### Burst settings

The `settings` object controls how the button scatters posters. Sizes and speeds scale down on smaller screens.

| Setting | Meaning and allowed values |
| --- | --- |
| `postersPerClick` | Posters per press, 1 to 48 |
| `minSize`, `maxSize` | Minimum and maximum width in pixels, 20 to 160. Maximum must be at least minimum. |
| `minLaunchSpeed`, `maxLaunchSpeed` | Launch speed in pixels per second, 0 to 1200. Maximum must be at least minimum. |
| `upwardBoost` | Extra upward launch speed, 0 to 800 |
| `launchRadius` | Starting distance from the button in pixels, 0 to 200 |
| `starCount` | Decorative stars per press, 0 to 80. Use 0 to turn them off. |
| `starColors` | One or more six-digit hex colors for the stars |
| `cleanupAfterClicks` | Accepted presses before the cleanup prompt appears, 1 to 48. Default: 7. |
| `thanksDurationMs` | How long the final thanks stays after returning the cleaner, 0 to 60000 milliseconds. Default: 3000, or 3 seconds. |
| `comboDurationMs` | How long a vacuum-button combo message stays, 0 to 60000 milliseconds. Default: 1500, or 1.5 seconds. Each new combo restarts this timer. |

Use whole numbers. More posters per click fill the screen faster and increase physics work.

### Cleanup and error text

| Section in `posters.json` | What to edit |
| --- | --- |
| `messages` | Cleanup prompt, encouragement, completion request, final thanks, reload reminder, and screen-reader burst announcement |
| `actions` | Clean, put-away, and dismiss button labels |
| `vacuumInstructions` | Screen-reader instructions for the vacuum |
| `crash.platforms` | Symbol and heading for each device's error screen. Keep all platform keys. |
| `crash.description`, `code`, `brand`, `reloadLabel` | Shared error text and reload button |
| `crash.image` | Error-screen QR/image path and its description |
| `crash.errorDetailsUrl`, `errorDetailsLabel` | Destination and label when the error image is clicked |

If you change the error destination, replace the QR artwork too so scanning and clicking lead to the same place. Image files belong inside `public/`; the destination URL must start with `http://` or `https://`.

### Cleanup popup sequence

The popup follows this sequence. Edit the corresponding field in `posters.json` to change the wording.

| When | Message field | Default text |
| --- | --- | --- |
| Button has been pressed `cleanupAfterClicks` times | `messages.dirty` | Hey, that's bad. Clean Up! |
| Cleaner is picked up and posters remain | `messages.cleaning` | Keep going! |
| Every poster has finished being vacuumed | `messages.completed` | Thanks, the page lags a little less now. Put the cleaner back. |
| Cleaner is returned | `messages.thanks` | Thanks. |

The encouragement stays throughout cleaning. The completion request stays until the user puts the cleaner back by clicking its empty outline or pressing Escape. Only then does the final thanks appear and disappear after `thanksDurationMs`. Returning the cleaner early restores the cleanup prompt. New posters cancel the final thanks timer and begin another cycle. Cleaning everything resets the press count.

### Clicking the button while holding the vacuum

Accepted clicks on the introduction button while the vacuum is equipped show the next entry in `messages.cleanCombos`. There are ten messages, starting with `InstaClean`, `DoubleClean!`, and `TrippleClean!!!`. Every click after the tenth shows `messages.cleaningGod`, which defaults to `Cleaning GOD!`. Putting the vacuum back resets the sequence.

Edit the ten strings in `messages.cleanCombos` to change the wording or order. Keep exactly ten nonempty entries. A combo temporarily replaces the current cleanup message for `comboDurationMs`, then the regular cleaning or completion message returns. Returning the vacuum cancels the combo immediately and continues the normal cleanup flow. Clicks without the vacuum do not advance the combo.

### Message colors, fonts, and boxes

Edit `messageStyles` in `public/posters.json`. Every cleanup stage has its own style. The default prompt is red with a bold display font; active cleaning is teal with a monospace font; completion uses a plain green style; final thanks uses purple italic serif text. Each of the ten combos has its own color and font combination. `Cleaning GOD!` uses a larger gold display style.

| Style entry | Message it controls |
| --- | --- |
| `dirty`, `cleaning`, `completed`, `thanks`, `recovered` | The matching cleanup or reload status |
| `cleanCombos` | Ten styles in the same order as `messages.cleanCombos` |
| `cleaningGod` | All vacuum-button clicks after the tenth |

Each style looks like this:

```json
{
  "color": "#ffe29a",
  "font": "display",
  "size": 29,
  "weight": 900,
  "italic": false,
  "box": "god",
  "paper": "#241b30",
  "accent": "#ebbf67"
}
```

`color` uses a six-digit hex value. `size` is 12 to 32 pixels. `weight` is 400, 500, 700, or 900; higher numbers are bolder. `italic` is `true` or `false`.

The popup is up to 320px wide on desktop and 300px on phones, with space around the screen edges. Phone text keeps its chosen font and size, capped at 26px. The decoration and close button have their own space above the text. Longer custom messages wrap within the box, so avoid manual line breaks or spaces added just to force alignment. Statuses without a cleaner button collapse the empty action area.

`box` chooses the popup shape and decoration. `paper` sets its background and `accent` sets its borders, decorations, and controls. Both colors require six-digit hex values. Keep text readable against `paper`. These fields live inside every style entry, including each combo, so you can change them independently. Switching status changes the entire box. The popup keeps its poster collision in every style.

| Box value | Appearance |
| --- | --- |
| `warning` | Warning slip with a striped top edge |
| `console` | Grid panel with three small status lights |
| `stamp` | Double border and a check mark |
| `note` | Rounded note with a soft folded bottom edge |
| `ticket` | Dashed ticket border and a small barcode |
| `arcade` | Square frame with stacked offset borders |
| `god` | Dark gold award frame with a crown and halo |

Defaults use `warning` for the cleanup prompt, `console` while cleaning, `stamp` on completion, `note` for thanks, and `ticket` after reloading. Combos alternate `arcade` and `ticket` in their own colors. Every click after ten uses the `cleaningGod` style with the `god` box.

Choose one of these `font` values. These use the existing Inter font or system fonts and need no extra font files.

| Font value | Appearance |
| --- | --- |
| `sans` | Inter, with Arial fallback |
| `mono` | Consolas, with Courier New fallback |
| `serif` | Georgia, with Times New Roman fallback |
| `display` | Impact, with condensed or sans-serif fallbacks |
| `rounded` | Trebuchet MS, with rounded or sans-serif fallbacks |

## Collision defaults

Visible text, images, artwork, icons, and controls collide with the falling posters automatically. Career frames, PNG stickers, visible tooltips, and burst stars are included. Animated stickers and stars are checked while they move; scrolling updates all collision positions.

New content must keep this behavior unless you explicitly request an exception. Developers should use the shared collision discovery in `src/scripts/poster-colliders.js`. Custom visual containers can declare `data-poster-collision="solid"`; full-page layout wrappers should stay open so posters can travel through the page. Document every new editable text or image field here.

## Career cards

Open [public/career.json](public/career.json). The two `settings` values at the top apply to every career card and use pixels:

```json
"settings": {
  "imageHeight": 480,
  "padding": 14
}
```

Set `imageHeight` to a positive number to change the shared image height. Set `padding` to zero or a positive number to change the colored border thickness. For example, use `"imageHeight": 360` for smaller cards. The old `maxWidth` and `maxImageHeight` fields have been replaced by `imageHeight`; do not add them back.

Career cards wrap naturally as the available space changes. Images share `imageHeight`, currently 480px. Each entry takes its width from the image proportions and moves to the next row when it no longer fits beside another entry. On screens narrower than a card, it shrinks to fit. Rows stay centered, including the final row. There are no fixed column counts or column breakpoints. Image proportions, tilt, PNG stickers, and poster collisions work in every layout.

Career entries, project folders, gallery images, and Find Me cards glide into their new positions over 360ms when their wrapping container changes width. Resizing again during the movement continues from the current visible position. Card tilt and hover effects stay independent, and collisions follow the moving content. Reduced-motion preferences skip the movement. The shared behavior lives in `src/scripts/wrap-motion.js`; new items added through the JSON files inherit it automatically.

| Setting | What it changes |
| --- | --- |
| `imageHeight` | Shared image height in pixels, currently 480. Width follows image proportions. On phones, images scale down to fit the screen. |
| `padding` | Width of the colored frame around the image |

Images keep their own proportions. The frame follows the image without cropping or stretching.

Each main image gets a subtle random tilt of 1 to 2 degrees when the page loads. The frame, caption, and sticker positions stay fixed.

The first card currently previews a sideways landscape image at `career/landscape-demo.svg`. To restore its portrait artwork, set that card's `image.src` to `projects/design/01.svg` and update `image.alt` to describe the portrait. Landscape images use their natural proportions, keeping the same frame padding and image height with a wider card.

Hovering over a career image straightens it and enlarges it by 2.5% over 300ms. It returns to its original tilt when the pointer leaves. Focusing a sticker also straightens its image. The frame and stickers stay in place, and poster collision follows the image during the transition. Reduced-motion preferences skip the transition. Adjust this effect in `.career-image` and `.career-image-stage` in `src/styles/global.css`.

Main images and PNG stickers both block falling posters. Collision areas follow their displayed size and position as the page scrolls.

Each object in `cards` creates one card, in that order. Change the words inside quotation marks. Copy a whole card to add one; delete it to remove one. No IDs or layout code need editing.

```json
{
  "title": "Visual designer",
  "description": "A short line about the work.",
  "color": "#c5d8b6",
  "image": {
    "src": "career/my-photo.jpg",
    "alt": "A short description of the image"
  },
  "stickers": []
}
```

`color` is the frame color. Use a six-digit hex color such as `#c5d8b6`. To leave a card empty, use `"image": null` and `"stickers": []`.

### PNG stickers

Each card can have up to four PNG stickers. Positions are randomized for each card and stay fixed across refreshes and rebuilds. Add stickers without coordinates to use this layout:

```json
"stickers": [
  {
    "src": "career/my-sticker.png",
    "title": "A small detail",
    "description": "Text shown on hover or tap.",
    "width": 17,
    "rotation": 10
  }
]
```

| Field | How to edit it |
| --- | --- |
| `src` | Path to your transparent PNG |
| `title`, `description` | Text shown on hover, keyboard focus, or tap |
| `x`, `y` | Optional manual position. Add both to override the automatic layout. Each runs from 0 to 100, with 50 in the middle. |
| `width` | Percentage of the image width, from 1 to 50 |
| `rotation` | Tilt in degrees: negative turns left, positive turns right |

The first two stickers sit near opposite corners. A third and fourth use the remaining corners, each with a different offset. Placement depends on the card title and main image path, so changing those creates a new layout. Reordering cards or adding another sticker keeps the existing positions. Manual coordinates mark the center of a sticker; remove both `x` and `y` to restore automatic placement. Use `[]` to remove all stickers. Animation is automatic. Falling posters collide with the PNG stickers, following their position as they float or the page scrolls.

Sticker popups fade and rise into place with a small spring over 260ms on hover, keyboard focus, or tap. Closing fades them out over 130ms. Moving quickly between stickers or reopening a closing popup continues smoothly from its current position. Popups stay level with the page and keep poster collision during the animation. Visitors who request reduced motion get instant opening and closing. The same behavior applies to every card; edit popup wording through each sticker's `title` and `description`.

## Project folders

Open [public/projects.json](public/projects.json). Each object inside `folders` creates one folder. Its `title` is the folder name, `color` is its color, and `images` lists its contents.

Folders and the images inside them also wrap automatically. Both aim for 320px wide. Career cards instead share an image height and vary in width. They shrink to fit narrow screens and move onto another centered row whenever there is not enough room. These layout sizes live in `.project-folder` and `.project-image` in `src/styles/global.css`.

Projects, study galleries, and career entries share spacing variables on `.content-sections` in `src/styles/global.css`: `--collection-column-gap` controls horizontal gaps, `--collection-row-gap` controls row gaps, `--collection-heading-gap` controls the gap after the section heading, and `--collection-section-space` controls section padding. Folders reserve 52px above their scene for the protruding preview images. Their row gap compensates for the scene's unused bottom edge so the visible gap matches the study rows. The gallery has a separate Back row with a 24px gap before the artwork. Projects and Career grow with their content instead of centering short collections inside a full-screen section. Adding a fourth item does not switch the spacing rules.

- Change an image's `src` to replace it, and `title` to change its caption.
- Write a short visual description in `alt`.
- Keep at least three images per folder for the folder preview.
- Move objects up or down to reorder folders or images.
- Copy an entire folder object to add another project.

A complete folder example is in [README.md](README.md#update-the-project-folders).

### Articles for project images

Clicking a gallery image opens its article inside Projects. Back or Escape returns to the image grid and restores the selected image's keyboard focus and scroll position. On narrow screens, article text wraps below the artwork. The image, text, and Back button keep poster collision.

In `public/projects.json`, add an `article` object to each image:

```json
{
  "src": "./projects/my-project/01.jpg",
  "alt": "A description of the artwork",
  "title": "Gallery caption",
  "article": {
    "title": "My project story",
    "body": [
      "Introduce the project here.",
      "Describe the process or the result in another paragraph."
    ]
  }
}
```

`article.title` is the article heading. `article.body` is an array of paragraphs, using plain text rather than HTML. Add or remove strings to change the number of paragraphs. The article uses the same image as the gallery, so changing `src` updates both. Use `"body": []` for an image-only article. If `article` is omitted, the image still opens using its gallery title (or `alt`) as the heading. Edit the navigation labels through `projects.backToImagesLabel` and `projects.openArticleLabel` in `public/site.json`. The supplied articles are demo copy ready to replace.

## Saving and publishing

JSON uses double quotes around text and commas between entries. Do not put a comma after the final entry in a list. Keep the existing structure when replacing text or paths.

Run `npm run check` to check your content and image paths. Then run `npm run build` to check the finished site. Local changes appear in the preview; the live site updates when you commit and push them to `main`.

These rules are also recorded in [AGENTS.md](AGENTS.md) for future code changes.
