import { Notice, TFile } from 'obsidian';
import { appendMandalaTemplate, MandalaTemplate, parseMandalaTemplates } from 'src/mandala-display/logic/mandala-templates';
import { normalizeSlotTitle, upsertSlotHeading } from 'src/mandala-display/logic/day-plan';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import {
    openMandalaTemplateNameModal,
    openMandalaTemplateSelectModal,
    openMandalaTemplatesFileModal,
} from 'src/obsidian/modals/mandala-templates-modal';
import { MandalaView } from 'src/view/view';

const getTemplatesFileFromPath = (
    view: MandalaView,
    templatesFilePath: string | null,
) => {
    if (!templatesFilePath) return null;
    const file = view.plugin.app.vault.getAbstractFileByPath(templatesFilePath);
    return file instanceof TFile ? file : null;
};

const ensureMandala3x3 = (view: MandalaView) => {
    if (view.mandalaMode !== '3x3') {
        new Notice('仅支持 3x3 视图。');
        return false;
    }
    const state = view.documentStore.getValue();
    if (!state.meta.isMandala) {
        new Notice('当前文档不是九宫格格式。');
        return false;
    }
    return true;
};

const getCurrentThemeSlots = (view: MandalaView, theme: string) => {
    const state = view.documentStore.getValue();
    const slots: string[] = [];
    for (let i = 1; i <= 8; i += 1) {
        const section = `${theme}.${i}`;
        const nodeId = state.sections.section_id[section];
        const content = nodeId
            ? state.document.content[nodeId]?.content ?? ''
            : '';
        slots.push(content);
    }
    return slots;
};

const toDayPlanSlotsRecord = (slots: string[]) => {
    const record: Record<string, string> = {};
    for (let i = 0; i < 8; i += 1) {
        record[String(i + 1)] = normalizeSlotTitle(slots[i] ?? '');
    }
    return record;
};

const updateDayPlanSlotsInFrontmatter = async (
    view: MandalaView,
    slots: string[],
) => {
    if (!view.file) return false;
    const cache = view.plugin.app.metadataCache.getFileCache(view.file);
    const rawPlan = cache?.frontmatter?.mandala_plan;
    if (!rawPlan || typeof rawPlan !== 'object') return false;
    const plan = rawPlan as Record<string, unknown>;
    if (plan.enabled !== true) return false;

    await view.plugin.app.fileManager.processFrontMatter(
        view.file,
        (frontmatter) => {
            const frontmatterRecord = frontmatter as Record<string, unknown>;
            const currentPlan = frontmatterRecord.mandala_plan;
            if (!currentPlan || typeof currentPlan !== 'object') return;
            frontmatterRecord.mandala_plan = {
                ...(currentPlan as Record<string, unknown>),
                slots: toDayPlanSlotsRecord(slots),
            };
        },
    );
    return true;
};

const applyDayPlanSlotsToAllCoreThemes = (
    view: MandalaView,
    slots: string[],
) => {
    const normalizedSlots = slots.map((slot) => normalizeSlotTitle(slot));
    const coreThemes = Object.keys(view.documentStore.getValue().sections.section_id)
        .filter((section) => /^\d+$/.test(section))
        .sort((a, b) => Number(a) - Number(b));

    for (const theme of coreThemes) {
        const state = view.documentStore.getValue();
        const centerNodeId = state.sections.section_id[theme];
        if (!centerNodeId) continue;
        view.documentStore.dispatch({
            type: 'document/mandala/ensure-children',
            payload: { parentNodeId: centerNodeId, count: 8 },
        });
    }

    for (const theme of coreThemes) {
        for (let i = 1; i <= 8; i += 1) {
            const refreshed = view.documentStore.getValue();
            const section = `${theme}.${i}`;
            const nodeId = refreshed.sections.section_id[section];
            if (!nodeId) continue;
            const slotTitle = normalizedSlots[i - 1];
            if (!slotTitle) continue;
            const content = refreshed.document.content[nodeId]?.content ?? '';
            view.documentStore.dispatch({
                type: 'document/update-node-content',
                payload: {
                    nodeId,
                    content: upsertSlotHeading(content, slotTitle),
                },
                context: { isInSidebar: false },
            });
        }
    }
};

const ensureTemplatesFile = async (
    view: MandalaView,
    templatesFilePath: string | null,
) => {
    const existing = getTemplatesFileFromPath(view, templatesFilePath);
    if (existing) return existing;
    if (templatesFilePath) {
        new Notice('模板文件不存在，请重新指定。');
        view.plugin.settings.dispatch({
            type: 'settings/general/set-mandala-templates-file-path',
            payload: { path: null },
        });
    }
    const file = await openMandalaTemplatesFileModal(view.plugin);
    if (!file) return null;
    view.plugin.settings.dispatch({
        type: 'settings/general/set-mandala-templates-file-path',
        payload: { path: file.path },
    });
    return file;
};

export const openTemplatesFileFromPathAction = async (
    view: MandalaView,
    templatesFilePath: string | null,
    closeMenu: () => void,
) => {
    const file = getTemplatesFileFromPath(view, templatesFilePath);
    if (!file) {
        new Notice('模板文件不存在，请重新指定。');
        return;
    }
    await openFile(view.plugin, file, 'tab');
    closeMenu();
};

export const pickTemplatesFileAction = async (view: MandalaView) => {
    const file = await openMandalaTemplatesFileModal(view.plugin);
    if (!file) return;
    view.plugin.settings.dispatch({
        type: 'settings/general/set-mandala-templates-file-path',
        payload: { path: file.path },
    });
};

export const saveCurrentThemeAsTemplateAction = async (
    view: MandalaView,
    templatesFilePath: string | null,
    closeMenu: () => void,
) => {
    if (!ensureMandala3x3(view)) return;
    const file = await ensureTemplatesFile(view, templatesFilePath);
    if (!file) return;
    const templateName = await openMandalaTemplateNameModal(view.plugin);
    if (!templateName) return;

    let raw = '';
    try {
        raw = await view.plugin.app.vault.read(file);
    } catch {
        new Notice('读取模板文件失败。');
        return;
    }
    const templates = parseMandalaTemplates(raw);
    if (templates.some((template) => template.name === templateName)) {
        new Notice('模板名称已存在，请更换名称。');
        return;
    }

    const theme = view.viewStore.getValue().ui.mandala.subgridTheme ?? '1';
    const slots = getCurrentThemeSlots(view, theme);
    const template: MandalaTemplate = { name: templateName, slots };
    const nextContent = appendMandalaTemplate(raw, template);
    try {
        await view.plugin.app.vault.modify(file, nextContent);
    } catch {
        new Notice('写入模板文件失败。');
        return;
    }
    new Notice('模板已保存。');
    closeMenu();
};

export const applyTemplateToCurrentThemeAction = async (
    view: MandalaView,
    templatesFilePath: string | null,
    closeMenu: () => void,
) => {
    if (!ensureMandala3x3(view)) return;
    const file = await ensureTemplatesFile(view, templatesFilePath);
    if (!file) return;

    let raw = '';
    try {
        raw = await view.plugin.app.vault.read(file);
    } catch {
        new Notice('读取模板文件失败。');
        return;
    }
    const templates = parseMandalaTemplates(raw);
    if (templates.length === 0) {
        new Notice('模板文件中没有模板。');
        return;
    }

    const selected = await openMandalaTemplateSelectModal(
        view.plugin,
        templates,
    );
    if (!selected) return;

    const normalizedSlots = Array.from({ length: 8 }, (_, index) =>
        normalizeSlotTitle(selected.slots[index] ?? ''),
    );
    const isDayPlan = await updateDayPlanSlotsInFrontmatter(
        view,
        normalizedSlots,
    );
    if (isDayPlan) {
        applyDayPlanSlotsToAllCoreThemes(view, normalizedSlots);
        new Notice('已根据文档前置区调整的标题进行全局替换。');
        closeMenu();
        return;
    }

    const state = view.documentStore.getValue();
    const theme = view.viewStore.getValue().ui.mandala.subgridTheme ?? '1';
    const centerNodeId = state.sections.section_id[theme];
    if (!centerNodeId) {
        new Notice('未找到当前主题中心格子。');
        return;
    }

    view.documentStore.dispatch({
        type: 'document/mandala/ensure-children',
        payload: { parentNodeId: centerNodeId, count: 8 },
    });

    const refreshed = view.documentStore.getValue();
    for (let i = 1; i <= 8; i += 1) {
        const section = `${theme}.${i}`;
        const nodeId = refreshed.sections.section_id[section];
        if (!nodeId) continue;
        view.documentStore.dispatch({
            type: 'document/update-node-content',
            payload: {
                nodeId,
                content: selected.slots[i - 1] ?? '',
            },
            context: { isInSidebar: false },
        });
    }

    new Notice('模板已应用。');
    closeMenu();
};
