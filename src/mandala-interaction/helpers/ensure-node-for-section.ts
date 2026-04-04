import { Notice } from 'obsidian';
import { lang } from 'src/lang/lang';
import type { MandalaView } from 'src/view/view';

export const ensureNodeForSection = (
    view: MandalaView,
    section: string,
): string | null => {
    const docState = view.documentStore.getValue();
    const existing = docState.sections.section_id[section];
    if (existing) return existing;

    const parts = section.split('.');
    if (parts.length === 0) return null;

    const coreSectionMax = view.getEffectiveMandalaSettings().view.coreSectionMax;
    const targetCore = Number(parts[0]);
    if (
        coreSectionMax !== 'unlimited' &&
        Number.isInteger(targetCore) &&
        targetCore > coreSectionMax
    ) {
        new Notice(lang.notice_core_section_limit_reached);
        return null;
    }

    view.documentStore.dispatch({
        type: 'document/mandala/ensure-core-theme',
        payload: { theme: parts[0] },
    });

    let updated = view.documentStore.getValue();
    for (let depth = 1; depth < parts.length; depth += 1) {
        const parentSection = parts.slice(0, depth).join('.');
        const parentId = updated.sections.section_id[parentSection];
        if (!parentId) break;
        view.documentStore.dispatch({
            type: 'document/mandala/ensure-children',
            payload: { parentNodeId: parentId, count: 8 },
        });
        updated = view.documentStore.getValue();
    }

    return view.documentStore.getValue().sections.section_id[section] || null;
};

export const ensureChildrenForSection = (
    view: MandalaView,
    section: string,
): string | null => {
    const parentNodeId = ensureNodeForSection(view, section);
    if (!parentNodeId) return null;

    view.documentStore.dispatch({
        type: 'document/mandala/ensure-children',
        payload: { parentNodeId, count: 8 },
    });

    return parentNodeId;
};
