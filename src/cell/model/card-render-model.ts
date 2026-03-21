import type {
    CellSectionIndicatorVariant,
    CellStyle,
    CellTextTone,
} from 'src/cell/model/card-types';

export type SharedCardRenderModel = {
    cardStyle: string | undefined;
    showInlineEditor: boolean;
    showContent: boolean;
    hideBuiltInHiddenInfo: boolean;
    style: CellStyle;
};

export type MandalaCardRenderModel = SharedCardRenderModel & {
    displaySection: string;
    shouldHideBackgroundStyle: boolean;
    sectionIndicatorVariant: CellSectionIndicatorVariant;
    showSectionBackground: boolean;
    showSectionPin: boolean;
    showSectionColorDot: boolean;
    capsuleTextTone: CellTextTone | null;
    metaStyle: string | undefined;
    isFloatingMobile: boolean;
};
