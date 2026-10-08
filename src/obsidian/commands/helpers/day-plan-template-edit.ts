import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';
import type { MandalaView } from 'src/view/view';
import { parseYaml, stringifyYaml } from 'obsidian';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import {
    allSlotsFilled,
    dateFromDayOfYear,
    daysInYear,
    isIsoDate,
    readDayPlanConfigurationFromRecord,
    toSlotsRecord,
    writeDayPlanConfiguration,
} from 'src/mandala-display/logic/day-plan';
import {
    resolveEffectiveMandalaSettings,
    withDayPlanDisplaySettings,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import {
    createDayPlanTitleSyncBatches,
    syncDayPlanTitlesBySections,
} from 'src/mandala-display/logic/sync-day-plan-titles';

export const localDayPlanDate = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const updateDayPlanTemplateMarkdown = (
    markdown: string,
    options: { slots?: string[]; start: string; end: string },
) => {
    const { frontmatter, body } = extractFrontmatter(markdown);
    const root = parseYaml(
        frontmatter.replace(/^---\n/, '').replace(/\n---\n?$/, ''),
    ) as Record<string, unknown>;
    const parsed = readDayPlanConfigurationFromRecord(root);
    if (!parsed.config?.enabled)
        throw new Error(parsed.error ?? '当前文件未启用日计划。');
    const year = parsed.config.year;
    if (
        !isIsoDate(options.start) ||
        !isIsoDate(options.end) ||
        options.start > options.end ||
        Number(options.start.slice(0, 4)) !== year ||
        Number(options.end.slice(0, 4)) !== year
    )
        throw new Error('请选择当前计划年份内的有效日期范围。');
    let next = markdown;
    if (options.slots) {
        if (!allSlotsFilled(options.slots))
            throw new Error('请填写完整的八个标题。');
        // Keep file-owned display settings; only the slot titles are being edited.
        writeDayPlanConfiguration(root, {
            ...parsed.config,
            slots: toSlotsRecord(options.slots),
        });
        next = `---\n${stringifyYaml(root)}---\n${body}`;
    }
    const batches = createDayPlanTitleSyncBatches(next);
    const sections =
        batches?.batches.flat().filter((section) => {
            const core = Number(section.split('.')[0]);
            if (core < 1 || core > daysInYear(year)) return false;
            const date = dateFromDayOfYear(year, core);
            return date >= options.start && date <= options.end;
        }) ?? [];
    return syncDayPlanTitlesBySections(next, sections).markdown;
};

export const editDayPlanTemplate = async (
    view: MandalaView,
    options: { slots?: string[]; start: string; end: string },
) => {
    const file = view.file;
    if (!file) return;
    view.ensureFullHydrated('day-plan-template-edit');
    const markdown = await view.plugin.app.vault.process(file, (raw) => {
        if (!options.slots) return updateDayPlanTemplateMarkdown(raw, options);
        const { frontmatter } = extractFrontmatter(raw);
        const root = parseYaml(
            frontmatter.replace(/^---\n/, '').replace(/\n---\n?$/, ''),
        ) as Record<string, unknown>;
        const parsed = readDayPlanConfigurationFromRecord(root);
        if (!parsed.config) throw new Error(parsed.error ?? '日计划配置无效。');
        const settings = resolveEffectiveMandalaSettings(
            view.plugin.settings.getValue(),
            frontmatter,
        );
        writeDayPlanConfiguration(
            root,
            withDayPlanDisplaySettings(parsed.config, settings.general),
        );
        return updateDayPlanTemplateMarkdown(
            `---\n${stringifyYaml(root)}---\n${extractFrontmatter(raw).body}`,
            options,
        );
    });
    if (view.file === file) {
        view.setViewData(markdown);
        updateFrontmatter(view, extractFrontmatter(markdown).frontmatter);
    }
};
