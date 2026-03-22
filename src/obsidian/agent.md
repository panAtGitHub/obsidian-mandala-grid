# src/obsidian/agent.md

说明 `src/obsidian` 目录的职责，方便后续区分“业务模块”和“Obsidian 平台接线层”。

## 总体职责

- `src/obsidian/`
  负责与 Obsidian 平台 API 的接线。
- 这里放的是命令、事件、modal、编辑器扩展、markdown 后处理、setting tab、状态栏等平台层代码。
- 它不应该承载大量 mandala 业务规则本身，而是调用其他业务模块完成工作。

---

## 当前目录含义

- `commands/`
  Obsidian 命令注册与命令辅助。

- `events/`
  Obsidian workspace / vault 事件接线。

- `editor-extensions/`
  编辑器扩展相关代码。

- `markdown-post-processors/`
  markdown 渲染后处理与 embed 渲染接线。

- `modals/`
  基于 Obsidian UI 的 modal。

- `settings/`
  Obsidian setting tab 接线。

- `status-bar/`
  状态栏接线。

- `helpers/`、`patches/`、`context-menu/`
  放平台层辅助与补丁。

---

## 与其他模块的边界

- `src/obsidian/`
  负责“把业务能力接到 Obsidian 平台上”。

- `src/mandala-document/`、`src/mandala-cell/`、`src/mandala-scenes/` 等
  负责真正的业务逻辑。

判断标准：

- 如果问题是“Obsidian 命令/事件怎么接”，优先看这里。
- 如果问题是“文档结构/显示规则/场景编排本身怎么实现”，不要先改这里。

---

## 修改建议

- 要改命令、modal、workspace 事件、编辑器扩展，优先看 `obsidian/`。
- 平台层代码尽量保持薄，复杂逻辑优先调用业务模块，不要在这里重新发明一套规则。
