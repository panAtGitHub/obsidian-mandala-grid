import type { CellDisplayPolicy } from 'src/mandala-cell/model/cell-display-policy';

type Build3x3CellDisplayOverridesOptions = {
    whiteThemeMode: boolean;
};

// 3x3 只描述“相对于标准格子默认值”的差异，
// 不再让 cell 层自己知道 3x3 这个场景名。
export const build3x3CellDisplayOverrides = ({
    whiteThemeMode,
}: Build3x3CellDisplayOverridesOptions): Partial<CellDisplayPolicy> => ({
    sectionIndicatorVariant: 'plain-with-pin',
    preserveActiveBackground: Boolean(whiteThemeMode),
    contentLayout: 'fill',
});
