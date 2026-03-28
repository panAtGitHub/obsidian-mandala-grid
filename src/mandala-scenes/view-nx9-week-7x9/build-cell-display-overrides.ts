import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';
import { buildNx9CellDisplayOverrides } from 'src/mandala-scenes/view-nx9/build-cell-display-overrides';

type BuildNx9WeekCellDisplayOverridesOptions = {
    whiteThemeMode: boolean;
    hasGridSelection: boolean;
    compactMode: boolean;
};

export const buildNx9WeekCellDisplayOverrides = ({
    whiteThemeMode,
    hasGridSelection,
    compactMode,
}: BuildNx9WeekCellDisplayOverridesOptions): Partial<CellDisplayPolicy> => ({
    ...buildNx9CellDisplayOverrides({ whiteThemeMode }),
    ...(!hasGridSelection || whiteThemeMode
        ? {
              preserveActiveBackground: true,
          }
        : {}),
    ...(compactMode
        ? {
              density: 'compact' as const,
              scrollbarMode: 'hidden' as const,
          }
        : {}),
});
