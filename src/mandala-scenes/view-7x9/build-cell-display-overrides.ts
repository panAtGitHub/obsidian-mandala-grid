import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';

type Build7x9CellDisplayOverridesOptions = {
    whiteThemeMode: boolean;
    hasGridSelection: boolean;
    compactMode: boolean;
};

// 7x9 只描述“相对于标准格子默认值”的差异，
// 不再让 cell 层自己知道 7x9 这个场景名。
export const build7x9CellDisplayOverrides = ({
    whiteThemeMode,
    hasGridSelection,
    compactMode,
}: Build7x9CellDisplayOverridesOptions): Partial<CellDisplayPolicy> => ({
    ...(whiteThemeMode
        ? {
              sectionIndicatorVariant: 'plain-with-pin' as const,
          }
        : {}),
    ...(!hasGridSelection || whiteThemeMode
        ? {
              preserveActiveBackground: true,
          }
        : {}),
    contentLayout: 'fill',
    ...(compactMode
        ? {
              density: 'compact' as const,
              scrollbarMode: 'hidden' as const,
          }
        : {}),
});
