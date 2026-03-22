# src/mandala-document/agent.md

说明 `src/mandala-document` 目录的职责，方便后续区分“文档真相层”和展示/交互层。

## 总体职责

- `src/mandala-document/`
  负责 mandala 文档结构本身。
- 这里保存的是“文档是什么”，而不是“如何显示”或“如何交互”。
- 只要逻辑涉及 section 结构、节点树、文档加载与保存后的状态组织，优先看这里。

---

## 当前目录含义

- `engine/`
  放文档引擎本体。
  负责 section 解析、结构校验、序列化、构建文档状态等核心能力。

- `state/`
  放文档状态与 reducer。
  负责把磁盘内容加载进内存状态，并处理内容变更、pin 状态、mandala 结构更新等。

- `tree-utils/`
  放树结构工具。
  负责查找、插入、删除、移动、排序等纯树操作。

---

## 与其他模块的边界

- `src/mandala-document/`
  负责“文档数据长什么样”。

- `src/mandala-scenes/`
  负责“场景里如何摆放这些格子”。

- `src/mandala-cell/`
  负责“单个格子如何渲染与交互”。

- `src/mandala-display/`
  负责“显示规则、导出文本、配色和布局规则”。

判断标准：

- 如果问题是“section 结构是否合法”，改 `mandala-document`。
- 如果问题是“节点树如何移动/排序”，改 `mandala-document`。
- 如果问题是“某个场景里应该显示什么”，不要先改这里。

---

## 修改建议

- 要改 section 解析、序列化、结构校验，优先看 `engine/`。
- 要改文档加载、内容写回后的状态组织，优先看 `state/`。
- 要改树结构查找、移动、插入、删除，优先看 `tree-utils/`。
- 纯显示判断不要塞进这里；文档层尽量保持与 UI 解耦。
