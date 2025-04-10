import { LineageDocumentFormat } from 'src/stores/settings/settings-type';
import { LineageView } from 'src/view/view';

export const loadFullDocument = (
    view: LineageView,
    data: string,
    frontmatter: string,
    format: LineageDocumentFormat,
    activeSection: string | null,
) => {
    view.documentStore.dispatch({
        payload: {
            document: { data: data, frontmatter, position: null },
            format,
            activeSection,
        },
        type: 'document/file/load-from-disk',
    });
};
