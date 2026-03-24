import type { CellStyle } from 'src/mandala-cell/model/card-types';
import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import type { ThemeTone } from 'src/mandala-interaction/helpers/contrast-text-tone';

// 阅读顺序建议（标准格子数据流）：
// 1. 先看 cell-display-policy.ts 和 default-cell-display-policy.ts
// 2. 再看各 scene 的 assemble-cell-view-model.ts，了解场景如何组装 MandalaCardViewModel
// 3. 再看本文件，理解一张标准格子在“组装完成但尚未渲染”时长什么样
// 4. 然后看 build-mandala-card-render-model.ts，了解它如何继续变成 render model
type SharedCardViewModel = {
    style: CellStyle;
    contentEnabled: boolean;
    // 用户自定义色应用透明度后的最终背景输入；没有自定义色时为 null。
    sectionColor: string | null;
    metaAccentColor: string | null;
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
