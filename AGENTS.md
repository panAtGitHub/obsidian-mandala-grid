# AGENTS.md — Mandala Grid（Obsidian 插件）

TypeScript + Svelte 的 Obsidian 插件。

-   源码目录：`src/`
-   单元测试：Vitest（`src/**/*.spec.ts`）
-   端到端测试：Playwright（`e2e/**`，`playwright.config.ts`），通过 Electron 启动 Obsidian
-   路径别名：`src/*`（见 `tsconfig.json` 与 `vite.config.mjs`）

## 包管理器

-   使用 **npm**（仓库中有 `package-lock.json`）

## 常用命令

-   安装依赖：`npm ci`
-   开发构建（watch）：`npm run dev`
    -   输出：`temp/vault/.obsidian/plugins/mandala-grid-dev/main.js`
    -   输出：`temp/vault/.obsidian/plugins/mandala-grid-dev/styles.css`
-   生产构建：`npm run build`
    -   运行：`tsc -noEmit -skipLibCheck`
    -   运行：`svelte-check --workspace src`
    -   运行：`node esbuild.config.mjs production`
-   Lint：`npm run lint`（运行 `eslint src`）
-   单元测试：`npm test`（运行 `vitest run`）
-   单元测试（watch）：`npm run test:watch`（运行 `vitest`）
-   E2E 测试：`npm run test:e2e`（运行 `playwright test`）

## 运行单个测试

### Vitest（单元测试）

-   单文件：`npm test -- src/helpers/test-helpers/compare-documents.spec.ts`
-   按测试名过滤：`npm test -- -t "should be equal"`

### Playwright（E2E）

-   单文件：`npm run test:e2e -- e2e/tests/text-area.spec.ts`
-   按用例标题过滤：`npm run test:e2e -- --grep "card hotkeys"`

## E2E 前置条件

E2E 通过 Playwright 的 Electron 启动器（`electron.launch`）启动 Obsidian，需要提供 Obsidian 可执行文件路径。

-   设置 `OBSIDIAN_EXECUTABLE_PATH`（推荐写入 `.env`，该文件已被 `.gitignore` 忽略）
-   `playwright.config.ts` 会调用 `dotenv.config()`，因此会自动加载 `.env`
-   相关代码：`e2e/helpers/getters/obsidian/load-obsidian.ts`

`.env` 示例：

```
OBSIDIAN_EXECUTABLE_PATH=/absolute/path/to/Obsidian
```

如果 Playwright 驱动/浏览器缺失，可执行：`npx playwright install`。

## 版本管理

-   `npm run version`
    -   运行 `node version-bump.mjs && git add manifest.json versions.json`
    -   将 `manifest.json`、`versions.json` 的版本更新为 `package.json` 的版本

## 格式化与 Lint（最终标准）

### Prettier

Prettier 配置：`.prettierrc`

-   `endOfLine: lf`
-   4 空格缩进（`useTabs: false`, `tabWidth: 4`）
-   `singleQuote: true`, `semi: true`, `printWidth: 80`
-   通过 `prettier-plugin-svelte` 格式化 Svelte（`*.svelte` 使用 `parser: svelte`）

执行：`npx prettier --write .`

### ESLint

ESLint 配置：`.eslintrc`

-   TypeScript：`@typescript-eslint/parser`
-   Svelte：`plugin:svelte/recommended`
-   关键规则：
    -   `no-console: "error"`
    -   `@typescript-eslint/no-unused-vars: "error"`
    -   `@typescript-eslint/ban-ts-comment: off`（允许，但尽量避免）

执行：`npm run lint`

### lint-staged

`lint-staged` 配置：`.lintstagedrc.json`

-   对暂存的 `*.{js,jsx,ts,tsx,svelte}`：先 `prettier --write`，再 `eslint`

### EditorConfig

`.editorconfig` 使用 tab，与 Prettier 对 TS/Svelte 的配置存在冲突。
对 TS/Svelte：以 **Prettier 输出为准**。

## TypeScript 与 Svelte 约定

-   TS 编译选项（`tsconfig.json`）：`noImplicitAny`, `strictNullChecks`, `isolatedModules`
-   尽量用 `unknown` 替代 `any`，并通过运行时检查缩小类型
-   新代码避免使用 `as any`、`@ts-ignore`、`@ts-expect-error`
    -   如必须使用，请将影响范围限制在最小，并说明原因
-   `*.svelte` 通常使用 `<script lang="ts">`

## 导入（Imports）

-   优先使用 `src/...` 别名，避免深层相对路径
-   保持文件内既有的 import 顺序，避免全仓库的 import 重排

## 命名与目录结构

-   文件/目录：**kebab-case**（例如 `extract-frontmatter.ts`）
-   类型/接口/类：**PascalCase**
-   函数/变量：**camelCase**
-   常量：需要时使用 **SCREAMING_SNAKE_CASE**
-   单元测试：与源码相邻的 `*.spec.ts`
-   E2E 测试：`e2e/tests/*.spec.ts`

## 错误处理与日志

-   统一错误处理：`src/lib/store/on-plugin-error.ts`
    -   用户提示使用 `Notice`
    -   生产环境遇到 `SilentError` 时可静默（避免弹窗）
-   日志：
    -   优先使用 `src/helpers/logger.ts`，不要直接 `console.*`
    -   如确需 `console`，请加 `// eslint-disable-next-line no-console`
-   断言：使用 `tiny-invariant`

## 生成文件 / 不要编辑

-   `temp/` 为工作目录，已被 `.gitignore` 忽略
-   开发构建产物在 `temp/vault/.obsidian/plugins/mandala-grid-dev/`
-   仓库根目录的 `main.js` 被刻意忽略；不要提交编译产物

## Cursor / Copilot 规则

-   未发现 Cursor 规则（`.cursorrules` 或 `.cursor/rules/`）
-   未发现 Copilot 规则（`.github/copilot-instructions.md`）

## 对 Agent 的期望

-   优先小而精的改动（尽量小的补丁）
-   贴合当前模块既有模式（store/reducer、view、helpers 等）
-   发 PR 前先跑：`npm run lint`，并根据改动范围跑 `npm test` 和/或 `npm run test:e2e`
-   **强制交付动作（每次写完都要执行，不可省略）**：只要本次会话产生了代码改动，必须在结束前执行 `commit + build + sync`
-   默认交付流程（完成代码改动后）：
    1. `git add -A && git commit -m "chore: update mandala grid plugin"`
    2. `npm run build`
    3. `rsync -av --delete --exclude 'data.json' temp/vault/.obsidian/plugins/mandala-grid-dev/ "/Users/panxiaorong/Library/Mobile Documents/iCloud~md~obsidian/Documents/obsidian/.obsidian/plugins/mandala-grid/"`
