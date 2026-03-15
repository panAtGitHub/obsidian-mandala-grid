import {
    DayPlanFrontmatter,
    getHotCoreSections,
    parseDayPlanFrontmatterWithMandala,
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

export type DayPlanTodayNavigation = {
    isDayPlan: boolean;
    targetSection: string | null;
    canNavigate: boolean;
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
    const parsed = parseDayPlanFrontmatterWithMandala(frontmatter);
    if (!parsed.mandalaEnabled) {
        return {
            kind: 'none',
            targetSection: null,
            hotCoreSections: new Set(),
            notice: null,
            dayPlan: null,
        };
    }

    const dayPlan = parsed.dayPlan;
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

export const resolveDayPlanTodayNavigation = (
    frontmatter: string,
    date: Date = new Date(),
): DayPlanTodayNavigation => {
    const parsed = parseDayPlanFrontmatterWithMandala(frontmatter);
    const dayPlan = parsed.dayPlan;
    if (!parsed.mandalaEnabled || !dayPlan || dayPlan.enabled !== true) {
        return {
            isDayPlan: false,
            targetSection: null,
            canNavigate: false,
        };
    }

    const targetSection = sectionFromDateInPlanYear(dayPlan.year, date);
    return {
        isDayPlan: true,
        targetSection,
        canNavigate: targetSection !== null,
    };
};
