# src/mandala-settings/agent.md

说明 `src/mandala-settings` 目录的职责，方便后续区分“设置状态”和“设置界面”。

## 总体职责

- `src/mandala-settings/`
  负责设置的定义、默认值、存储、迁移、读取，以及设置面板 UI。
- 这里回答的是“设置是什么、怎么改、怎么读、怎么展示给用户”。
- 它不负责文档结构本身，也不直接负责单格渲染。

---

## 当前目录含义

- `state/`
  放设置状态本体。
  包括 settings type、默认值、actions、reducer、derived store、migration、subscriptions。

- `ui/`
  放设置相关界面。
  当前主要包括：
  - `settings-panel/`：插件设置页
  - `view-options/`：视图选项面板与子面板

---

## 与其他模块的边界

- `src/mandala-settings/`
  负责“设置怎么保存和读取”。

- `src/mandala-display/`
  负责“这些设置最终对应什么显示规则”。

- `src/mandala-scenes/` 与 `src/mandala-cell/`
  负责“读取设置后实际如何渲染”。

判断标准：

- 如果问题是“默认值是什么、action 怎么 dispatch”，优先看 `mandala-settings`。
- 如果问题是“卡片风格本身应该怎么画”，不要先改这里。

---

## 修改建议

- 要改设置字段、默认值、迁移、派生读取，优先看 `state/`。
- 要改设置面板的表单结构与 UI，优先看 `ui/`。
- 不要把复杂显示规则直接塞进 reducer 或设置面板；优先下沉到 `mandala-display`。
