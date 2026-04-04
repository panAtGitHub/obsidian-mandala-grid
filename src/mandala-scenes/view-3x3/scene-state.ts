import { findChildGroup } from 'src/mandala-document/tree-utils/find/find-child-group';
import {
    enterSubgridForNode,
    exitCurrentSubgrid,
    isGridCenter,
} from 'src/mandala-interaction/helpers/mobile-navigation';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import type { MandalaView } from 'src/view/view';
import { ensureChildrenForSection } from 'src/mandala-interaction/helpers/ensure-node-for-section';
import {
    assemble3x3CellViewModels,
    type Assemble3x3CellViewModelsArgs,
} from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';
import { canExpandThreeByThreeChildren } from 'src/mandala-scenes/view-3x3/subgrid-depth';

export const resolveThreeByThreeTheme = (
    subgridTheme: string | null | undefined,
) => subgridTheme ?? '1';

export const buildThreeByThreeCells = (args: Assemble3x3CellViewModelsArgs) =>
    assemble3x3CellViewModels(args);

export const syncThreeByThreeSubgridState = ({
    view,
    mode,
    subgridTheme,
    documentState,
    sectionToNodeId,
    allowSubgridExpansion,
}: {
    view: MandalaView;
    mode: string;
    subgridTheme: string | null | undefined;
    documentState: DocumentState;
    sectionToNodeId: Record<string, string | undefined>;
    allowSubgridExpansion: boolean;
}) => {
    if (
        allowSubgridExpansion &&
        mode === '3x3' &&
        subgridTheme &&
        canExpandThreeByThreeChildren(view, subgridTheme) &&
        documentState.meta.isMandala
    ) {
        const themeNodeId = sectionToNodeId[subgridTheme];
        if (themeNodeId) {
            const childGroup = findChildGroup(
                documentState.document.columns,
                themeNodeId,
            );
            const childCount = childGroup?.nodes.length ?? 0;
            if (childCount < 8) {
                ensureChildrenForSection(view, subgridTheme);
            }
        }
    }
};

export const syncThreeByThreeSceneState = ({
    view,
    mode,
    subgridTheme,
    documentState,
    sectionToNodeId,
}: {
    view: MandalaView;
    mode: string;
    subgridTheme: string | null | undefined;
    documentState: DocumentState;
    sectionToNodeId: Record<string, string | undefined>;
}) =>
    syncThreeByThreeSubgridState({
        view,
        mode,
        subgridTheme,
        documentState,
        sectionToNodeId,
        allowSubgridExpansion: true,
    });

export const enterThreeByThreeSubgridFromButton = (
    view: MandalaView,
    event: MouseEvent,
    nodeId: string,
) => {
    event.stopPropagation();
    enterSubgridForNode(view, nodeId);
};

export const exitThreeByThreeSubgridFromButton = (
    view: MandalaView,
    event: MouseEvent,
) => {
    event.stopPropagation();
    exitCurrentSubgrid(view);
};

export const handleThreeByThreeMobileCardDoubleClick = (
    view: MandalaView,
    event: MouseEvent,
    nodeId: string,
    displaySection: string,
) => {
    event.stopPropagation();
    if (isGridCenter(view, nodeId, displaySection)) {
        exitCurrentSubgrid(view);
        return;
    }
    enterSubgridForNode(view, nodeId);
};

export const getThreeByThreeUpButtonLabel = (theme: string) =>
    theme.includes('.') ? '退出上一层子九宫格' : '上一层核心九宫格';

export const getThreeByThreeDownButtonLabel = (theme: string) =>
    theme.includes('.') ? '进入下一层子九宫格' : '下一层核心九宫格';
