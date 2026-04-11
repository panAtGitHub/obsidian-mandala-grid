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

const gridStyleCache = new Map<string, ResolvedGridStyle>();

export const resolveCardGridStyle = ({
    whiteThemeMode,
    compactMode = false,
}: GridStyleOptions): ResolvedGridStyle => {
    const cacheKey = `${whiteThemeMode ? 'white' : 'theme'}:${compactMode ? 'compact' : 'regular'}`;
    const cached = gridStyleCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const defaultPolicy = createDefaultCellDisplayPolicy();
    const selectionStyle: GridSelectionStyle = whiteThemeMode
        ? 'cell-outline'
        : 'node-active';
    const preserveActiveBackground = selectionStyle === 'cell-outline';

    const resolved: ResolvedGridStyle = {
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
            cardOverflowMode: 'hidden',
            hoverBehavior: 'none',
            inactiveSurfaceMode: 'detached',
            ...(compactMode
                ? {
                      density: 'compact' as const,
                  }
                : {}),
        },
    };
    gridStyleCache.set(cacheKey, resolved);
    return resolved;
};
