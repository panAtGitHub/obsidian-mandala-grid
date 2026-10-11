import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';
import { tx } from 'src/lang/translate';
import { Notice, TFile, stringifyYaml } from 'obsidian';
import {
    appendMandalaTemplate,
    BUILTIN_MANDALA_TEMPLATE,
    MandalaTemplate,
    parseMandalaTemplates,
} from 'src/mandala-display/logic/mandala-templates';
import {
    readDayPlanConfigurationFromRecord,
    readDayPlanConfiguration,
    writeDayPlanConfiguration,
    normalizeSlotTitle,
} from 'src/mandala-display/logic/day-plan';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import {
    openMandalaTemplateNameModal,
    openMandalaTemplateSelectModal,
    openMandalaTemplatesFileModal,
} from 'src/obsidian/modals/mandala-templates-modal';
import { withDayPlanDisplaySettings } from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import type { MandalaView } from 'src/view/view';

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
        new Notice(tx('仅支持 3x3 视图。'));
        return false;
    }
    const state = view.documentStore.getValue();
    if (!state.meta.isMandala) {
        new Notice(tx('当前文档不是九宫格格式。'));
        return false;
    }
    view.ensureFullHydrated?.('template-action');
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
    const parsed = readDayPlanConfiguration(
        view.documentStore.getValue().file.frontmatter,
    );
    if (parsed.error) throw new Error(parsed.error);
    if (!parsed.config) return false;
    let savedFrontmatter = '';
    await view.plugin.app.fileManager.processFrontMatter(
        view.file,
        (frontmatter) => {
            const record = frontmatter as Record<string, unknown>;
            const current = readDayPlanConfigurationFromRecord(record);
            if (!current.config)
                throw new Error(
                    current.error ?? '日计划配置已修改，请重新打开设置。',
                );
            writeDayPlanConfiguration(
                record,
                withDayPlanDisplaySettings(
                    { ...current.config, slots: toDayPlanSlotsRecord(slots) },
                    view.getEffectiveMandalaSettings().general,
                ),
            );
            savedFrontmatter = `---\n${stringifyYaml(record)}---\n`;
        },
    );
    updateFrontmatter(view, savedFrontmatter);
    return true;
};

const ensureTemplatesFile = async (
    view: MandalaView,
    templatesFilePath: string | null,
) => {
    const existing = getTemplatesFileFromPath(view, templatesFilePath);
    if (existing) return existing;
    if (templatesFilePath) {
        new Notice(tx('模板文件不存在，请重新指定。'));
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
        new Notice(tx('模板文件不存在，请重新指定。'));
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
        new Notice(tx('读取模板文件失败。'));
        return;
    }
    const templates = parseMandalaTemplates(raw);
    if (templates.some((template) => template.name === templateName)) {
        new Notice(tx('模板名称已存在，请更换名称。'));
        return;
    }

    const theme = view.viewStore.getValue().ui.mandala.subgridTheme ?? '1';
    const slots = getCurrentThemeSlots(view, theme);
    const template: MandalaTemplate = { name: templateName, slots };
    const nextContent = appendMandalaTemplate(raw, template);
    try {
        await view.plugin.app.vault.modify(file, nextContent);
    } catch {
        new Notice(tx('写入模板文件失败。'));
        return;
    }
    new Notice(tx('模板已保存。'));
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
        new Notice(tx('读取模板文件失败。'));
        return;
    }
    const templates = parseMandalaTemplates(raw);
    if (templates.length === 0) {
        new Notice(tx('模板文件中没有模板。'));
        return;
    }

    const selected = await openMandalaTemplateSelectModal(
        view.plugin,
        templates,
    );
    if (!selected) return;

    try {
        await applyTemplateToCurrentTheme(view, selected, closeMenu);
    } catch (error) {
        new Notice(
            error instanceof Error ? error.message : tx('模板应用失败。'),
        );
    }
};

export const insertBuiltinTemplateAction = async (
    view: MandalaView,
    templatesFilePath: string | null,
    closeMenu: () => void,
) => {
    const file = getTemplatesFileFromPath(view, templatesFilePath);
    if (!file) {
        const message = activeDocument.createDocumentFragment();
        message.append(
            tx(
                templatesFilePath
                    ? '模板文件不存在，请指定或新建九宫格模板文件。'
                    : '尚未指定九宫格模板文件，请先指定或新建模板文件。',
            ),
        );
        const button = activeDocument.createElement('button');
        button.type = 'button';
        button.textContent = tx('指定或新建模板文件');
        message.append(' ', button);
        const notice = new Notice(message, 0);
        button.addEventListener(
            'click',
            () => {
                notice.hide();
                void ensureTemplatesFile(view, null)
                    .then((selectedFile) => {
                        if (!selectedFile) return;
                        return insertBuiltinTemplateAction(
                            view,
                            selectedFile.path,
                            closeMenu,
                        );
                    })
                    .catch(() => {
                        new Notice(tx('指定模板文件失败。'));
                    });
            },
            { once: true },
        );
        return;
    }

    let inserted = false;
    try {
        await view.plugin.app.vault.process(file, (raw) => {
            if (
                parseMandalaTemplates(raw).some(
                    (template) =>
                        template.name === BUILTIN_MANDALA_TEMPLATE.name,
                )
            ) {
                return raw;
            }
            inserted = true;
            return appendMandalaTemplate(raw, BUILTIN_MANDALA_TEMPLATE);
        });
    } catch {
        new Notice(tx('写入模板文件失败。'));
        return;
    }
    new Notice(
        tx(
            inserted
                ? '内置模板已插入模板文件。'
                : '模板文件中已存在同名内置模板。',
        ),
    );
    closeMenu();
};

const applyTemplateToCurrentTheme = async (
    view: MandalaView,
    selected: MandalaTemplate,
    closeMenu: () => void,
) => {
    const normalizedSlots = Array.from({ length: 8 }, (_, index) =>
        normalizeSlotTitle(selected.slots[index] ?? ''),
    );
    const isDayPlan = await updateDayPlanSlotsInFrontmatter(
        view,
        normalizedSlots,
    );
    if (isDayPlan) {
        new Notice(tx('每日模板已保存，已有日期内容保持不变。'));
        closeMenu();
        return;
    }

    const state = view.documentStore.getValue();
    const theme = view.viewStore.getValue().ui.mandala.subgridTheme ?? '1';
    const centerNodeId = state.sections.section_id[theme];
    if (!centerNodeId) {
        new Notice(tx('未找到当前主题中心格子。'));
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
                content: (() => {
                    const content = selected.slots[i - 1] ?? '';
                    if (!content.trim() || /^\s{0,3}#{1,6}\s/.test(content))
                        return content;
                    return `### ${content}`;
                })(),
            },
            context: { isInSidebar: false },
        });
    }

    new Notice(tx('模板已应用。'));
    closeMenu();
};
