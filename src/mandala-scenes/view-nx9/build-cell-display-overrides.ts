import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';

type BuildNx9CellDisplayOverridesOptions = {
    whiteThemeMode: boolean;
};

// nx9 只描述“相对于标准格子默认值”的差异，
// 不再让 cell 层自己知道 nx9 这个场景名。
export const buildNx9CellDisplayOverrides = ({
    whiteThemeMode,
}: BuildNx9CellDisplayOverridesOptions): Partial<CellDisplayPolicy> => ({
    ...(whiteThemeMode
        ? {
              sectionIndicatorVariant: 'plain-with-pin' as const,
              preserveActiveBackground: true,
          }
        : {}),
    contentLayout: 'fill',
    hoverBehavior: 'none',
    inactiveSurfaceMode: 'detached',
});
