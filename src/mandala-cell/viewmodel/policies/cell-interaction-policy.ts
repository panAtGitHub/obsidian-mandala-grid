export type CellInteractionPreset =
    | 'grid-3x3'
    | 'grid-7x9'
    | 'grid-nx9'
    | 'grid-9x9';

export type CellInteractionPolicy = {
    preset: CellInteractionPreset;
    mobileDoubleClickAction: 'subgrid-navigation' | 'none';
};

export const buildCellInteractionPolicy = ({
    preset,
}: {
    preset: CellInteractionPreset;
}): CellInteractionPolicy => ({
    preset,
    mobileDoubleClickAction:
        preset === 'grid-3x3' ? 'subgrid-navigation' : 'none',
});
