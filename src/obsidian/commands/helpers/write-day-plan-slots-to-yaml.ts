import { Notice } from 'obsidian';
import MandalaGrid from 'src/main';
import {
    DAY_PLAN_FRONTMATTER_KEY,
    normalizeSlotTitle,
    parseDayPlanFrontmatter,
    slotsRecordToArray,
} from 'src/mandala-display/logic/day-plan';
import { getActiveMandalaView } from 'src/obsidian/commands/helpers/get-active-mandala-view';
import type { MandalaView } from 'src/view/view';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';

const getFirstNonEmptyLine = (content: string) =>
    content
        .split('\n')
        .find((line) => line.trim().length > 0)
        ?.trim() ?? '';

const toSlotRecord = (titles: string[]) => {
    const record: Record<string, string> = {};
    for (let i = 0; i < 8; i += 1) {
        record[String(i + 1)] = titles[i] ?? '';
    }
    return record;
};

type CurrentCoreDayPlanSlotsResult =
    | {
          ok: true;
          core: string;
          titles: string[];
          templateSlots: string[];
      }
    | {
          ok: false;
          notice: string;
      };

const collectCurrentCoreDayPlanSlots = (
    view: MandalaView,
): CurrentCoreDayPlanSlotsResult => {
    if (!view.file) {
        return { ok: false, notice: '未找到当前文件。' };
    }

    const state = view.documentStore.getValue();
    if (!state.meta.isMandala) {
        return { ok: false, notice: '当前文档不是九宫格格式。' };
    }

    const plan = parseDayPlanFrontmatter(state.file.frontmatter);
    if (!plan) {
        return { ok: false, notice: '当前文档不是日计划模式。' };
    }

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = state.sections.id_section[activeNodeId];
    if (!activeSection) {
        return { ok: false, notice: '未找到当前激活格子。' };
    }

    const core = activeSection.split('.')[0];
    if (!/^\d+$/.test(core)) {
        return { ok: false, notice: '未找到当前核心九宫。' };
    }

    const titles: string[] = [];
    for (let i = 1; i <= 8; i += 1) {
        const section = `${core}.${i}`;
        const nodeId = state.sections.section_id[section];
        if (!nodeId) {
            return {
                ok: false,
                notice: `当前核心缺少第 ${i} 个格子，请先补齐后再写回模板。`,
            };
        }
        const content = state.document.content[nodeId]?.content ?? '';
        const title = normalizeSlotTitle(getFirstNonEmptyLine(content));
        if (!title) {
            return {
                ok: false,
                notice: `第 ${i} 个格子标题为空，请先填写标题后再写回模板。`,
            };
        }
        titles.push(title);
    }

    return {
        ok: true,
        core,
        titles,
        templateSlots: slotsRecordToArray(plan.slots),
    };
};

export const getCurrentCoreDayPlanTemplateMismatch = (
    view: MandalaView,
): {
    core: string;
} | null => {
    const snapshot = collectCurrentCoreDayPlanSlots(view);
    if (!snapshot.ok) return null;

    const hasDiff = snapshot.titles.some(
        (title, index) =>
            title !==
            normalizeSlotTitle(snapshot.templateSlots[index] ?? ''),
    );
    if (!hasDiff) return null;

    return {
        core: snapshot.core,
    };
};

export const writeCurrentCoreDayPlanSlotsToYamlForView = async (
    plugin: MandalaGrid,
    view: MandalaView,
): Promise<boolean> => {
    const file = view.file;
    if (!file) {
        new Notice('未找到当前文件。');
        return false;
    }

    const snapshot = collectCurrentCoreDayPlanSlots(view);
    if (!snapshot.ok) {
        new Notice(snapshot.notice);
        return false;
    }

    let updated = false;
    await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
        const frontmatterRecord = frontmatter as Record<string, unknown>;
        const rawPlan = frontmatterRecord[DAY_PLAN_FRONTMATTER_KEY];
        if (!rawPlan || typeof rawPlan !== 'object') return;
        const planRecord = rawPlan as Record<string, unknown>;
        if (planRecord.enabled !== true) return;
        planRecord.slots = toSlotRecord(snapshot.titles);
        updated = true;
    });

    if (!updated) {
        new Notice('写回失败：未检测到有效的日计划 YAML 配置。');
        return false;
    }

    const latest = await plugin.app.vault.cachedRead(file);
    const { frontmatter } = extractFrontmatter(latest);
    updateFrontmatter(view, frontmatter);

    new Notice('已将当前核心九宫的 8 个标题写回 YAML 模板。');
    return true;
};

export const writeCurrentCoreDayPlanSlotsToYaml = async (
    plugin: MandalaGrid,
): Promise<boolean> => {
    const view = getActiveMandalaView(plugin);
    if (!view) {
        new Notice('请先打开九宫格视图。');
        return false;
    }

    return writeCurrentCoreDayPlanSlotsToYamlForView(plugin, view);
};
