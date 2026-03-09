import { MandalaView } from 'src/view/view';

export const loadFullDocument = (
    view: MandalaView,
    data: string,
    frontmatter: string,
    activeSection: string | null,
) => {
    view.documentStore.dispatch({
        payload: {
            document: { data: data, frontmatter, position: null },
            activeSection,
        },
        type: 'document/file/load-from-disk',
    });
};
