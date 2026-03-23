import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';

// 阅读顺序建议：
// 1. 先看 cell-display-policy.ts，了解配置字段
// 2. 再看本文件，了解标准格子的默认显示配置
// 3. 最后看各 scene 的 build-cell-display-overrides.ts，了解场景如何覆盖默认值
// 标准格子的默认展示配置：
// 场景层如果没有特殊需求，直接沿用这套默认值。
export const createDefaultCellDisplayPolicy = (): CellDisplayPolicy => ({
    sectionIndicatorVariant: 'section-capsule',
    preserveActiveBackground: false,
    hideBuiltInHiddenInfo: true,
    contentLayout: 'intrinsic',
    density: 'normal',
    scrollbarMode: 'selected-hover',
    hoverBehavior: 'elevated',
    inactiveSurfaceMode: 'inline',
});
