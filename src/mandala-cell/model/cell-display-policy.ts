import type { CellSectionIndicatorVariant } from 'src/mandala-cell/model/card-types';
import type { CellScrollbarMode } from 'src/mandala-cell/model/cell-scrollbar-mode';

export type CellDisplayPreset = 'grid-7x9' | 'grid-nx9' | 'grid-9x9';

export type CellDisplayPolicy = {
    sectionIndicatorVariant: CellSectionIndicatorVariant;
    preserveActiveBackground: boolean;
    hideBuiltInHiddenInfo: boolean;
    contentLayout: 'intrinsic' | 'fill';
    density: 'normal' | 'compact';
    scrollbarMode: CellScrollbarMode;
};

export const buildCellDisplayPolicy = ({
    preset,
    whiteThemeMode,
    hasGridSelection = false,
    compactMode = false,
}: {
    preset: CellDisplayPreset;
    whiteThemeMode?: boolean;
    hasGridSelection?: boolean;
    compactMode?: boolean;
}): CellDisplayPolicy => {
    if (preset === 'grid-9x9') {
        return {
            sectionIndicatorVariant: 'plain',
            preserveActiveBackground: false,
            hideBuiltInHiddenInfo: true,
            contentLayout: 'intrinsic',
            density: 'normal',
            scrollbarMode: 'hidden',
        };
    }

    if (preset === 'grid-7x9') {
        return {
            sectionIndicatorVariant: whiteThemeMode
                ? 'plain-with-pin'
                : 'section-capsule',
            preserveActiveBackground: hasGridSelection
                ? Boolean(whiteThemeMode)
                : true,
            hideBuiltInHiddenInfo: true,
            contentLayout: 'fill',
            density: compactMode ? 'compact' : 'normal',
            scrollbarMode: compactMode ? 'hidden' : 'selected-hover',
        };
    }

    return {
        sectionIndicatorVariant: whiteThemeMode
            ? 'plain-with-pin'
            : 'section-capsule',
        preserveActiveBackground: Boolean(whiteThemeMode),
        hideBuiltInHiddenInfo: true,
        contentLayout: 'fill',
        density: 'normal',
        scrollbarMode: 'selected-hover',
    };
};
