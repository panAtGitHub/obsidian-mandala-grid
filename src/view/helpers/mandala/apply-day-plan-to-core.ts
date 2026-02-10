import { Notice, parseYaml } from 'obsidian';
import {
    addDaysIsoDate,
    DAY_PLAN_FRONTMATTER_KEY,
    extractDateFromCenterHeading,
    isIsoDate,
    slotsRecordToArray,
    upsertCenterDateHeading,
    upsertSlotHeading,
} from 'src/lib/mandala/day-plan';
import { MandalaView } from 'src/view/view';

const getFirstNonEmptyLine = (content: string) =>
    content
        .split('\n')
        .find((line) => line.trim().length > 0)
        ?.trim() ?? '';

const parseDayPlanConfig = (frontmatter: string) => {
    if (!frontmatter.trim()) return null;

    const yamlContent = frontmatter
        .replace(/^---\n/, '')
        .replace(/\n---\n?$/, '')
        .trim();
    if (!yamlContent) return null;

    try {
        const parsed: unknown = parseYaml(yamlContent);
        if (!parsed || typeof parsed !== 'object') return null;
        const root = parsed as Record<string, unknown>;
        const rawPlan = root[DAY_PLAN_FRONTMATTER_KEY];
        if (!rawPlan || typeof rawPlan !== 'object') return null;
        const plan = rawPlan as Record<string, unknown>;
        if (plan.enabled !== true) return null;

        const year = Number(plan.year);
        const slots = slotsRecordToArray(
            (plan.slots as Record<string, unknown>) ?? undefined,
        );
        return {
            slots,
            year: Number.isInteger(year) ? year : null,
        };
    } catch {
        return null;
    }
};

export const resolveNextDayPlanDate = (
    view: MandalaView,
    currentCore: string,
) => {
    const config = parseDayPlanConfig(view.documentStore.getValue().file.frontmatter);
    if (!config) {
        return {
            enabled: false,
            blocked: false,
            nextDate: null as string | null,
        };
    }

    const docState = view.documentStore.getValue();
    const currentCoreNodeId = docState.sections.section_id[currentCore];
    if (!currentCoreNodeId) {
        return {
            enabled: true,
            blocked: false,
            nextDate: null as string | null,
        };
    }

    const currentCoreContent =
        docState.document.content[currentCoreNodeId]?.content ?? '';
    const currentDate = extractDateFromCenterHeading(
        getFirstNonEmptyLine(currentCoreContent),
    );
    if (!currentDate || !isIsoDate(currentDate)) {
        new Notice('上一核心日期无效，请先设置为 ## yyyy-mm-dd。');
        return {
            enabled: true,
            blocked: true,
            nextDate: null as string | null,
        };
    }

    const nextDate = addDaysIsoDate(currentDate, 1);
    const nextYear = Number(nextDate.slice(0, 4));
    const planYear = config.year ?? Number(currentDate.slice(0, 4));
    if (nextYear !== planYear) {
        new Notice('新的一年，从一个新的年计划开始吧。');
        return {
            enabled: true,
            blocked: true,
            nextDate: null as string | null,
        };
    }

    return {
        enabled: true,
        blocked: false,
        nextDate,
    };
};

export const applyDayPlanToCore = (
    view: MandalaView,
    currentCore: string,
    nextCore: string,
    nextDateOverride?: string,
) => {
    const config = parseDayPlanConfig(view.documentStore.getValue().file.frontmatter);
    if (!config) return true;

    const docState = view.documentStore.getValue();
    const currentCoreNodeId = docState.sections.section_id[currentCore];
    const nextCoreNodeId = docState.sections.section_id[nextCore];
    if (!currentCoreNodeId || !nextCoreNodeId) return true;

    let nextDate = nextDateOverride ?? null;
    if (!nextDate) {
        const resolution = resolveNextDayPlanDate(view, currentCore);
        if (resolution.blocked) return false;
        if (!resolution.nextDate) return true;
        nextDate = resolution.nextDate;
    }

    if (!nextDate) {
        return false;
    }

    const nextCoreContent = docState.document.content[nextCoreNodeId]?.content ?? '';
    view.documentStore.dispatch({
        type: 'document/update-node-content',
        payload: {
            nodeId: nextCoreNodeId,
            content: upsertCenterDateHeading(nextCoreContent, nextDate),
        },
        context: { isInSidebar: false },
    });

    for (let i = 1; i <= 8; i += 1) {
        const slotTitle = config.slots[i - 1];
        if (!slotTitle) continue;

        const refreshed = view.documentStore.getValue();
        const section = `${nextCore}.${i}`;
        const nodeId = refreshed.sections.section_id[section];
        if (!nodeId) continue;
        const currentContent = refreshed.document.content[nodeId]?.content ?? '';
        view.documentStore.dispatch({
            type: 'document/update-node-content',
            payload: {
                nodeId,
                content: upsertSlotHeading(currentContent, slotTitle),
            },
            context: { isInSidebar: false },
        });
    }

    return true;
};
