import { MandalaView } from 'src/view/view';

export const getActiveNodes = (view: MandalaView, isInSidebar: boolean) => {
    const viewState = view.viewStore.getValue();
    const documentState = viewState.document;

    if (isInSidebar) {
        return [viewState.pinnedNodes.activeNode];
    } else if (documentState.selectedNodes.size > 0) {
        return Array.from(documentState.selectedNodes);
    } else {
        return [documentState.activeNode];
    }
};
