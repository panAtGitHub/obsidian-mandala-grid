import { LineageView } from 'src/view/view';

export const updateFrontmatter = (view: LineageView, frontmatter: string) => {
    view.documentStore.dispatch({
        type: 'document/file/update-frontmatter',
        payload: {
            frontmatter,
        },
    });
};
