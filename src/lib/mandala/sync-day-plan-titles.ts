import { parseSectionMarker } from 'src/engine/mandala-document/parse-section-marker';
import {
    parseDayPlanFrontmatter,
    slotsRecordToArray,
    upsertSlotHeading,
} from 'src/lib/mandala/day-plan';
import {
    replaceSectionContent,
    getSectionContent,
} from 'src/lib/mandala/day-plan-sections';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';

const parseSlotsFromFrontmatter = (frontmatter: string) => {
    const plan = parseDayPlanFrontmatter(frontmatter);
    if (!plan) return null;
    return slotsRecordToArray(plan.slots);
};

const collectTargetSections = (body: string) => {
    const result = new Set<string>();
    for (const line of body.split('\n')) {
        const parsed = parseSectionMarker(line);
        if (!parsed) continue;
        const section = parsed[2];
        if (!/^\d+\.[1-8]$/.test(section)) continue;
        result.add(section);
    }
    return Array.from(result);
};

export const createDayPlanTitleSyncBatches = (
    markdown: string,
    batchSize = 80,
) => {
    const { body, frontmatter } = extractFrontmatter(markdown);
    const slots = parseSlotsFromFrontmatter(frontmatter);
    if (!slots) return null;
    const sections = collectTargetSections(body);
    if (sections.length === 0) return null;
    const normalizedBatchSize = Math.max(1, batchSize);
    const batches: string[][] = [];
    for (let i = 0; i < sections.length; i += normalizedBatchSize) {
        batches.push(sections.slice(i, i + normalizedBatchSize));
    }
    return { total: sections.length, batches };
};

export const syncDayPlanTitlesBySections = (
    markdown: string,
    sections: string[],
) => {
    const { body, frontmatter } = extractFrontmatter(markdown);
    const slots = parseSlotsFromFrontmatter(frontmatter);
    if (!slots) {
        return {
            changed: false,
            markdown,
        };
    }

    let nextBody = body;
    let changed = false;
    for (const section of sections) {
        const slotIndex = Number(section.split('.')[1]) - 1;
        const title = slots[slotIndex] ?? '';
        if (!title) continue;
        const current = getSectionContent(nextBody, section) ?? '';
        if (!current.trim()) continue;
        const next = upsertSlotHeading(current, title);
        if (next === current) continue;
        nextBody = replaceSectionContent(nextBody, section, next);
        changed = true;
    }
    return {
        changed,
        markdown: frontmatter + nextBody,
    };
};

export const syncDayPlanTitlesInMarkdown = (markdown: string) => {
    const batches = createDayPlanTitleSyncBatches(markdown);
    if (!batches) {
        return {
            changed: false,
            markdown,
        };
    }
    let nextMarkdown = markdown;
    let changed = false;
    for (const sections of batches.batches) {
        const batch = syncDayPlanTitlesBySections(nextMarkdown, sections);
        if (batch.changed) changed = true;
        nextMarkdown = batch.markdown;
    }
    return {
        changed,
        markdown: nextMarkdown,
    };
};
