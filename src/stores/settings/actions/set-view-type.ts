import Lineage from 'src/main';
import { ViewType } from 'src/stores/settings/settings-type';

export const setViewType = (plugin: Lineage, path: string, type: ViewType) => {
    plugin.settings.dispatch({
        type: 'settings/documents/set-view-type',
        payload: {
            path: path,
            type: type,
        },
    });
};
