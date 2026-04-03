import { parseYaml } from 'obsidian';
import type {
    DayPlanDateHeadingApplyMode,
    DayPlanDateHeadingFormat,
    SectionRangeLimit,
    Settings,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';

export const MANDALA_FRONTMATTER_SETTINGS_KEY = 'mandala_settings';

export type MandalaFrontmatterSettings = {
    view?: {
        enable9x9View?: boolean;
        enableNx9View?: boolean;
        coreSectionMax?: SectionRangeLimit;
        subgridMaxDepth?: SectionRangeLimit;
    };
    general?: {
        dayPlanEnabled?: boolean;
        weekPlanEnabled?: boolean;
        weekPlanCompactMode?: boolean;
        weekStart?: WeekStart;
        dayPlanDateHeadingFormat?: DayPlanDateHeadingFormat;
        dayPlanDateHeadingCustomTemplate?: string;
        dayPlanDateHeadingApplyMode?: DayPlanDateHeadingApplyMode;
    };
};

export type EffectiveMandalaSettings = {
    view: {
        enable9x9View: boolean;
        enableNx9View: boolean;
        coreSectionMax: SectionRangeLimit;
        subgridMaxDepth: SectionRangeLimit;
    };
    general: {
        dayPlanEnabled: boolean;
        weekPlanEnabled: boolean;
        weekPlanCompactMode: boolean;
        weekStart: WeekStart;
        dayPlanDateHeadingFormat: DayPlanDateHeadingFormat;
        dayPlanDateHeadingCustomTemplate: string;
        dayPlanDateHeadingApplyMode: DayPlanDateHeadingApplyMode;
    };
};

const toRecord = (input: unknown): Record<string, unknown> | null =>
    input && typeof input === 'object' ? (input as Record<string, unknown>) : null;

const isWeekStart = (value: unknown): value is WeekStart =>
    value === 'monday' || value === 'sunday';

const isDayPlanDateHeadingFormat = (
    value: unknown,
): value is DayPlanDateHeadingFormat =>
    value === 'date-only' ||
    value === 'zh-full' ||
    value === 'zh-short' ||
    value === 'en-short' ||
    value === 'custom';

const isDayPlanDateHeadingApplyMode = (
    value: unknown,
): value is DayPlanDateHeadingApplyMode =>
    value === 'immediate' || value === 'manual';

const toRangeLimit = (value: unknown): SectionRangeLimit | undefined => {
    if (value === null || value === 'unlimited') return 'unlimited';
    if (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        Number.isFinite(value) &&
        value >= 1
    ) {
        return value;
    }
    return undefined;
};

const stripFrontmatterMarkers = (frontmatter: string) =>
    frontmatter.replace(/^---\n/, '').replace(/\n---\n?$/, '');

export const parseMandalaFrontmatterSettings = (
    frontmatter: string,
): MandalaFrontmatterSettings => {
    if (!frontmatter.trim()) return {};
    let parsed: unknown = null;
    try {
        parsed = parseYaml(stripFrontmatterMarkers(frontmatter));
    } catch {
        return {};
    }
    const root = toRecord(parsed);
    if (!root) return {};

    const rawSettings = toRecord(root[MANDALA_FRONTMATTER_SETTINGS_KEY]);
    if (!rawSettings) return {};

    const viewRaw = toRecord(rawSettings.view);
    const generalRaw = toRecord(rawSettings.general);

    const view: MandalaFrontmatterSettings['view'] = {};
    if (typeof viewRaw?.enable9x9View === 'boolean') {
        view.enable9x9View = viewRaw.enable9x9View;
    }
    if (typeof viewRaw?.enableNx9View === 'boolean') {
        view.enableNx9View = viewRaw.enableNx9View;
    }
    const coreSectionMax = toRangeLimit(viewRaw?.coreSectionMax);
    if (coreSectionMax !== undefined) {
        view.coreSectionMax = coreSectionMax;
    }
    const subgridMaxDepth = toRangeLimit(viewRaw?.subgridMaxDepth);
    if (subgridMaxDepth !== undefined) {
        view.subgridMaxDepth = subgridMaxDepth;
    }

    const general: MandalaFrontmatterSettings['general'] = {};
    if (typeof generalRaw?.dayPlanEnabled === 'boolean') {
        general.dayPlanEnabled = generalRaw.dayPlanEnabled;
    }
    if (typeof generalRaw?.weekPlanEnabled === 'boolean') {
        general.weekPlanEnabled = generalRaw.weekPlanEnabled;
    }
    if (typeof generalRaw?.weekPlanCompactMode === 'boolean') {
        general.weekPlanCompactMode = generalRaw.weekPlanCompactMode;
    }
    if (isWeekStart(generalRaw?.weekStart)) {
        general.weekStart = generalRaw.weekStart;
    }
    if (isDayPlanDateHeadingFormat(generalRaw?.dayPlanDateHeadingFormat)) {
        general.dayPlanDateHeadingFormat = generalRaw.dayPlanDateHeadingFormat;
    }
    if (typeof generalRaw?.dayPlanDateHeadingCustomTemplate === 'string') {
        general.dayPlanDateHeadingCustomTemplate =
            generalRaw.dayPlanDateHeadingCustomTemplate;
    }
    if (isDayPlanDateHeadingApplyMode(generalRaw?.dayPlanDateHeadingApplyMode)) {
        general.dayPlanDateHeadingApplyMode = generalRaw.dayPlanDateHeadingApplyMode;
    }

    return {
        ...(Object.keys(view).length > 0 ? { view } : {}),
        ...(Object.keys(general).length > 0 ? { general } : {}),
    };
};

export const resolveEffectiveMandalaSettings = (
    settings: Settings,
    frontmatter: string,
): EffectiveMandalaSettings => {
    const overrides = parseMandalaFrontmatterSettings(frontmatter);
    const hasViewOverride = <K extends keyof NonNullable<MandalaFrontmatterSettings['view']>>(
        key: K,
    ) => !!overrides.view && key in overrides.view;
    return {
        view: {
            enable9x9View:
                overrides.view?.enable9x9View ?? settings.view.enable9x9View,
            enableNx9View:
                overrides.view?.enableNx9View ?? settings.view.enableNx9View,
            coreSectionMax: hasViewOverride('coreSectionMax')
                ? (overrides.view?.coreSectionMax ?? 'unlimited')
                : settings.view.coreSectionMax,
            subgridMaxDepth: hasViewOverride('subgridMaxDepth')
                ? (overrides.view?.subgridMaxDepth ?? 'unlimited')
                : settings.view.subgridMaxDepth,
        },
        general: {
            dayPlanEnabled:
                overrides.general?.dayPlanEnabled ?? settings.general.dayPlanEnabled,
            weekPlanEnabled:
                overrides.general?.weekPlanEnabled ??
                settings.general.weekPlanEnabled,
            weekPlanCompactMode:
                overrides.general?.weekPlanCompactMode ??
                settings.general.weekPlanCompactMode,
            weekStart: overrides.general?.weekStart ?? settings.general.weekStart,
            dayPlanDateHeadingFormat:
                overrides.general?.dayPlanDateHeadingFormat ??
                settings.general.dayPlanDateHeadingFormat,
            dayPlanDateHeadingCustomTemplate:
                overrides.general?.dayPlanDateHeadingCustomTemplate ??
                settings.general.dayPlanDateHeadingCustomTemplate,
            dayPlanDateHeadingApplyMode:
                overrides.general?.dayPlanDateHeadingApplyMode ??
                settings.general.dayPlanDateHeadingApplyMode,
        },
    };
};
