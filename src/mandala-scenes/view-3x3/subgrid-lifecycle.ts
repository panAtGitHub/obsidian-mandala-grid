import { Notice } from 'obsidian';
import {
    parseDayPlanFrontmatter,
    shiftHotWindowToCore,
} from 'src/mandala-display/logic/day-plan';
import {
    applyDayPlanToCore,
    resolveNextDayPlanDate,
} from 'src/mandala-display/logic/apply-day-plan-to-core';
import {
    canEnterThreeByThreeTheme,
    canExpandThreeByThreeChildren,
    resolveNearestThreeByThreeCenterTheme,
} from 'src/mandala-scenes/view-3x3/subgrid-depth';
import { createThreeByThreeSubgridPrunePlan } from 'src/mandala-scenes/view-3x3/subgrid-prune';
import { lang } from 'src/lang/lang';
import { ensureChildrenForSection } from 'src/mandala-interaction/helpers/ensure-node-for-section';
import type { MandalaView } from 'src/view/view';

const flushActiveEditorBeforeSubgridExit = (view: MandalaView) => {
    const editingState = view.viewStore.getValue().document.editing;
    const editingNodeId = editingState.activeNodeId || null;
    if (!editingNodeId) return;

    view.inlineEditor.unloadNode(editingNodeId, false);
    view.viewStore.dispatch({
        type: editingState.isInSidebar
            ? 'view/editor/disable-sidebar-editor'
            : 'view/editor/disable-main-editor',
    });
};

export const resolveThreeByThreeParentTheme = (
    theme: string | null | undefined,
) => {
    if (!theme) return null;
    const lastDot = theme.lastIndexOf('.');
    if (lastDot !== -1) {
        return theme.slice(0, lastDot);
    }

    const themeNumber = Number(theme);
    if (!Number.isNaN(themeNumber) && themeNumber > 1) {
        return String(themeNumber - 1);
    }

    return '1';
};

export const resolveThreeByThreeExitFocusTheme = (
    theme: string | null | undefined,
) => {
    if (!theme) return null;
    const parentTheme = resolveThreeByThreeParentTheme(theme);
    if (theme.includes('.')) {
        return theme;
    }

    const themeNumber = Number(theme);
    if (!Number.isNaN(themeNumber) && themeNumber > 1) {
        return parentTheme;
    }

    return '1';
};

export const enterThreeByThreeSubgrid = (
    view: MandalaView,
    nodeId: string,
) => {
    if (view.mandalaMode !== '3x3') return;

    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return;

    const section = docState.sections.id_section[nodeId];
    if (!section) return;
    if (!canEnterThreeByThreeTheme(view, section)) {
        new Notice('当前设置下已达到 3×3 子九宫层级上限。');
        return;
    }
    const currentTheme =
        view.viewStore.getValue().ui.mandala.subgridTheme ?? '1';
    const dayPlan = parseDayPlanFrontmatter(docState.file.frontmatter);
    if (dayPlan) {
        view.dayPlanHotCores = shiftHotWindowToCore(
            dayPlan.year,
            section,
            view.getEffectiveMandalaSettings().general.weekStart,
        );
    }
    if (section === currentTheme && !currentTheme.includes('.')) {
        const content = docState.document.content[nodeId]?.content ?? '';
        if (!content.trim()) {
            new Notice('请先填写内容，再进入下一核心九宫');
            return;
        }
        const nextTheme = String(Number(currentTheme) + 1);
        const coreSectionMax =
            view.getEffectiveMandalaSettings().view.coreSectionMax;
        if (
            coreSectionMax !== 'unlimited' &&
            Number(currentTheme) + 1 > coreSectionMax
        ) {
            new Notice(lang.notice_core_section_limit_reached);
            return;
        }
        const dayPlanResolution = resolveNextDayPlanDate(view, currentTheme);
        if (dayPlanResolution.blocked) return;

        view.documentStore.dispatch({
            type: 'document/mandala/ensure-core-theme',
            payload: { theme: nextTheme },
        });
        if (
            !applyDayPlanToCore(
                view,
                currentTheme,
                nextTheme,
                dayPlanResolution.nextDate ?? undefined,
            )
        )
            return;
        ensureChildrenForSection(view, nextTheme);

        const nextNodeId =
            view.documentStore.getValue().sections.section_id[nextTheme];
        if (nextNodeId) {
            view.viewStore.dispatch({
                type: 'view/set-active-node/mouse-silent',
                payload: { id: nextNodeId },
            });
            view.viewStore.dispatch({
                type: 'view/mandala/subgrid/enter',
                payload: { theme: nextTheme },
            });
        }
        return;
    }

    if (canExpandThreeByThreeChildren(view, section)) {
        const content = docState.document.content[nodeId]?.content ?? '';
        if (!content.trim()) {
            new Notice('请先填写内容，再展开九宫格');
            return;
        }

        ensureChildrenForSection(view, section);
    }

    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: nodeId },
    });
    view.viewStore.dispatch({
        type: 'view/mandala/subgrid/enter',
        payload: {
            theme: resolveNearestThreeByThreeCenterTheme(view, section),
        },
    });
};

export const exitThreeByThreeSubgrid = (view: MandalaView) => {
    if (view.mandalaMode !== '3x3') return;

    const theme = view.viewStore.getValue().ui.mandala.subgridTheme;
    if (!theme) return;

    flushActiveEditorBeforeSubgridExit(view);

    const nextTheme = resolveThreeByThreeParentTheme(theme) ?? '1';
    const focusTheme = resolveThreeByThreeExitFocusTheme(theme);
    const documentState = view.documentStore.getValue();
    const focusNodeId = focusTheme
        ? documentState.sections.section_id[focusTheme] ?? null
        : null;
    const prunePlan = createThreeByThreeSubgridPrunePlan({
        theme,
        documentState,
        activeNodeId: focusNodeId,
    });

    if (prunePlan.shouldPrune && prunePlan.activeNodeId) {
        view.documentStore.dispatch({
            type: 'document/mandala/clear-empty-subgrids',
            payload: {
                parentIds: prunePlan.parentIds,
                rootNodeIds: [],
                activeNodeId: prunePlan.activeNodeId,
            },
        });
    }

    view.viewStore.dispatch({
        type: 'view/mandala/subgrid/enter',
        payload: { theme: nextTheme },
    });

    if (focusNodeId) {
        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse-silent',
            payload: { id: focusNodeId },
        });
    }
};
