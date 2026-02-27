import MandalaGrid from 'src/main';

export const setDocumentFormat = (
    plugin: MandalaGrid,
    path: string,
) => {
    plugin.settings.dispatch({
        type: 'settings/documents/set-document-format',
        payload: {
            path: path,
            format: 'sections',
        },
    });
};
