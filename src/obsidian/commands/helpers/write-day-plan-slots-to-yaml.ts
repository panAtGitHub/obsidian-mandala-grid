import { Notice } from 'obsidian';
import MandalaGrid from 'src/main';
import {
    DAY_PLAN_FRONTMATTER_KEY,
    normalizeSlotTitle,
    parseDayPlanFrontmatter,
} from 'src/lib/mandala/day-plan';
import { getActiveMandalaView } from 'src/obsidian/commands/helpers/get-active-mandala-view';

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

export const writeCurrentCoreDayPlanSlotsToYaml = async (
    plugin: MandalaGrid,
) => {
    const view = getActiveMandalaView(plugin);
    if (!view) {
        new Notice('请先打开九宫格视图。');
        return;
    }
    if (!view.file) {
        new Notice('未找到当前文件。');
        return;
    }

    const state = view.documentStore.getValue();
    if (!state.meta.isMandala) {
        new Notice('当前文档不是九宫格格式。');
        return;
    }

    const plan = parseDayPlanFrontmatter(state.file.frontmatter);
    if (!plan) {
        new Notice('当前文档不是日计划模式。');
        return;
    }

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = state.sections.id_section[activeNodeId];
    if (!activeSection) {
        new Notice('未找到当前激活格子。');
        return;
    }

    const core = activeSection.split('.')[0];
    if (!/^\d+$/.test(core)) {
        new Notice('未找到当前核心九宫。');
        return;
    }

    const titles: string[] = [];
    for (let i = 1; i <= 8; i += 1) {
        const section = `${core}.${i}`;
        const nodeId = state.sections.section_id[section];
        if (!nodeId) {
            new Notice(`当前核心缺少第 ${i} 个格子，请先补齐后再写回模板。`);
            return;
        }
        const content = state.document.content[nodeId]?.content ?? '';
        const title = normalizeSlotTitle(getFirstNonEmptyLine(content));
        if (!title) {
            new Notice(`第 ${i} 个格子标题为空，请先填写标题后再写回模板。`);
            return;
        }
        titles.push(title);
    }

    let updated = false;
    await plugin.app.fileManager.processFrontMatter(view.file, (frontmatter) => {
        const frontmatterRecord = frontmatter as Record<string, unknown>;
        const rawPlan = frontmatterRecord[DAY_PLAN_FRONTMATTER_KEY];
        if (!rawPlan || typeof rawPlan !== 'object') return;
        const planRecord = rawPlan as Record<string, unknown>;
        if (planRecord.enabled !== true) return;
        planRecord.slots = toSlotRecord(titles);
        updated = true;
    });

    if (!updated) {
        new Notice('写回失败：未检测到有效的日计划 YAML 配置。');
        return;
    }

    new Notice('已将当前核心九宫的 8 个标题写回 YAML 模板。');
};
