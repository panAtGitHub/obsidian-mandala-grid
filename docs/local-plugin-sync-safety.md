# Local Plugin Sync Safety

This repository syncs the built plugin into the local Obsidian plugin directory with `npm run sync:obsidian`.

## Source and target

- Source build directory: `temp/vault/.obsidian/plugins/mandala-grid-dev/`
- Target plugin directory: `C:\iWork\obWin\.obsidian\plugins\mandala-grid\`

## Safety rule

- `npm run sync:obsidian` runs `scripts/sync-obsidian.mjs` using Node.js on Windows.
- Only the three build assets below are copied; `data.json` and other files are preserved.
- The script requires an existing vault configuration directory and rejects redirected target directories and linked asset files.
- Source assets are checked before copying, and copied files and existing settings are verified afterward.
- Use `npm run build:sync` to build and sync in one command. Development watch builds stay in the source build directory above.

## Expected synced files

- `main.js`
- `styles.css`
- `manifest.json`

## Verification

After running sync, verify that:

1. `main.js` exists in the target plugin directory.
2. `manifest.json` exists in the target plugin directory.
3. Existing `data.json` contents are unchanged; absent settings are not created by sync.
