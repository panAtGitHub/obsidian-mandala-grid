import type { CellStyle } from 'src/mandala-cell/model/card-types';
import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import type { ThemeTone } from 'src/mandala-display/contrast/readable-text-tone';
import type { CellSectionColorContext } from 'src/mandala-cell/visual/section-color-visual';

// 阅读顺序建议（标准格子数据流）：
// 1. 先看 cell-display-policy.ts 和 default-cell-display-policy.ts
// 2. 再看各 scene 的 assemble-cell-view-model.ts，了解场景如何组装 MandalaCardViewModel
// 3. 再看本文件，理解一张标准格子在“组装完成但尚未渲染”时长什么样
// 4. 然后看 build-mandala-card-render-model.ts，了解它如何继续变成 render model
type SharedCardViewModel = {
    style: CellStyle;
    contentEnabled: boolean;
    // scene 只负责传 section 色彩输入；具体背景/胶囊色由 cell visual 层统一决定。
    sectionColorContext: CellSectionColorContext | null;
    displayPolicy: CellDisplayPolicy;
};

export type MandalaCardUiState = {
    active: boolean;
    editing: boolean;
    selected: boolean;
    pinned: boolean;
};

export type MandalaThemeSnapshot = {
    themeTone: ThemeTone;
    themeUnderlayColor: string;
    activeThemeUnderlayColor?: string;
};

export type MandalaCardViewModel = SharedCardViewModel & {
    nodeId: string;
    section: string;
};
