import { Notice } from 'obsidian';
import {
    applyDayPlanToCore,
    resolveNextDayPlanDate,
} from 'src/mandala-display/logic/apply-day-plan-to-core';
import { MandalaView } from 'src/view/view';

type CoreJumpDirection = 'up' | 'down';

export const jumpCoreTheme = (
    view: MandalaView,
    direction: CoreJumpDirection,
) => {
    const startedAt = performance.now();
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
        const dayPlanResolution = resolveNextDayPlanDate(view, core);
        if (dayPlanResolution.blocked) return;

        view.documentStore.dispatch({
            type: 'document/mandala/ensure-core-theme',
            payload: { theme: nextCore },
        });
        if (
            !applyDayPlanToCore(
                view,
                core,
                nextCore,
                dayPlanResolution.nextDate ?? undefined,
            )
        )
            return;

        const nextNodeId =
            view.documentStore.getValue().sections.section_id[nextCore];
        if (!nextNodeId) return;

        view.beginSceneSyncTrace('trace.core-jump.sync-scene', {
            direction,
            from_core: core,
            to_core: nextCore,
        });
        const dispatchStartedAt = performance.now();
        view.viewStore.batch(() => {
            view.viewStore.dispatch({
                type: 'view/mandala/subgrid/enter',
                payload: { theme: nextCore },
            });
            view.viewStore.dispatch({
                type: 'view/set-active-node/core-jump',
                payload: { id: nextNodeId },
            });
        });
        view.recordPerfEvent('trace.core-jump.dispatch', {
            direction,
            from_core: core,
            to_core: nextCore,
            total_ms: Number(
                (performance.now() - dispatchStartedAt).toFixed(2),
            ),
        });
        view.recordPerfAfterNextPaint('interaction.9x9.jump-core', startedAt, {
            direction,
            from_core: core,
            to_core: nextCore,
        });
        return;
    }

    if (coreNumber <= 1) return;

    const prevCore = String(coreNumber - 1);
    const prevNodeId = docState.sections.section_id[prevCore];
    if (!prevNodeId) return;

    view.beginSceneSyncTrace('trace.core-jump.sync-scene', {
        direction,
        from_core: core,
        to_core: prevCore,
    });
    const dispatchStartedAt = performance.now();
    view.viewStore.batch(() => {
        view.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: prevCore },
        });
        view.viewStore.dispatch({
            type: 'view/set-active-node/core-jump',
            payload: { id: prevNodeId },
        });
    });
    view.recordPerfEvent('trace.core-jump.dispatch', {
        direction,
        from_core: core,
        to_core: prevCore,
        total_ms: Number((performance.now() - dispatchStartedAt).toFixed(2)),
    });
    view.recordPerfAfterNextPaint('interaction.9x9.jump-core', startedAt, {
        direction,
        from_core: core,
        to_core: prevCore,
    });
};
