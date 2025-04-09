import Lineage from 'src/main';
import { LineageDocumentFormat } from 'src/stores/settings/settings-type';

export const setDocumentFormat = (
    plugin: Lineage,
    path: string,
    type: LineageDocumentFormat,
) => {
    plugin.settings.dispatch({
        type: 'SET_DOCUMENT_TYPE',
        payload: {
            path: path,
            format: type,
        },
    });
};
