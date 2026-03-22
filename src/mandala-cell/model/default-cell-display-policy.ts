import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';

// 标准格子的默认展示配置：
// 场景层如果没有特殊需求，直接沿用这套默认值。
export const createDefaultCellDisplayPolicy = (): CellDisplayPolicy => ({
    sectionIndicatorVariant: 'section-capsule',
    preserveActiveBackground: false,
    hideBuiltInHiddenInfo: true,
    contentLayout: 'intrinsic',
    density: 'normal',
    scrollbarMode: 'selected-hover',
});
