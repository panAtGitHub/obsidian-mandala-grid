import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';

export type GridSelectionStyle = 'node-active' | 'cell-outline';

export type GridStyleOptions = {
    whiteThemeMode: boolean;
    compactMode?: boolean;
};

export type ResolvedGridStyle = {
    cacheKey: string;
    compactMode: boolean;
    selectionStyle: GridSelectionStyle;
    cellDisplayPolicy: CellDisplayPolicy;
};

export const resolveCardGridStyle = ({
    whiteThemeMode,
    compactMode = false,
}: GridStyleOptions): ResolvedGridStyle => {
    const defaultPolicy = createDefaultCellDisplayPolicy();
    const selectionStyle: GridSelectionStyle = whiteThemeMode
        ? 'cell-outline'
        : 'node-active';
    const preserveActiveBackground = selectionStyle === 'cell-outline';

    return {
        cacheKey: [
            whiteThemeMode ? 'white' : 'theme',
            compactMode ? 'compact' : 'regular',
            selectionStyle,
        ].join(':'),
        compactMode,
        selectionStyle,
        cellDisplayPolicy: {
            ...defaultPolicy,
            sectionIndicatorVariant: whiteThemeMode
                ? 'plain-with-pin'
                : defaultPolicy.sectionIndicatorVariant,
            preserveActiveBackground,
            contentLayout: 'fill',
            hoverBehavior: 'none',
            inactiveSurfaceMode: 'detached',
            ...(compactMode
                ? {
                      density: 'compact' as const,
                      scrollbarMode: 'hidden' as const,
                  }
                : {}),
        },
    };
};
