import { LineageView } from 'src/view/view';
import { uiControlsStore } from 'src/stores/view/derived/ui-controls-store';

export const attachCloseModalsListener = (view: LineageView) => {
    const listener = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isInsideModal = target.closest('.lineage-modal');
        const isInsideControlsBar =
            !isInsideModal && target.closest('.controls-container');

        if (e.button === 0 && !(isInsideModal || isInsideControlsBar)) {
            view.viewStore.dispatch({ type: 'view/close-modals' });
            view.contentEl.removeEventListener('click', listener);
        }
    };
    const controls = uiControlsStore(view);
    const unsub = controls.subscribe((controls) => {
        if (
            /*controls.showHelpSidebar ||*/
            controls.showHistorySidebar ||
            controls.showSettingsSidebar /*||
            controls.showStyleRulesModal*/
        ) {
            setTimeout(() => {
                view.contentEl.addEventListener('click', listener);
            }, 0);
        }
    });
    return () => {
        view.contentEl.removeEventListener('click', listener);
        unsub();
    };
};
