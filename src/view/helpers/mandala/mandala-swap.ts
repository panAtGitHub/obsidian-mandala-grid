import { Notice } from 'obsidian';
import { Sections } from 'src/stores/document/document-state-type';
import { lang } from 'src/lang/lang';
import { MandalaView } from 'src/view/view';

const getSectionDepth = (section: string) => section.split('.').length;

const getSectionParent = (section: string) => {
    const parts = section.split('.');
    parts.pop();
    return parts.join('.');
};

export const getMandalaSwapTargets = (
    sections: Sections,
    sourceNodeId: string,
) => {
    const sourceSection = sections.id_section[sourceNodeId];
    if (!sourceSection || sourceSection === '1') return new Set<string>();

    const sourceDepth = getSectionDepth(sourceSection);
    const sourceParent = getSectionParent(sourceSection);
    const targets = new Set<string>();

    for (const [nodeId, section] of Object.entries(sections.id_section)) {
        if (nodeId === sourceNodeId) continue;
        if (section === '1') continue;
        if (getSectionDepth(section) !== sourceDepth) continue;
        if (getSectionParent(section) !== sourceParent) continue;
        targets.add(nodeId);
    }

    return targets;
};

export const cancelMandalaSwap = (
    view: MandalaView,
    notice = lang.notice_swap_canceled,
) => {
    view.viewStore.dispatch({ type: 'view/mandala/swap/cancel' });
    if (notice) {
        new Notice(notice, 1200);
    }
};

export const startMandalaSwap = (
    view: MandalaView,
    sourceNodeId: string,
) => {
    const swapState = view.viewStore.getValue().ui.mandala.swap;
    if (swapState.active && swapState.sourceNodeId === sourceNodeId) {
        cancelMandalaSwap(view);
        return;
    }

    const sections = view.documentStore.getValue().sections;
    const targets = getMandalaSwapTargets(sections, sourceNodeId);
    if (targets.size === 0) {
        new Notice(lang.notice_swap_no_targets, 1500);
        return;
    }

    view.viewStore.dispatch({
        type: 'view/mandala/swap/start',
        payload: {
            sourceNodeId,
            targetNodeIds: [...targets],
        },
    });
    new Notice(lang.notice_swap_select_target, 2000);
};

export const executeMandalaSwap = (
    view: MandalaView,
    sourceNodeId: string,
    targetNodeId: string,
) => {
    new Notice(lang.notice_swap_in_progress, 800);
    view.documentStore.dispatch({
        type: 'document/mandala/swap',
        payload: {
            sourceNodeId,
            targetNodeId,
        },
    });
    view.viewStore.dispatch({ type: 'view/mandala/swap/cancel' });
    window.setTimeout(() => {
        new Notice(lang.notice_swap_complete, 1200);
    }, 150);
};
