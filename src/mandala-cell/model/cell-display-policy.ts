import type { CellSectionIndicatorVariant } from 'src/mandala-cell/model/card-types';
import type { CellScrollbarMode } from 'src/mandala-cell/model/cell-scrollbar-mode';

// 阅读顺序建议（cell 显示配置这条线）：
// 1. 先看本文件，了解 CellDisplayPolicy 有哪些字段
// 2. 再看 default-cell-display-policy.ts，了解标准格子的默认值
// 3. 再看各 scene 的 build-cell-display-overrides.ts，了解场景只改了哪些默认值
// 4. 最后看各 scene 的 assemble-cell-view-model.ts，了解默认值和场景微调是怎么合并的
export type CellDisplayPolicy = {
    sectionIndicatorVariant: CellSectionIndicatorVariant;
    preserveActiveBackground: boolean;
    hideBuiltInHiddenInfo: boolean;
    contentLayout: 'intrinsic' | 'fill';
    density: 'normal' | 'compact';
    scrollbarMode: CellScrollbarMode;
    hoverBehavior: 'elevated' | 'none';
    inactiveSurfaceMode: 'inline' | 'detached';
};
