import type { MandalaView } from 'src/view/view';
import {
    enterThreeByThreeSubgrid,
    exitThreeByThreeSubgrid,
} from 'src/mandala-scenes/view-3x3/subgrid-lifecycle';

export const enterSubgridForNode = (view: MandalaView, nodeId: string) =>
    enterThreeByThreeSubgrid(view, nodeId);

export const exitCurrentSubgrid = (view: MandalaView) =>
    exitThreeByThreeSubgrid(view);

export const isGridCenter = (
    view: MandalaView,
    nodeId: string,
    section: string,
) => {
    const theme = view.viewStore.getValue().ui.mandala.subgridTheme;
    // 如果没有子主题前缀，则 '1' 是中心；如果有，则 section === theme 是中心
    return section === (theme ?? '1');
};
