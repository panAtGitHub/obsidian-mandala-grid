# src/mandala-interaction/agent.md

说明 `src/mandala-interaction` 目录的职责，方便后续区分“交互辅助”和具体组件控制器。

## 总体职责

- `src/mandala-interaction/`
  负责 mandala 交互相关的共享辅助逻辑。
- 这里放的是跨场景、跨组件可复用的交互规则与导航辅助。
- 它不直接承担完整的组件 controller，也不负责设置存储。

---

## 当前目录含义

- `helpers/`
  放交互辅助函数。
  例如移动端导航、双击判定、预览弹窗辅助、兼容模式解析、打开编辑器等。

- `keyboard/`
  放九宫格相关键盘导航辅助。
  例如 `3x3 / 9x9 / 7x9` 的键盘导航入口。

---

## 与其他模块的边界

- `src/mandala-interaction/`
  负责“交互规则的共享辅助”。

- `src/mandala-cell/viewmodel/`
  负责“单格组件级 controller / action / policy”。

- `src/mandala-scenes/`
  负责“某个场景如何接这些交互辅助”。

- `src/mandala-settings/`
  负责“交互相关设置值如何存取”。

判断标准：

- 如果问题是“移动端如何进入/退出子宫格”，优先看这里。
- 如果问题是“某个 card 双击后做什么”，通常先看 `mandala-cell/viewmodel/`。
- 如果问题是“快捷键设置值怎么读”，不要先改这里。

---

## 修改建议

- 要改导航、双击、兼容模式辅助，优先看 `helpers/`。
- 要改九宫格专属键盘导航，优先看 `keyboard/`。
- 如果逻辑明显只服务某一个组件，不要强行放进这里。
