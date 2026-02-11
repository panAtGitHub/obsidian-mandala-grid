import {
    DayPlanFrontmatter,
    getHotCoreSections,
    parseDayPlanFrontmatter,
    sectionFromDateInPlanYear,
} from 'src/lib/mandala/day-plan';

export type MandalaProfileKind = 'none' | 'generic' | 'day-plan';

export type MandalaProfileActivation = {
    kind: MandalaProfileKind;
    targetSection: string | null;
    hotCoreSections: Set<string>;
    notice: string | null;
    dayPlan: DayPlanFrontmatter | null;
};

const stripFrontmatterMarkers = (frontmatter: string) =>
    frontmatter.replace(/^---\n/, '').replace(/\n---\n?$/, '');

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

export const isMandalaFrontmatterEnabled = (frontmatter: string) => {
    const stripped = stripFrontmatterMarkers(frontmatter);
    const match = stripped.match(/^mandala\s*:\s*(.*)$/m);
    if (!match) return false;
    return stripQuotes(match[1]).toLowerCase() === 'true';
};

export const resolveMandalaProfileActivation = (
    frontmatter: string,
    date: Date = new Date(),
): MandalaProfileActivation => {
    if (!isMandalaFrontmatterEnabled(frontmatter)) {
        return {
            kind: 'none',
            targetSection: null,
            hotCoreSections: new Set(),
            notice: null,
            dayPlan: null,
        };
    }

    const dayPlan = parseDayPlanFrontmatter(frontmatter);
    if (!dayPlan || dayPlan.enabled !== true) {
        return {
            kind: 'generic',
            targetSection: null,
            hotCoreSections: new Set(),
            notice: null,
            dayPlan: null,
        };
    }

    const todaySection = sectionFromDateInPlanYear(dayPlan.year, date);
    if (!todaySection) {
        return {
            kind: 'day-plan',
            targetSection: '1',
            hotCoreSections: new Set(['1']),
            notice: '年份错误。',
            dayPlan,
        };
    }

    return {
        kind: 'day-plan',
        targetSection: todaySection,
        hotCoreSections: getHotCoreSections(dayPlan.year, date),
        notice: null,
        dayPlan,
    };
};
