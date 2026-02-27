import { MandalaView } from 'src/view/view';

export class VerticalToolbarActions {
    constructor(private view: MandalaView) {}

    toggleMandalaMode = () => {
        this.view.plugin.settings.dispatch({
            type: 'settings/view/mandala/toggle-mode',
        });
    };

    toggleHelp = () => {
        this.view.viewStore.dispatch({ type: 'view/hotkeys/toggle-modal' });
    };

    toggleStyleRules = () => {
        this.view.viewStore.dispatch({
            type: 'view/style-rules/toggle-modal',
        });
    };
    toggleSettings = () => {
        this.view.viewStore.dispatch({ type: 'view/settings/toggle-modal' });
    };

    toggleMinimap = () => {
        this.view.plugin.settings.dispatch({
            type: 'settings/view/toggle-minimap',
        });
    };
    toggleScrollModeH = () => {
        this.view.plugin.settings.dispatch({
            type: 'settings/view/toggle-horizontal-scrolling-mode',
        });
    };
    toggleScrollModeV = () => {
        this.view.plugin.settings.dispatch({
            type: 'settings/view/toggle-vertical-scrolling-mode',
        });
    };

    toggleGap = () => {
        this.view.plugin.settings.dispatch({
            type: 'view/modes/gap-between-cards/toggle',
        });
    };
    toggleHiddenInfo = () => {
        this.view.plugin.settings.dispatch({
            type: 'settings/view/toggle-hidden-card-info',
        });
    };

    zoomIn = () => {
        this.view.plugin.settings.dispatch({
            type: 'settings/view/set-zoom-level',
            payload: { direction: 'in' },
        });
    };
    zoomOut = () => {
        this.view.plugin.settings.dispatch({
            type: 'settings/view/set-zoom-level',
            payload: { direction: 'out' },
        });
    };
}
