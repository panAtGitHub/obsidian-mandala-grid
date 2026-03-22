# src/views/agent.md

说明 `src/views` 目录的职责，以及后续新增“场景”时推荐采用的文件组织方式。

## 总体职责

- `src/views/`
  负责“场景层”。
- 这里的场景，指的是某一种完整的九宫格呈现方式，例如 `9x9`、`nx9`、`7x9`。
- 场景层主要处理两件事：
  1. 格子如何排列
  2. 场景状态如何组装成格子可消费的 view model / props

`src/cell/` 负责单个格子的能力；`src/views/` 负责把很多格子组织成一个具体页面。

---

## 当前目录含义

- `shared/`
  放多个场景共享的视图壳层、上下文和通用组件。

- `view-9x9/`
  9x9 场景目录；当前保留 `layout.svelte` 与 `assemble-cell-view-model.ts`，并由场景入口组件承接额外编排逻辑。

- `view-3x3/`
  3x3 场景目录；当前已包含 `layout.svelte` 与 `assemble-cell-view-model.ts`。

- `view-nx9/`
  nx9 场景目录；当前由 `layout.svelte` 直接承担场景入口与布局渲染，并配套 `assemble-cell-view-model.ts`。

- `view-7x9/`
  7x9 场景目录；当前由 `layout.svelte` 直接承担场景入口，并保留桌面/移动子布局组件与统一 assembler。

### 关于 3x3 场景

当前仓库里，`3x3` 已经开始独立成 `src/views/view-3x3/` 目录，但外层模式切换和部分场景状态仍由 `shared/mandala-view.svelte` 承担。

当前主要落点如下：

- `view-3x3/layout.svelte`
  负责 3x3 格子的排列、卡片渲染、空格展示，以及子宫格导航按钮布局。

- `view-3x3/assemble-cell-view-model.ts`
  负责把 3x3 场景状态翻译成单格输入，包括 section、section 背景、pin、display policy、interaction policy 等。

- `shared/mandala-view.svelte`
  仍然负责模式切换、subgrid theme、today 跳转、外层容器和共享壳层逻辑。

- `src/cell/model/cell-display-policy.ts`
  定义 `grid-3x3` 的显示策略。

- `src/cell/viewmodel/policies/cell-interaction-policy.ts`
  定义 `grid-3x3` 的交互策略，例如移动端双击进入子宫格导航。

- `src/helpers/views/mandala/mobile-navigation.ts`
  承担 3x3 的子宫格进入、退出和移动端导航逻辑。

这说明当前的 `3x3` 已经进入“场景目录化”的第一步，但还没有彻底完成场景层与共享壳层的完全分离。

后续继续整理时，推荐维持下面这个结构，并逐步把更多 3x3 专属逻辑从 `shared/mandala-view.svelte` 下沉到 `view-3x3/`：

```text
src/views/view-3x3/
  layout.svelte
  assemble-cell-view-model.ts
```

其中：

- `layout.svelte`
  负责 3x3 格子的排列、subgrid 控件摆放、场景容器结构。

- `assemble-cell-view-model.ts`
  负责 3x3 场景下的格子 props 组装，例如 section、pin、display policy、interaction policy、主题 section 等。

---

## 推荐的场景目录结构

以后每个场景目录，优先收敛成下面这类结构：

```text
src/views/view-xxx/
  layout.svelte
  assemble-cell-view-model.ts
```

这两个文件的职责要明确分开。

### `layout.svelte`

负责场景布局，不负责复杂业务判断。

它应该处理：

- 格子怎么排列
- 容器结构怎么组织
- 哪些区域显示哪些 cell
- 循环渲染 cell 组件
- 把已经组装好的 cell props 传下去

它不应该处理：

- 各种 if/else 业务规则推导
- 某个格子该显示什么 meta
- 某个场景下字体/内容/section 的细节判断

一句话：`layout.svelte` 只负责“摆放和渲染”。

### `assemble-cell-view-model.ts`

负责场景组装层，把场景状态转换成单格最终输入。

它应该处理：

- 从 store / document / ui state 读取场景数据
- 决定每个格子最终显示什么
- 决定 display policy / interaction policy
- 决定 section、pin、摘要、内容可见性、字体偏移等细节
- 产出每个 cell 最终消费的 view model / render props

它不应该处理：

- Svelte DOM 结构
- CSS 布局
- 具体的点击事件绑定写法

一句话：`assemble-cell-view-model.ts` 只负责“把场景状态翻译成格子输入”。

---

## 推荐命名

如果一个场景只有一套布局和一套组装规则，优先使用统一命名：

- `layout.svelte`
- `assemble-cell-view-model.ts`

如果一个场景下有多套布局或多套组装方式，再加前缀细分，例如：

- `desktop-layout.svelte`
- `mobile-layout.svelte`
- `assemble-overview-cell-view-model.ts`
- `assemble-detail-cell-view-model.ts`

不要一开始就把命名做得很散；先统一，再按需要拆分。

---

## 迁移原则

如果你发现某个场景文件里同时出现：

- 网格排列逻辑
- 大量 cell props 推导
- 多个场景分支判断

说明这个文件已经同时承担了 layout 和 assembler 两层职责，应该考虑拆开。

优先按下面规则迁移：

1. 先把“每个格子显示什么”的推导搬到 `assemble-cell-view-model.ts`
2. 再让 `layout.svelte` 只消费组装结果
3. 最后把真正通用的单格逻辑继续下沉到 `src/cell/`

---

## 与 `src/cell/` 的边界

- `src/views/` 决定“这个场景里，格子应该怎么用”
- `src/cell/` 决定“格子本身如何显示、如何交互”

判断标准：

- 如果问题是“这个场景下哪些内容该显示”，优先改 `src/views/`
- 如果问题是“所有场景下这个格子本来就该这么画”，优先改 `src/cell/`
- 如果问题是“点击后发生什么”，通常看 `src/cell/viewmodel/`，必要时由场景层传策略

---

## 当前落地状态

当前 `view-3x3`、`view-9x9`、`view-nx9`、`view-7x9` 都已经开始按“场景 layout + assembler”分层。

目前可以按下面规则理解：

- 场景入口文件
  负责模式切换、上下文装配、端侧选择和少量场景级事件。
  在简单场景里，这个职责可以直接并入 `layout.svelte`，不必为了分层而额外保留一层薄壳文件。

- `layout.svelte`
  负责该场景最终如何渲染。

- `assemble-cell-view-model.ts`
  负责把 store / document / UI 状态转成格子或行模型。

- 其他子组件
  作为 layout 的子布局或子片段继续存在，例如桌面/移动布局拆分、特殊占位格、导航按钮片段等。

这样做的目标不是“文件更漂亮”，而是让你以后能快速判断：

- 该改布局
- 该改场景组装
- 还是该改单格模块
