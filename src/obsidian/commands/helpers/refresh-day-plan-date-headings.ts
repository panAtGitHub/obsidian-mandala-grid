import { Notice } from 'obsidian';
import { parseSectionMarker } from 'src/mandala-document/engine/parse-section-marker';
import MandalaGrid from 'src/main';
import {
    buildCenterDateHeading,
    DAY_PLAN_FRONTMATTER_KEY,
    extractDateFromCenterHeading,
    getDayPlanDateHeadingSettings,
    parseDayPlanFromMarkdown,
} from 'src/mandala-display/logic/day-plan';
import {
    getSectionContent,
    replaceSectionContent,
} from 'src/mandala-display/logic/day-plan-sections';
import { getActiveFile } from 'src/obsidian/commands/helpers/get-active-file';
import { lang } from 'src/lang/lang';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { resolveEffectiveMandalaSettings } from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';

const isCoreSection = (section: string) => /^\d+$/.test(section);
const getTodayIsoDate = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
};

export const refreshDayPlanDateHeadingsInMarkdown = (
    markdown: string,
    settings: ReturnType<typeof getDayPlanDateHeadingSettings>,
) => {
    const plan = parseDayPlanFromMarkdown(markdown);
    if (!plan) {
        return {
            changed: false,
            markdown,
        };
    }

    let nextMarkdown = markdown;
    let changed = false;
    const seenSections = new Set<string>();
    for (const line of markdown.split('\n')) {
        const parsed = parseSectionMarker(line);
        const section = parsed?.[2];
        if (!section || !isCoreSection(section) || seenSections.has(section)) {
            continue;
        }
        seenSections.add(section);

        const currentContent = getSectionContent(nextMarkdown, section);
        if (currentContent === null) continue;
        const firstLine =
            currentContent
                .split('\n')
                .find((contentLine) => contentLine.trim().length > 0)
                ?.trim() ?? '';
        const date = extractDateFromCenterHeading(firstLine);
        if (!date) continue;

        const nextContent = replaceFirstNonEmptyLine(
            currentContent,
            buildCenterDateHeading(date, settings),
        );
        if (nextContent === currentContent) continue;
        nextMarkdown = replaceSectionContent(
            nextMarkdown,
            section,
            nextContent,
        );
        changed = true;
    }

    return {
        changed,
        markdown: nextMarkdown,
    };
};

const replaceFirstNonEmptyLine = (content: string, nextHeading: string) => {
    const lines = content.split('\n');
    const firstContentLine = lines.findIndex((line) => line.trim().length > 0);
    if (firstContentLine === -1) return nextHeading;
    lines[firstContentLine] = nextHeading;
    return lines.join('\n');
};

export const refreshCurrentDayPlanDateHeadings = async (
    plugin: MandalaGrid,
    options: { notify?: boolean } = {},
) => {
    const { notify = true } = options;
    const file = getActiveFile(plugin);
    if (!file) {
        if (notify) {
            new Notice('未找到当前文件。');
        }
        return;
    }

    const markdown = await plugin.app.vault.read(file);
    const plan = parseDayPlanFromMarkdown(markdown);
    if (!plan) {
        if (notify) {
            new Notice(lang.notice_day_plan_not_active_file);
        }
        return;
    }

    const { frontmatter } = extractFrontmatter(markdown);
    const effective = resolveEffectiveMandalaSettings(
        plugin.settings.getValue(),
        frontmatter,
    );
    const settings = getDayPlanDateHeadingSettings({
        format: effective.general.dayPlanDateHeadingFormat,
        customTemplate: effective.general.dayPlanDateHeadingCustomTemplate,
        applyMode: effective.general.dayPlanDateHeadingApplyMode,
    });
    const refreshed = refreshDayPlanDateHeadingsInMarkdown(markdown, settings);
    if (refreshed.changed) {
        await plugin.app.vault.modify(file, refreshed.markdown);
    }

    const todayHeading = buildCenterDateHeading(getTodayIsoDate(), settings);
    await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
        const record = frontmatter as Record<string, unknown>;
        const raw = record[DAY_PLAN_FRONTMATTER_KEY];
        if (!raw || typeof raw !== 'object') return;
        const dayPlan = raw as Record<string, unknown>;
        if (dayPlan.enabled !== true) return;
        dayPlan.center_date_h2 = todayHeading;
    });

    if (notify) {
        new Notice(
            refreshed.changed
                ? lang.notice_day_plan_date_headings_refreshed
                : lang.notice_day_plan_date_headings_already_latest,
        );
    }
};
