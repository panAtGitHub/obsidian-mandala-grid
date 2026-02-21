# Obsidian Lineage Project Skill

本文件定义本项目的固定交付流程。每次对话中，只要发生代码改动，必须执行以下步骤。

## Mandatory Workflow (Run Every Time After Code Changes)

1. Build
- 运行：`npm run build`
- 注意：本项目真正的构建产物在 `temp/vault/.obsidian/plugins/lineage-dev/`，不是仓库根目录。

2. Sync Build Artifacts To Plugin Folder
- 只同步以下文件：
  - `temp/vault/.obsidian/plugins/lineage-dev/main.js` -> `main.js`
  - `temp/vault/.obsidian/plugins/lineage-dev/styles.css` -> `styles.css`
  - `manifest.json` -> `manifest.json`
- 插件库路径固定为：
  - `/Users/panxiaorong/Documents/ObsidianPlugin/.obsidian/plugins/obsidian-lineage/`
- 严禁删除或覆盖 `data.json`。

3. Commit (Bilingual Message Required)
- 每次写完代码后必须提交一次。
- Commit message 必须同时包含中文和英文说明。
- 推荐格式：`<type>: <中文描述> | <English description>`

4. Push
- 完成 commit 后，执行 `git push`（若当前分支配置了远端）。

## Safe Sync Command Example

```bash
npm run build && \
cp temp/vault/.obsidian/plugins/lineage-dev/main.js main.js && \
cp temp/vault/.obsidian/plugins/lineage-dev/styles.css styles.css && \
cp manifest.json manifest.json
```

## Notes

- 本仓库工作目录已经是目标插件目录，执行同步时不得触碰 `data.json`。
- 若 `git push` 无上游分支，先设置 upstream 再推送。
