import { Notice } from 'obsidian';
import {
    addDaysIsoDate,
    DAY_PLAN_FRONTMATTER_KEY,
    extractDateFromCenterHeading,
    isIsoDate,
    parseDayPlanFrontmatter,
    upsertCenterDateHeading,
    upsertSlotHeading,
} from 'src/lib/mandala/day-plan';
import { MandalaView } from 'src/view/view';

const getFirstNonEmptyLine = (content: string) =>
    content
        .split('\n')
        .find((line) => line.trim().length > 0)
        ?.trim() ?? '';

const hasDayPlanKey = (frontmatter: string) =>
    frontmatter.includes(`${DAY_PLAN_FRONTMATTER_KEY}:`);

const getDayPlanConfig = (frontmatter: string) => {
    const config = parseDayPlanFrontmatter(frontmatter);
    if (config) {
        return {
            valid: true,
            slots: Array.from({ length: 8 }, (_, index) => config.slots[String(index + 1)] ?? ''),
            year: config.year,
        } as const;
    }
    if (hasDayPlanKey(frontmatter)) {
        return {
            valid: false,
            slots: null,
            year: null,
        } as const;
    }
    return {
        valid: null,
        slots: null,
        year: null,
    } as const;
};

export const resolveNextDayPlanDate = (
    view: MandalaView,
    currentCore: string,
) => {
    const config = getDayPlanConfig(view.documentStore.getValue().file.frontmatter);
    if (config.valid === null) {
        return {
            enabled: false,
            blocked: false,
            nextDate: null as string | null,
        };
    }
    if (config.valid === false) {
        new Notice('日计划配置无效，请重新运行“设置成「日计划」九宫格格式”。');
        return {
            enabled: true,
            blocked: true,
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
    const planYear = config.year;
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
    const config = getDayPlanConfig(view.documentStore.getValue().file.frontmatter);
    if (config.valid === null) return true;
    if (config.valid === false) {
        new Notice('日计划配置无效，请重新运行“设置成「日计划」九宫格格式”。');
        return false;
    }

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
