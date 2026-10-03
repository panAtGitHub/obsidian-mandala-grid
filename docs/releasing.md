# Publishing a plugin release

Use a three-component version such as `1.2.14`, with no `v` prefix or leading zeros. Keep `package.json`, both root versions in `package-lock.json`, `manifest.json`, and the current compatibility entry in `versions.json` consistent. Add release notes at `docs/releases/<version>.md`.

1. Commit the release changes with Chinese and English summaries.
2. Run `npm run validate:official` and the required tests. Set `RELEASE_TAG` to the intended tag to also verify that it matches the manifest.
3. Run `npm run sync:obsidian` for the Windows vault and reload the plugin. Local sync does not publish a GitHub release.
4. After approval of the release contents, push the commit and an identical version tag to GitHub. The release workflow validates the checked-out tag, builds the assets, generates provenance attestations, and creates a draft release. Manual workflow dispatch requires an existing tag containing the updated workflow and source.
5. Verify the draft includes `main.js`, `manifest.json`, and `styles.css`. Verify attestations using `gh attestation verify <asset-path> --repo panAtGitHub/obsidian-mandala-grid` against the downloaded assets. Publish the approved draft.
6. In the Obsidian Community developer dashboard, select **Check for new releases** if needed. Confirm the matching release is detected and the new scan completes before reporting community installation as restored.

The workflow updates assets only on draft releases. Published assets must not be replaced; prepare a new version instead. A local validation pass does not confirm GitHub attestations or the Obsidian remote review result.
