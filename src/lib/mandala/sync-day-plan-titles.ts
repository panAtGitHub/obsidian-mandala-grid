import { parseHtmlCommentMarker } from 'src/lib/data-conversion/helpers/html-comment-marker/parse-html-comment-marker';
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
        const parsed = parseHtmlCommentMarker(line);
        if (!parsed) continue;
        const section = parsed[2];
        if (!/^\d+\.[1-8]$/.test(section)) continue;
        result.add(section);
    }
    return Array.from(result);
};

export const syncDayPlanTitlesInMarkdown = (markdown: string) => {
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

    const sections = collectTargetSections(nextBody);

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
