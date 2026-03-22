import MandalaGrid from 'src/main';
import { ViewType } from 'src/mandala-settings/state/settings-type';

export const setViewType = (plugin: MandalaGrid, path: string, type: ViewType) => {
    plugin.settings.dispatch({
        type: 'settings/documents/set-view-type',
        payload: {
            path: path,
            type: type,
        },
    });
};
