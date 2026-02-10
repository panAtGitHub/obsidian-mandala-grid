import { parseHtmlCommentMarker } from 'src/lib/data-conversion/helpers/html-comment-marker/parse-html-comment-marker';
import { DAY_PLAN_FRONTMATTER_KEY, slotsRecordToArray, upsertSlotHeading } from 'src/lib/mandala/day-plan';
import {
    replaceSectionContent,
    getSectionContent,
} from 'src/lib/mandala/day-plan-sections';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';

const leadingSpaces = (line: string) => line.match(/^ */)?.[0].length ?? 0;

const stripQuotes = (value: string) => {
    const trimmed = value.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
};

const parseSlotsFromFrontmatter = (frontmatter: string) => {
    if (!frontmatter.trim()) return null;
    const stripped = frontmatter
        .replace(/^---\n/, '')
        .replace(/\n---\n?$/, '')
        .trim();
    if (!stripped) return null;

    const lines = stripped.split('\n');
    let inPlan = false;
    let inSlots = false;
    let enabled = false;
    const slots: Record<string, unknown> = {};

    for (const rawLine of lines) {
        const line = rawLine.replace(/\t/g, '    ');
        const indent = leadingSpaces(line);
        const trimmed = line.trim();

        if (!inPlan) {
            if (trimmed === `${DAY_PLAN_FRONTMATTER_KEY}:`) {
                inPlan = true;
            }
            continue;
        }

        if (indent === 0 && trimmed.length > 0) {
            break;
        }

        if (!inSlots && /^enabled\s*:\s*true\s*$/i.test(trimmed)) {
            enabled = true;
            continue;
        }

        if (!inSlots && /^slots\s*:\s*$/.test(trimmed)) {
            inSlots = true;
            continue;
        }

        if (inSlots) {
            if (indent < 4 && trimmed.length > 0) {
                inSlots = false;
            }
            const slotMatch = trimmed.match(/^"?([1-8])"?\s*:\s*(.*)$/);
            if (slotMatch) {
                slots[slotMatch[1]] = stripQuotes(slotMatch[2]);
            }
        }
    }

    if (!enabled) return null;
    return slotsRecordToArray(slots);
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
