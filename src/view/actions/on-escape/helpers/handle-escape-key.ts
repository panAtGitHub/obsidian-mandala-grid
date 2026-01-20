import { Notice } from 'obsidian';
import { lang } from 'src/lang/lang';
import { MandalaView } from 'src/view/view';

export const handleEscapeKey = (view: MandalaView) => {
    const viewStore = view.viewStore;
    const value = viewStore.getValue();
    const search = value.search;
    const controls = value.ui.controls;
    const selection = value.document.selectedNodes;
    const swap = value.ui.mandala.swap;
    if (
        controls.showHelpSidebar ||
        controls.showHistorySidebar ||
        controls.showSettingsSidebar ||
        controls.showStyleRulesModal
    ) {
        viewStore.dispatch({
            type: 'view/close-modals',
            payload: {
                closeAllModals: true,
            },
        });
        return true;
    } else if (value.document.pendingConfirmation.deleteNode.size > 0) {
        viewStore.dispatch({
            type: 'view/delete-node/reset-confirmation',
        });
        return true;
    } else if (swap.active) {
        viewStore.dispatch({
            type: 'view/mandala/swap/cancel',
        });
        new Notice(lang.notice_swap_canceled, 1200);
        return true;
    } else if (selection.size > 0) {
        viewStore.dispatch({
            type: 'view/selection/clear-selection',
        });
        return true;
    } else if (search.query) {
        viewStore.dispatch({
            type: 'view/search/set-query',
            payload: {
                query: '',
            },
        });
        return true;
    } else if (search.showInput) {
        viewStore.dispatch({
            type: 'view/search/toggle-input',
        });
        return true;
    }
};
