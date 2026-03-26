import { setActiveCellNx9 } from 'src/mandala-scenes/view-nx9/set-active-cell';
import type { MandalaView } from 'src/view/view';

export const createNx9SelectionRuntime = ({
    view,
    getCurrentPage,
}: {
    view: MandalaView;
    getCurrentPage: () => number;
}) => {
    const selectGhostCreateCell = (row: number) => {
        setActiveCellNx9(view, {
            row,
            col: 0,
            page: getCurrentPage(),
        });
    };

    const selectRealCell = (
        row: number,
        col: number,
        nodeId: string | null,
    ) => {
        if (!nodeId) return;
        setActiveCellNx9(view, {
            row,
            col,
            page: getCurrentPage(),
        });
    };

    return {
        selectGhostCreateCell,
        selectRealCell,
    };
};
