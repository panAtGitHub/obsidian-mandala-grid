import type {
    CellSectionIndicatorVariant,
    CellSectionMetaVariant,
    CellStyle,
    CellTextTone,
} from 'src/mandala-cell/model/card-types';

// 阅读顺序建议：
// 1. 先看 card-view-model.ts，了解场景层传给标准格子的上游输入
// 2. 再看 build-mandala-card-render-model.ts，了解这些输入如何被派生成最终渲染状态
// 3. 最后看本文件，确认 render model 最终提供给 view 的字段有哪些
export type SharedCardRenderModel = {
    cardStyle: string | undefined;
    surfaceStyle: string | undefined;
    bodyStyle: string | undefined;
    showInlineEditor: boolean;
    showContent: boolean;
    hideBuiltInHiddenInfo: boolean;
    style: CellStyle;
};

export type MandalaCardRenderModel = SharedCardRenderModel & {
    displaySection: string;
    shouldHideBackgroundStyle: boolean;
    sectionIndicatorVariant: CellSectionIndicatorVariant;
    sectionMetaVariant: CellSectionMetaVariant;
    showSectionPin: boolean;
    sectionMetaTextTone: CellTextTone | null;
    metaStyle: string | undefined;
    isFloatingMobile: boolean;
};
