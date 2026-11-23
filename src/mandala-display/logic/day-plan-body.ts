import {
    buildSlotHeading,
    dateFromDayOfYear,
    daysInYear,
    extractDateFromCenterHeading,
    type DayPlanFrontmatter,
} from 'src/mandala-display/logic/day-plan';

// Return the original prefix, including its line ending, so formatting never rewrites a managed title.
export const getDayPlanTitlePrefix = (
    plan: DayPlanFrontmatter,
    section: string,
    content: string,
): string | null => {
    const id = /^([1-9]\d*)(?:\.([1-8]))?$/.exec(section);
    if (!id || Number(id[1]) > daysInYear(plan.year)) return null;
    const first = /^(?:[ \t]*\r?\n)*([^\r\n]*)(?:\r?\n|$)/.exec(content);
    if (!first) return null;
    const line = first[1].trim();
    if (!id[2]) {
        return extractDateFromCenterHeading(line) ===
            dateFromDayOfYear(plan.year, Number(id[1]))
            ? first[0]
            : null;
    }
    const slot = plan.slots[id[2]];
    if (!slot) return /^#{1,6}(?:\s|$)/.test(line) ? null : '';
    return line === buildSlotHeading(slot) ? first[0] : null;
};
