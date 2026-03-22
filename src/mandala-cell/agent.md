# src/mandala-cell/agent.md

说明 `src/mandala-cell` 目录下各文件夹与各文件的职责，方便后续改动时判断应该把逻辑放在哪一层。

## 总体分层

- `model/`
  负责纯数据结构、派生状态、展示策略、render model / view model 组装；不直接处理 Svelte 事件。
- `view/`
  负责 Svelte 展示组件；接收外部状态并渲染，不承担核心业务决策。
- `viewmodel/`
  负责交互动作、控制器、事件处理策略；连接 view 与外部 view/store。

---

## model/

### 类型与数据模型

- `card-types.ts`
  定义 cell 相关基础类型，例如网格模式、网格坐标、section 指示器样式、文字 tone、样式类型别名。

- `card-render-model.ts`
  定义给视图层直接消费的 render model 结构，描述一张 card 最终该如何渲染。

- `card-view-model.ts`
  定义更上层的 view model 结构，给外层组装 card 状态时使用。

- `simple-summary-cell-model.ts`
  定义简化版 summary cell 的数据结构和 active cell 状态。

### 构建函数

- `build-mandala-card-render-model.ts`
  核心渲染组装器。把节点状态、显示策略、section 配色、预览弹窗状态、移动端状态等输入，组合成 `MandalaCardRenderModel`。

- `build-mandala-card-view-model.ts`
  轻量 view model 组装器，目前主要承担结构归一化和透传。

### 展示策略与派生状态

- `cell-display-policy.ts`
  定义 cell 展示策略的数据结构类型。默认值与场景 overrides 都围绕这个类型组装最终显示策略。

- `default-cell-display-policy.ts`
  定义标准格子的默认展示配置。场景层如果没有特殊需求，应优先沿用这里的默认值。

- `cell-display-policy.spec.ts`
  已移除。默认配置与各场景 overrides 分别在各自文件旁边测试。

- `mandala-card-meta.ts`
  根据 section 指示器变体、section 颜色、pin 状态、主题明暗，计算 meta 区域该显示背景、pin、胶囊色块和文字 tone。

- `mandala-card-meta.spec.ts`
  `mandala-card-meta.ts` 的单元测试。

- `mandala-card-style.ts`
  负责 card 主体样式派生，例如背景色、激活态视觉、是否隐藏背景样式、文字 tone 等。

- `mandala-card-style.spec.ts`
  `mandala-card-style.ts` 的单元测试。

---

## view/

### 顶层与组合组件

- `components/mandala-card.svelte`
  标准 mandala card 的主组件。直接消费场景层组装好的 `MandalaCardViewModel`，负责补齐运行时上下文、构建 render model、绑定点击/双击/交换事件，并组合内容区与 meta 区。

- `components/card-main-content.svelte`
  card 主内容区容器，负责决定是否显示 inline editor、内容主体、隐藏内建信息以及字体大小参数。

- `components/card-meta.svelte`
  card 元信息组合层，当前主要是把 render model 中的 section/pin/meta 样式参数传给 `section-meta.svelte`。

- `components/simple-summary-cell.svelte`
  简化 summary cell 的视图组件，用于较轻量的宫格单元展示与交互。

### 具体展示片段

- `section-meta.svelte`
  右上角 section 元信息展示组件。负责渲染 section 文案、pin 图标和不同 meta 外观，不应承担复杂业务判断。

- `style/card-style.svelte`
  把节点样式规则以独立片段方式注入 card 视图。

### 内容区子组件

- `content/content.svelte`
  内容区入口组件，决定内容展示时的整体结构与模式切换。

- `content/inline-editor.svelte`
  cell 内联编辑器组件，负责节点文本的直接编辑体验。

- `content/source-preview.svelte`
  内容预览组件，负责把源内容渲染为预览态。

---

## viewmodel/

### actions/

- `actions/set-active-main-split-node.ts`
  设置主分栏当前 active 节点。

- `actions/enable-edit-mode-in-main-split.ts`
  在主分栏中切换指定节点进入编辑态。

- `actions/enable-edit-mode-in-sidebar.ts`
  在侧边栏中为指定节点开启编辑态。

### controller/

- `controller/mandala-card-controller.ts`
  标准 card 的点击、双击、选中控制器。根据平台和策略决定是激活、进入编辑，还是执行移动端子宫格导航。

- `controller/simple-summary-cell-controller.ts`
  summary cell 的点击、双击、指针开始事件控制器。

- `controller/swap-controller.ts`
  处理 cell 交换交互，包括拖拽开始、源/目标/禁用态判断，以及交换态下的双击阻断。

### policies/

- `policies/cell-interaction-policy.ts`
  定义不同场景下的 cell 交互策略，例如移动端双击行为。

- `policies/cell-interaction-policy.spec.ts`
  `cell-interaction-policy.ts` 的单元测试。

- `policies/cell-activation-policy.ts`
  负责“某个 cell 被激活时应该联动更新哪些外部状态”的策略逻辑。

### content-event-handlers/

- `content-event-handlers/get-cursor-position.ts`
  提供编辑态光标位置读取的基础工具。

- `content-event-handlers/helpers/is-grabbing.ts`
  判断当前视图是否处于 grabbing / 拖动态。

- `content-event-handlers/handle-links/handle-links.ts`
  cell 内容区链接点击的总入口，负责分发不同类型链接的处理逻辑。

- `content-event-handlers/handle-links/file-link/handle-file-link.ts`
  处理文件链接跳转。

- `content-event-handlers/handle-links/heading-link/handle-heading.ts`
  处理 heading 链接跳转。

- `content-event-handlers/handle-links/heading-link/handle-local-heading-link.ts`
  处理当前文件内的本地 heading 跳转。

- `content-event-handlers/handle-links/block-link/handle-block-link.ts`
  处理 block 链接跳转。

- `content-event-handlers/handle-links/block-link/handle-local-block-link.ts`
  处理当前文档内的本地 block 跳转。

- `content-event-handlers/handle-links/block-link/handle-global-block-link.ts`
  处理跨文档 block 链接，以及根据修饰键决定打开 pane 类型。

- `content-event-handlers/handle-links/helpers/select-card.ts`
  链接跳转前后用于选中 card 的辅助函数。

- `content-event-handlers/handle-links/helpers/get-current-file-subpath.ts`
  解析当前文件上下文中的 subpath。

- `content-event-handlers/handle-links/helpers/get-existing-right-tab-group.ts`
  获取现有右侧 tabs 容器。

- `content-event-handlers/handle-links/helpers/open-file-in-existing-right-tab-group.ts`
  把文件打开到已有的右侧 tab group 中。

---

## 修改建议

- 要改“显示什么、样式如何派生”，优先看 `model/`。
- 要改“长什么样、如何拆组件”，优先看 `view/`。
- 要改“点了之后发生什么、不同平台行为差异”，优先看 `viewmodel/`。
- 若某个逻辑同时涉及样式派生和交互，不要直接塞进 Svelte 组件；优先拆到 `model/` 或 `viewmodel/`。

## 微调落点

- `src/mandala-cell/` 定义“一个标准格子最终可以如何呈现”。
- 场景层可以决定“这个场景用哪一种格子策略”，但不应该直接重写格子内部 DOM 的实现。

判断微调该放哪一层时，优先按下面规则：

- 如果是格子内部视觉实现微调，例如内容 padding、meta 位置、编辑区盒模型、滚动条样式，优先改 `view/`。
- 如果是某种显示能力或密度策略的变化，例如 `fill`、`compact`、摘要截断、滚动策略，优先改 `model/` 的 display policy / render model 派生，再由 `view/` 消费。
- 如果是点击、双击、进入编辑、激活联动等行为差异，优先改 `viewmodel/`。

反向判断也很重要：

- 如果你需要在场景文件里直接写 `.lng-prev`、`.editor-container`、`.cm-scroller`、`.view-content` 这类选择器，通常说明改错层了；这类内部 DOM 应优先回收进 `src/mandala-cell/`。
- 如果只是某个场景想启用或关闭某种格子能力，不要在场景层复制一套样式；应让场景 assembler 传语义，再由 `src/mandala-cell/` 实现最终表现。
