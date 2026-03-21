import type {
    CellSectionIndicatorVariant,
    CellStyle,
    CellTextTone,
} from 'src/cell/model/card-types';

export type SharedCardRenderModel = {
    cardStyle: string | undefined;
    showInlineEditor: boolean;
    showContent: boolean;
    style: CellStyle;
};

export type MandalaCardRenderModel = SharedCardRenderModel & {
    displaySection: string;
    shouldHideBackgroundStyle: boolean;
    sectionIndicatorVariant: CellSectionIndicatorVariant;
    showSectionBackground: boolean;
    showSectionPin: boolean;
    capsuleTextTone: CellTextTone | null;
    metaStyle: string | undefined;
    isFloatingMobile: boolean;
};
