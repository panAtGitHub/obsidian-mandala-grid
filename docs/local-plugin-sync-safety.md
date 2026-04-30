# Local Plugin Sync Safety

This repository syncs the built plugin into the local Obsidian plugin directory with `npm run sync:obsidian`.

## Source and target

- Source build directory: `temp/vault/.obsidian/plugins/mandala-grid-dev/`
- Target plugin directory: `/Users/panxiaorong/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidian/.obsidian/plugins/mandala-grid/`

## Safety rule

- The sync command must continue to exclude `data.json`.
- Current evidence: `package.json` uses `rsync -av --delete --exclude 'data.json' ...`.

## Expected synced files

- `main.js`
- `styles.css`
- `manifest.json`

## Verification

After running sync, verify that:

1. `main.js` exists in the target plugin directory.
2. `manifest.json` exists in the target plugin directory.
3. `data.json` still exists and was not overwritten.