import { MandalaView } from 'src/view/view';
import { ActiveBranch } from 'src/stores/view/default-view-state';
import { adjustScrollBehavior } from 'src/stores/view/subscriptions/effects/align-branch/helpers/adjust-scroll-behavior';
import { PluginAction } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';
import { Column, DocumentState } from 'src/mandala-document/state/document-state-type';
import { ActiveNodesOfColumn } from 'src/stores/view/view-state-type';

export type PartialDOMRect = Pick<DOMRect, 'top' | 'height'>;
export type AlignBranchState = {
    rects: Map<string, PartialDOMRect>;
};
export type AlignBranchSettings = {
    behavior: ScrollBehavior;
    centerActiveNodeH: boolean;
    centerActiveNodeV: boolean;
    zoomLevel: number;
};
export type AlignBranchContext = {
    previousActiveBranch: ActiveBranch | null;
    columns: Column[];
    activeBranch: ActiveBranch;
    container: HTMLElement;
    containerRect: DOMRect;
    alignBranchSettings: AlignBranchSettings;
    state: AlignBranchState;
    activeNodesOfColumn: ActiveNodesOfColumn;
    documentState: DocumentState;
};
export const createContext = (
    view: MandalaView,
    action: PluginAction,
    previousActiveBranch: ActiveBranch | null,
) => {
    const settings = view.plugin.settings.getValue();
    const container = view.container!;
    const documentState = view.documentStore.getValue();
    const viewState = view.viewStore.getValue();
    const activeBranch = viewState.document.activeBranch;

    const behavior = adjustScrollBehavior(action);
    const context: AlignBranchContext = {
        previousActiveBranch: previousActiveBranch,
        activeBranch: activeBranch,
        columns: documentState.document.columns,
        container,
        activeNodesOfColumn: viewState.document.activeNodesOfColumn,
        containerRect: container.getBoundingClientRect(),
        alignBranchSettings: {
            centerActiveNodeH: settings.view.scrolling.centerActiveNodeH,
            centerActiveNodeV: settings.view.scrolling.centerActiveNodeV,
            zoomLevel: settings.view.zoomLevel,
            behavior: behavior,
        },
        documentState,
        state: {
            rects: new Map(),
        },
    };
    return context;
};
