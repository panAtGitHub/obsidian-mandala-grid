import { MandalaView } from 'src/view/view';

export const getExistingRightTabGroup = (view: MandalaView): unknown => {
    const rootSplit = view.plugin.app.workspace.rootSplit;
    if (!('children' in rootSplit)) return;

    const viewTabGroup = 'parent' in view.leaf ? view.leaf.parent : null;
    if (!viewTabGroup || !(typeof viewTabGroup === 'object')) return;
    if (!('type' in viewTabGroup && viewTabGroup.type === 'tabs')) return;
    const children = rootSplit['children'];
    if (children && Array.isArray(children)) {
        const viewTabGroupIndex = children.findIndex(
            (group) => viewTabGroup === group,
        );
        if (viewTabGroupIndex !== -1) {
            return children[viewTabGroupIndex + 1];
        }
    }
};
