import {
    DayPlanFrontmatter,
    getHotCoreSections,
    parseDayPlanFrontmatterWithMandala,
    sectionFromDateInPlanYear,
} from 'src/mandala-display/logic/day-plan';
import type {
    MandalaMode,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';

export type MandalaProfileKind = 'none' | 'generic' | 'day-plan';
export type MandalaSceneVariant = 'default' | 'day-plan' | 'week-7x9';
export type MandalaSceneKey = {
    viewKind: MandalaMode;
    variant: MandalaSceneVariant;
};
export type MandalaProfile = {
    kind: Exclude<MandalaProfileKind, 'none'>;
    dayPlan: DayPlanFrontmatter | null;
};

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
    weekStart: WeekStart = 'monday',
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
        hotCoreSections: getHotCoreSections(dayPlan.year, date, weekStart),
        notice: null,
        dayPlan,
    };
};

export const resolveMandalaProfile = (
    frontmatter: string,
): MandalaProfile | null => {
    const parsed = parseDayPlanFrontmatterWithMandala(frontmatter);
    if (!parsed.mandalaEnabled) return null;
    if (parsed.dayPlan?.enabled) {
        return {
            kind: 'day-plan',
            dayPlan: parsed.dayPlan,
        };
    }
    return {
        kind: 'generic',
        dayPlan: null,
    };
};

export const resolveMandalaSceneKey = ({
    frontmatter,
    viewKind,
    weekPlanEnabled,
}: {
    frontmatter: string;
    viewKind: MandalaMode;
    weekPlanEnabled: boolean;
}): MandalaSceneKey => {
    const profile = resolveMandalaProfile(frontmatter);
    if (!profile || profile.kind === 'generic') {
        return {
            viewKind,
            variant: 'default',
        };
    }

    if (viewKind === '3x3') {
        return {
            viewKind,
            variant: 'day-plan',
        };
    }

    if (viewKind === 'nx9' && weekPlanEnabled) {
        return {
            viewKind,
            variant: 'week-7x9',
        };
    }

    return {
        viewKind,
        variant: 'default',
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
