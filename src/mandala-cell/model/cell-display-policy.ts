import type { CellSectionIndicatorVariant } from 'src/mandala-cell/model/card-types';
import type { CellScrollbarMode } from 'src/mandala-cell/model/cell-scrollbar-mode';

export type CellDisplayPolicy = {
    sectionIndicatorVariant: CellSectionIndicatorVariant;
    preserveActiveBackground: boolean;
    hideBuiltInHiddenInfo: boolean;
    contentLayout: 'intrinsic' | 'fill';
    density: 'normal' | 'compact';
    scrollbarMode: CellScrollbarMode;
};
