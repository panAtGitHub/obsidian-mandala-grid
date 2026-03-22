# src/mandala-display/agent.md

说明 `src/mandala-display` 目录的职责，方便后续区分“显示规则”和“设置存储”。

## 总体职责

- `src/mandala-display/`
  负责 mandala 的显示规则与显示相关派生数据。
- 这里回答的是“应该怎么显示”，而不是“设置怎么存”或“点击后做什么”。
- 只要逻辑涉及 section 配色、导出文本、日计划/周计划显示派生、显示相关 store，优先看这里。

---

## 当前目录含义

- `logic/`
  放显示规则、显示派生和显示导出逻辑。
  例如 section 配色、日计划/周计划显示辅助、导出文本映射、模板文本、九宫格方位布局规则等。

- `stores/`
  放与显示直接相关的 store。
  例如 section 颜色、文档派生的 pin/section 数据。

---

## 与其他模块的边界

- `src/mandala-display/`
  负责“显示规则是什么”。

- `src/mandala-settings/`
  负责“用户当前把这些显示设置成什么值”。

- `src/mandala-cell/`
  负责“格子具体如何渲染出来”。

- `src/mandala-scenes/`
  负责“不同场景如何使用这些显示规则”。

判断标准：

- 如果问题是“section 颜色怎么解析/派生”，优先改这里。
- 如果问题是“显示设置怎么保存”，不要先改这里。
- 如果问题是“组件怎么画”，不要先改这里。

---

## 修改建议

- 要改配色、导出文本、显示相关纯函数，优先看 `logic/`。
- 要改显示相关派生 store，优先看 `stores/`。
- 这里尽量放可复用的显示规则，不要直接写场景 DOM 或 Svelte 组件。
