import type { CellSectionIndicatorVariant } from 'src/mandala-cell/model/card-types';

export type CellDisplayPreset = 'grid-3x3' | 'grid-7x9' | 'grid-nx9' | 'grid-9x9';

export type CellDisplayPolicy = {
    preset: CellDisplayPreset;
    sectionIndicatorVariant: CellSectionIndicatorVariant;
    preserveActiveBackground: boolean;
    hideBuiltInHiddenInfo: boolean;
    contentLayout: 'intrinsic' | 'fill';
};

export const buildCellDisplayPolicy = ({
    preset,
    whiteThemeMode,
    hasGridSelection = false,
}: {
    preset: CellDisplayPreset;
    whiteThemeMode?: boolean;
    hasGridSelection?: boolean;
}): CellDisplayPolicy => {
    if (preset === 'grid-9x9') {
        return {
            preset,
            sectionIndicatorVariant: 'plain',
            preserveActiveBackground: false,
            hideBuiltInHiddenInfo: true,
            contentLayout: 'intrinsic',
        };
    }

    if (preset === 'grid-3x3') {
        return {
            preset,
            sectionIndicatorVariant: 'plain-with-pin',
            preserveActiveBackground: Boolean(whiteThemeMode),
            hideBuiltInHiddenInfo: true,
            contentLayout: 'fill',
        };
    }

    if (preset === 'grid-7x9') {
        return {
            preset,
            sectionIndicatorVariant: whiteThemeMode
                ? 'plain-with-pin'
                : 'section-capsule',
            preserveActiveBackground: hasGridSelection
                ? Boolean(whiteThemeMode)
                : true,
            hideBuiltInHiddenInfo: true,
            contentLayout: 'intrinsic',
        };
    }

    return {
        preset,
        sectionIndicatorVariant: whiteThemeMode
            ? 'plain-with-pin'
            : 'section-capsule',
        preserveActiveBackground: Boolean(whiteThemeMode),
        hideBuiltInHiddenInfo: true,
        contentLayout: 'fill',
    };
};
