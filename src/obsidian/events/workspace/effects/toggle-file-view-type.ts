import MandalaGrid from 'src/main';
import { Notice, TFile, WorkspaceLeaf } from 'obsidian';
import { getLeafOfFile } from 'src/obsidian/events/workspace/helpers/get-leaf-of-file';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';
import { MANDALA_VIEW_TYPE } from 'src/view/view';
import { openMandalaConversionModal } from 'src/obsidian/modals/mandala-conversion-modal';
import {
    analyzeMandalaContent,
    convertToMandalaMarkdown,
    MandalaConversionMode,
} from 'src/mandala-display/logic/mandala-conversion';
import {
    parseDayPlanFromMarkdown,
    sectionFromDateInPlanYear,
} from 'src/mandala-display/logic/day-plan';
import {
    getEditedDayPlanSlotTitles,
    localDayPlanDate,
    updateDayPlanTemplateMarkdown,
} from 'src/obsidian/commands/helpers/day-plan-template-edit';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { parseYaml, stringifyYaml } from 'obsidian';
import {
    readDayPlanConfigurationFromRecord,
    writeDayPlanConfiguration,
} from 'src/mandala-display/logic/day-plan';
import {
    resolveEffectiveMandalaSettings,
    withDayPlanDisplaySettings,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import { openDayPlanConfirmModal } from 'src/obsidian/modals/day-plan-setup-modal';
import { setViewType } from 'src/mandala-settings/state/actions/set-view-type';

const refreshMandalaViewData = (
    plugin: MandalaGrid,
    file: TFile,
    content: string,
) => {
    window.setTimeout(() => {
        const leaf = getLeafOfFile(plugin, file, MANDALA_VIEW_TYPE);
        if (!leaf) return;
        const maybeTextView = leaf.view as unknown as {
            setViewData?: (data: string) => void;
        };
        if (typeof maybeTextView.setViewData === 'function') {
            maybeTextView.setViewData(content);
        }
    }, 50);
};

export const syncEditedDayPlanTitlesByUserChoice = async (
    plugin: MandalaGrid,
    markdown: string,
    activeSection?: string | null,
) => {
    const plan = parseDayPlanFromMarkdown(markdown);
    if (!plan) return markdown;
    const today = localDayPlanDate();
    if (!today.startsWith(`${plan.year}-`)) return markdown;
    const core =
        activeSection?.split('.')[0] ?? sectionFromDateInPlanYear(plan.year);
    if (!core) return markdown;
    const slots = getEditedDayPlanSlotTitles(markdown, core);
    if (!slots) return markdown;
    const confirmed = await openDayPlanConfirmModal(plugin, {
        title: '当前日期的八格标题与每日模板不同',
        message:
            '是否将当前八格标题设为每日模板？保存后，今天及后续日期使用这组标题，历史日期保持不变，正文保留。',
        confirmText: '保存为模板',
        cancelText: '暂不更新',
    });
    if (!confirmed) return markdown;
    const { frontmatter, body } = extractFrontmatter(markdown);
    const root = parseYaml(
        frontmatter.replace(/^---\n/, '').replace(/\n---\n?$/, ''),
    ) as Record<string, unknown>;
    const config = readDayPlanConfigurationFromRecord(root).config;
    if (!config) return markdown;
    const effective = resolveEffectiveMandalaSettings(
        plugin.settings.getValue(),
        frontmatter,
    );
    writeDayPlanConfiguration(
        root,
        withDayPlanDisplaySettings(config, effective.general),
    );
    return updateDayPlanTemplateMarkdown(
        `---\n${stringifyYaml(root)}---\n${body}`,
        { slots, start: today, end: `${plan.year}-12-31` },
    );
};

export const toggleFileViewType = async (
    plugin: MandalaGrid,
    file: TFile,
    leaf: WorkspaceLeaf | undefined,
) => {
    const documents = plugin.settings.getValue().documents;
    const preferences = documents[file.path] ? documents[file.path] : null;

    const currentViewType = preferences ? preferences.viewType : 'markdown';

    let fileLeaf = leaf || getLeafOfFile(plugin, file, currentViewType);
    if (!fileLeaf) fileLeaf = await openFile(plugin, file, 'tab');

    const newViewType =
        currentViewType === 'markdown' ? MANDALA_VIEW_TYPE : 'markdown';

    if (newViewType === MANDALA_VIEW_TYPE) {
        const content = await plugin.app.vault.read(file);
        const analysis = analyzeMandalaContent(content);
        let nextContent = content;
        const conversionMode = getConversionMode(analysis);
        if (conversionMode) {
            const { title, message } = getConversionPrompt(
                analysis,
                conversionMode,
            );
            const choice = await openMandalaConversionModal(plugin, {
                title,
                message,
            });
            if (choice === 'cancel') return;
            nextContent = convertToMandalaMarkdown(nextContent, conversionMode);
            if (analysis.hasSection1 && !analysis.hasSection1_1) {
                new Notice(
                    '当前非标准九宫格式，请切回 Markdown 视图核对 section 编号。',
                );
            }
        }

        nextContent = await syncEditedDayPlanTitlesByUserChoice(
            plugin,
            nextContent,
            preferences?.mandalaView?.lastActiveSection,
        );
        const contentChangedOnEnter = nextContent !== content;
        if (contentChangedOnEnter) {
            let conflicted = false;
            await plugin.app.vault.process(file, (raw) => {
                if (raw !== content) {
                    conflicted = true;
                    return raw;
                }
                return nextContent;
            });
            if (conflicted) {
                new Notice('文件在确认期间已修改，请重新操作。');
                return;
            }
        }
    }
    toggleObsidianViewType(plugin, fileLeaf, newViewType);
    setViewType(plugin, file.path, newViewType);
    if (newViewType === MANDALA_VIEW_TYPE) {
        const latest = await plugin.app.vault.read(file);
        refreshMandalaViewData(plugin, file, latest);
    }
};

const getConversionMode = (
    analysis: ReturnType<typeof analyzeMandalaContent>,
): MandalaConversionMode | null => {
    if (analysis.hasSection1 && !analysis.hasSection1_1) {
        return 'normalize-core';
    }
    if (!analysis.hasMandalaFrontmatter && !analysis.hasSections) {
        return 'template-with-content';
    }
    if (!analysis.hasMandalaFrontmatter) {
        return 'normalize-core';
    }
    return null;
};

const getConversionPrompt = (
    analysis: ReturnType<typeof analyzeMandalaContent>,
    mode: MandalaConversionMode,
) => {
    if (analysis.hasSection1 && !analysis.hasSection1_1) {
        return {
            title: '检测到非标准九宫格式',
            message:
                '当前文件存在 section 1 但缺少 section 1.1。是否转换为标准九宫？' +
                '\n转换后会保留现有 section，可切回 Markdown 视图核对编号。',
        };
    }
    if (mode === 'template-with-content') {
        return {
            title: '是否转换为九宫格式？',
            message:
                '当前文件不是九宫格格式。转换后会创建标准九宫，并将原内容放入中心格（section 1）。',
        };
    }
    return {
        title: '是否转换为九宫格式？',
        message: '检测到 section 标记，是否启用九宫格视图并保留现有内容？',
    };
};
