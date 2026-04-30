# Master Branch Hygiene and Release Safety Report

Generated on 2026-04-30 for the Mandala Grid Obsidian plugin repository.

## 1. Current branch topology

- Working tree is on `master` and tracks `origin/master`.
  Evidence: `git status --short --branch` returned `## master...origin/master`.
- Remote default ref points to `origin/master`.
  Evidence: `git symbolic-ref refs/remotes/origin/HEAD` returned `refs/remotes/origin/master`.
- Remote branch inventory is currently limited to `origin/master`, `origin/9x9重构`, `origin/feat/mandala-embed-alias-marker`, `origin/feature/outline-jump`, and `origin/ui-architecture-refactor`.
  Evidence: `git branch --all --verbose --no-abbrev` and `git remote show origin`.

## 2. Whether `master` is the only real mainline branch now

- Yes.
- There is no local `main` branch.
  Evidence: `git branch --all --verbose --no-abbrev` listed no local `main`.
- There is no remote `origin/main` branch.
  Evidence: `git ls-remote --heads origin master main` returned only `refs/heads/master`.
- `origin/HEAD` resolves to `origin/master`.
  Evidence: `refs/remotes/origin/HEAD -> origin/master`.

## 3. Whether any local or remote `main` references still exist

- No branch-level `main` references were found in tracked files.
  Evidence: `git grep -nE 'origin/main|refs/heads/main|checkout main|git checkout main|main branch|default branch.*main|branch main|push main|pull main|merge into main|merge.* main' -- . ':(exclude)temp/**' ':(exclude)main.js'` returned no matches.
- No `origin/main` ref exists remotely.
  Evidence: `git ls-remote --heads origin master main` returned only `master`.
- There are many legitimate `main.js`, `src/main.ts`, and UI `main` identifiers in code. These are not branch references and should not be rewritten.

## 4. Whether any docs, scripts, or config still incorrectly mention `main`

- No current workflow or repo-operation text was found that incorrectly points this repository to a `main` branch.
- The remaining `main` matches in code are file names, imports, CSS classes, or runtime identifiers.
  Evidence: targeted `git grep` for branch-oriented phrases returned no matches.

## 5. Whether GitHub transport is truly using SSH or being rewritten to HTTPS

- Before cleanup, global git config rewrote GitHub SSH URLs to HTTPS.
  Evidence:
  - `git config --show-origin --get-regexp '^url\..*insteadof$|^remote\..*url$|^branch\..*'`
  - `file:/Users/panxiaorong/.gitconfig url.https://github.com/.insteadof git@github.com:`
  - `file:/Users/panxiaorong/.gitconfig url.https://github.com/.insteadof ssh://git@github.com/`
- Before cleanup, the repository resolved both fetch and push URLs to HTTPS even though `.git/config` stored an SSH remote.
  Evidence: `git remote show origin` showed fetch and push URLs as `https://github.com/panAtGitHub/obsidian-mandala-grid.git`.
- Before cleanup, Git trace proved the transport actually used `git-remote-https`.
  Evidence: `GIT_TRACE=1 git ls-remote origin HEAD` showed `git remote-https origin https://github.com/panAtGitHub/obsidian-mandala-grid.git`.
- After cleanup, only the repo-local SSH remote remained.
  Evidence: `git config --show-origin --get-regexp '^url\..*insteadof$|^remote\..*url$'` returned only `.git/config remote.origin.url git@github.com:panAtGitHub/obsidian-mandala-grid.git`.
- After cleanup, GitHub transport resolved to SSH.
  Evidence:
  - `git remote show origin` showed `git@github.com:panAtGitHub/obsidian-mandala-grid.git`
  - `GIT_TRACE=1 git ls-remote origin HEAD` showed `/usr/bin/ssh ... git@github.com`

## 6. Whether husky hooks are installed and executable

- Husky is configured in the repo.
  Evidence:
  - `package.json` contains `prepare: husky install`
  - `.git/config` contains `core.hooksPath = .husky`
- The hook entrypoints exist and are structurally valid.
  Evidence:
  - `.husky/pre-commit` runs `npm run build`, `npm test`, and `npx lint-staged`
  - `.husky/commit-msg` runs `npx --no -- commitlint --edit ${1}`
- Before cleanup, the hook entrypoints were not executable.
  Evidence:
  - `ls -la .husky` showed both files as `-rw-r--r--`
  - `test -x .husky/pre-commit` and `test -x .husky/commit-msg` both failed
- After cleanup, both hook entrypoints are executable.
  Evidence:
  - `ls -l .husky/pre-commit .husky/commit-msg` shows `-rwxr-xr-x`
  - `test -x` succeeds for both files
- The hook path is restored, but the repository is not currently test-clean.
  Evidence: `npm test` fails in `src/mandala-cell/view/actions/cell-scrollbar.spec.ts` with 3 failing assertions, so the repaired `pre-commit` hook now enforces a real existing test regression instead of silently skipping all hook logic.

## 7. Whether release workflow paths match actual build output

- The production JavaScript bundle path is `temp/vault/.obsidian/plugins/mandala-grid-dev/main.js`.
  Evidence: `esbuild.config.mjs` sets `BUILD_OUTDIR` to `temp/vault/.obsidian/plugins/mandala-grid-dev` for production and writes `main.js` there.
- The production stylesheet path is `temp/vault/.obsidian/plugins/mandala-grid-dev/styles.css`.
  Evidence: `esbuild.config.mjs` writes CSS output to `${BUILD_OUTDIR}/styles.css`.
- `manifest.json` is copied into the same production output directory after build.
  Evidence: `scripts/sync-manifest.mjs` copies root `manifest.json` into `temp/vault/.obsidian/plugins/mandala-grid-dev/manifest.json`.
- The current workflow asset paths match those real outputs.
  Evidence: `.github/workflows/release.yml` uploads `manifest.json`, `temp/vault/.obsidian/plugins/mandala-grid-dev/main.js`, and `temp/vault/.obsidian/plugins/mandala-grid-dev/styles.css`.
- However, the GitHub-side release state was unhealthy at inspection time.
  Evidence:
  - `gh api "repos/panAtGitHub/obsidian-mandala-grid/actions/workflows/225226692/runs?per_page=20"` returned `"total_count": 0`
  - `gh release view 1.2.9 --repo panAtGitHub/obsidian-mandala-grid` returned `release not found`
  - `gh api "repos/panAtGitHub/obsidian-mandala-grid/releases?per_page=20"` listed historical releases such as `1.2.8.3`, but not `1.2.9`

## 8. Whether sync scripts are safe with respect to `data.json`

- Local plugin sync excludes `data.json`.
  Evidence: `package.json` defines `sync:obsidian` as `rsync -av --delete --exclude 'data.json' temp/vault/.obsidian/plugins/mandala-grid-dev/ .../plugins/mandala-grid/`.
- The current target plugin directory contains a live `data.json`.
  Evidence: `ls -la "/Users/panxiaorong/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidian/.obsidian/plugins/mandala-grid"` listed `data.json` alongside `main.js`, `manifest.json`, and `styles.css`.

## 9. High-risk issues

- GitHub release automation had zero recorded runs, so tag `1.2.9` had no draft release and no uploaded assets at inspection time.
- Global Git config silently rewrote GitHub SSH URLs to HTTPS, which can cause pushes to use HTTPS token semantics even when the repo remote is configured as SSH.

## 10. Medium-risk issues

- Husky hook entrypoints existed but were not executable, which disabled local pre-commit build, test, lint-staged, and commit message enforcement.
- After hook repair, commits are correctly subject to the repo's existing test gate, and that gate currently fails on 3 unrelated assertions in `src/mandala-cell/view/actions/cell-scrollbar.spec.ts`.
- The local branch list contains many merged, backup, experiment, and Chinese-named branches, which makes future branch intent harder to judge quickly.

## 11. Low-risk cleanup

- Many local branches are already merged into `master` and can be reviewed for pruning.
  Evidence: `git branch --format='%(refname:short)' --merged master`.
- Some local backup or experiment branches remain unmerged and should be explicitly classified before deletion.
  Evidence: `git branch --format='%(refname:short)' --no-merged master`.
- On the remote side, `origin/feature/outline-jump` is the only currently visible unmerged remote branch.
  Evidence: `git branch -r --format='%(refname:short)' --no-merged origin/master`.

## 12. Exact recommended actions

1. Keep `master` as the only canonical mainline branch and do not recreate `main`.
2. Remove the global GitHub `insteadOf` rules that map SSH-style URLs back to HTTPS.
3. Keep `.husky/pre-commit` and `.husky/commit-msg` executable.
4. Harden the release workflow so an existing tag can be rebuilt and a missing draft release can be recreated safely.
5. Run `npm run build`, then `npm run lint`, then `npm test`, then local sync.
6. Treat the current `cell-scrollbar.spec.ts` failures as a separate follow-up; do not fold them into repo hygiene or release fixes unless that test slice is explicitly in scope.
7. Push repo changes over SSH only after verifying `git remote show origin` resolves to `git@github.com:panAtGitHub/obsidian-mandala-grid.git`.
8. Perform a later branch cleanup pass using three buckets: merged, still active, archived.

## 13. Final go/no-go status

- Go for branch, transport, hook, release, and sync hardening after the release workflow patch, local build/lint validation, local sync, and GitHub release verification complete successfully.
- Not a full green-repo go state, because `npm test` currently fails in `src/mandala-cell/view/actions/cell-scrollbar.spec.ts` outside the scope of this hygiene task.