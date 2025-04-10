import { LineageView } from 'src/view/view';

export const persistActivePinnedNode = (view: LineageView) => {
    const documentState = view.documentStore.getValue();
    const sections = documentState.sections;

    const viewState = view.viewStore.getValue();
    const section = sections.id_section[viewState.pinnedNodes.activeNode];
    view.plugin.settings.dispatch({
        type: 'settings/pinned-nodes/persist-active-node',
        payload: {
            filePath: view.file!.path,
            section,
        },
    });
};
