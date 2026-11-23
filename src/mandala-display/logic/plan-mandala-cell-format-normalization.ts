import { MandalaSourceRuntime } from 'src/mandala-document/runtime/source-document-runtime';
import { parseSectionParts } from 'src/mandala-document/engine/section-utils';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import {
    getMandalaCellFormatRule,
    type MandalaCellFormatConfig,
} from 'src/mandala-settings/state/frontmatter/mandala-cell-format';
import type { SectionRangeLimit } from 'src/mandala-settings/state/settings-type';
import { readDayPlanConfiguration } from 'src/mandala-display/logic/day-plan';
import { normalizeMandalaCellFormatContent } from 'src/mandala-display/logic/normalize-mandala-cell-format';

export type MandalaCellFormatNormalizationEdit = {
    sectionId: string;
    before: string;
    after: string;
};

export type MandalaCellFormatNormalizationPlan = {
    sectionIds: string[];
    edits: MandalaCellFormatNormalizationEdit[];
    skippedCount: number;
    removedHeadingCount: number;
};

const hasHeading = (content: string) =>
    content.split(/\r?\n/).some((line) => /^#{1,6}[ \t]+\S/.test(line.trim()));

const stableConfig = (config: MandalaCellFormatConfig) =>
    JSON.stringify({
        enabled: config.enabled,
        levels: Object.fromEntries(
            Object.entries(config.levels).sort(
                ([a], [b]) => Number(a) - Number(b),
            ),
        ),
        deeper: config.deeper,
    });

export const isSameMandalaCellFormatConfig = (
    a: MandalaCellFormatConfig,
    b: MandalaCellFormatConfig,
) => stableConfig(a) === stableConfig(b);

export const planMandalaCellFormatNormalization = (
    markdown: string,
    config: MandalaCellFormatConfig,
    maxDepth: SectionRangeLimit = 'unlimited',
): MandalaCellFormatNormalizationPlan => {
    const { body, frontmatter } = extractFrontmatter(markdown);
    const runtime = new MandalaSourceRuntime(body);
    if (!runtime.index.diagnostics.valid) {
        throw new Error('无法安全识别文件中的 section');
    }

    const dayPlan = !!readDayPlanConfiguration(frontmatter).config;
    const edits: MandalaCellFormatNormalizationEdit[] = [];
    let skippedCount = 0;
    let removedHeadingCount = 0;

    for (const sectionId of runtime.index.sourceOrderedIds) {
        const content = runtime.getContent(sectionId);
        if (content === null) continue;
        const depth = parseSectionParts(sectionId).length;
        if (dayPlan && depth === 1) continue;
        const rule = getMandalaCellFormatRule(config, depth, maxDepth);
        const result = normalizeMandalaCellFormatContent(content, rule);
        if (result.skipped) {
            skippedCount += 1;
            continue;
        }
        if (!result.changed) continue;
        if (rule.heading === 'none' && hasHeading(content)) {
            removedHeadingCount += 1;
        }
        edits.push({
            sectionId,
            before: content,
            after: result.content,
        });
    }

    return {
        sectionIds: runtime.index.sourceOrderedIds,
        edits,
        skippedCount,
        removedHeadingCount,
    };
};
