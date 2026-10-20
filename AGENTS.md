# Project instructions

These are standing user requirements for all future changes to this repository.

1. All visible content gets poster collision by default, including text, images, cards, PNG stickers, icons, and controls. The user must explicitly request any new exception. Extend and verify the shared collision discovery when adding a new kind of content. Do not make full-page layout containers into solid obstacles.
2. User-editable text and images belong in the simplified JSON content files under `public/`, not hardcoded in components or interaction code. Add or update `EDITING.md` with clear file locations, field descriptions, valid values, image paths, and copyable examples whenever editable content changes. No admin panel.

Preserve existing uncommitted changes. Run `npm run check`, relevant tests, and `npm run build` after implementation changes. Verify interactive changes in a separate browser preview when the user is using their current tab.
