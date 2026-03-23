export type CellInteractionPolicy = {
    mobileDoubleClickAction: 'subgrid-navigation' | 'none';
};

export const buildCellInteractionPolicy = ({
    mobileDoubleClickAction = 'none',
}: {
    mobileDoubleClickAction?: CellInteractionPolicy['mobileDoubleClickAction'];
}): CellInteractionPolicy => ({
    mobileDoubleClickAction,
});
