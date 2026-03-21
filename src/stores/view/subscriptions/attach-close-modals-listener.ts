import { MandalaView } from 'src/view/view';
import { uiControlsStore } from 'src/stores/ui/derived/ui-controls-store';

export const attachCloseModalsListener = (view: MandalaView) => {
    const listener = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isInsideModal = target.closest('.mandala-modal');
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
            controls.showSettingsSidebar
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
