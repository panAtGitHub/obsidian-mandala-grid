import { Notice } from 'obsidian';
import { MandalaView } from 'src/view/view';

type CoreJumpDirection = 'up' | 'down';

export const jumpCoreTheme = (
    view: MandalaView,
    direction: CoreJumpDirection,
) => {
    if (!view.mandalaMode) return;

    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return;

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = docState.sections.id_section[activeNodeId];
    if (!activeSection) return;

    const core = activeSection.split('.')[0];
    const coreNumber = Number(core);
    if (!core || Number.isNaN(coreNumber)) return;

    if (direction === 'down') {
        const coreNodeId = docState.sections.section_id[core];
        if (!coreNodeId) return;

        const content = docState.document.content[coreNodeId]?.content ?? '';
        if (!content.trim()) {
            new Notice('请先填写核心格内容，再进入下一核心九宫');
            return;
        }

        const nextCore = String(coreNumber + 1);
        view.documentStore.dispatch({
            type: 'document/mandala/ensure-core-theme',
            payload: { theme: nextCore },
        });
        const nextNodeId =
            view.documentStore.getValue().sections.section_id[nextCore];
        if (!nextNodeId) return;

        view.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: nextCore },
        });
        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse-silent',
            payload: { id: nextNodeId },
        });
        return;
    }

    if (coreNumber <= 1) return;

    const prevCore = String(coreNumber - 1);
    const prevNodeId = docState.sections.section_id[prevCore];
    if (!prevNodeId) return;

    view.viewStore.dispatch({
        type: 'view/mandala/subgrid/enter',
        payload: { theme: prevCore },
    });
    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: prevNodeId },
    });
};
