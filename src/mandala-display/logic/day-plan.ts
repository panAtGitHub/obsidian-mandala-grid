import { parseYaml, stringifyYaml } from 'obsidian';
import type {
    DayPlanDateHeadingFormat,
    SectionRangeLimit,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';

export const DAY_PLAN_FRONTMATTER_KEY = 'mandala_day_plan';
export const LEGACY_DAY_PLAN_FRONTMATTER_KEY = 'mandala_plan';
export const DAY_PLAN_DEFAULT_CUSTOM_TEMPLATE = '## {date} {cn}';

export const DAY_PLAN_DEFAULT_SLOT_TITLES = [
    '接收太阳的能量，开心一天',
    '9-12 深度工作',
    '12-14 充电休整',
    '14-17 沟通琐事',
    '17-19 收尾协同',
    '19-21 自由探索',
    '习惯打卡',
    '今日惊喜 / 复盘 / 感恩',
] as const;

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DAY_PLAN_H2_DATE_PATTERN = /^##\s+(\d{4}-\d{2}-\d{2})(?:\s+.*)?$/;

export type DayPlanDateHeadingSettings = {
    format: DayPlanDateHeadingFormat;
    customTemplate: string;
};

export const DEFAULT_DAY_PLAN_DATE_HEADING_SETTINGS: DayPlanDateHeadingSettings =
    {
        format: 'zh-short',
        customTemplate: DAY_PLAN_DEFAULT_CUSTOM_TEMPLATE,
    };

export type DayPlanFrontmatter = {
    enabled: boolean;
    year: number;
    week_view?: { enabled?: boolean; compact?: boolean; start?: WeekStart };
    date_heading?: { format?: DayPlanDateHeadingFormat; template?: string };
    slots: Record<string, string>;
};

export type DayPlanFrontmatterParseResult = {
    mandalaEnabled: boolean;
    dayPlan: DayPlanFrontmatter | null;
};

let cachedDayPlanFrontmatter = '';
let cachedDayPlanFrontmatterResult: DayPlanFrontmatterParseResult | null = null;

const normalizeLineEndings = (content: string) =>
    content.replace(/\r\n/g, '\n');

const splitLines = (content: string) =>
    normalizeLineEndings(content).split('\n');

const stripFrontmatterMarkers = (frontmatter: string) =>
    frontmatter
        .replace(/^---\n/, '')
        .replace(/\n---\n?$/, '')
        .trim();

const firstNonEmptyLineIndex = (lines: string[]) =>
    lines.findIndex((line) => line.trim().length > 0);

export const isIsoDate = (value: string) => {
    if (!ISO_DATE_PATTERN.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() + 1 === month &&
        date.getUTCDate() === day
    );
};

export const addDaysIsoDate = (value: string, days: number) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + days);
    const nextYear = date.getUTCFullYear();
    const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    const nextDay = String(date.getUTCDate()).padStart(2, '0');
    return `${nextYear}-${nextMonth}-${nextDay}`;
};

export const isLeapYear = (year: number) =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const daysInYear = (year: number) => (isLeapYear(year) ? 366 : 365);

export const dayOfYearFromDate = (year: number, month: number, day: number) => {
    const date = new Date(Date.UTC(year, month - 1, day));
    const start = new Date(Date.UTC(year, 0, 1));
    return Math.floor((date.getTime() - start.getTime()) / 86400000) + 1;
};

export const dateFromDayOfYear = (year: number, dayOfYear: number) => {
    const start = new Date(Date.UTC(year, 0, 1));
    start.setUTCDate(start.getUTCDate() + dayOfYear - 1);
    const month = String(start.getUTCMonth() + 1).padStart(2, '0');
    const day = String(start.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const sectionFromDateInPlanYear = (
    planYear: number,
    date: Date = new Date(),
) => {
    const year = date.getFullYear();
    if (year !== planYear) return null;
    return String(dayOfYearFromDate(year, date.getMonth() + 1, date.getDate()));
};

const normalizeCoreSection = (section: string) => section.split('.')[0];

const mondayStartDayOfWeek = (date: Date) => {
    const sundayStart = date.getUTCDay();
    return (sundayStart + 6) % 7;
};

const weekStartOffset = (date: Date, weekStart: WeekStart) => {
    const sundayStart = date.getUTCDay();
    return weekStart === 'sunday' ? sundayStart : (sundayStart + 6) % 7;
};

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;
const WEEKDAY_LABELS_ZH = [
    '周一',
    '周二',
    '周三',
    '周四',
    '周五',
    '周六',
    '周日',
] as const;
const WEEKDAY_LABELS_EN_FULL = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const;
const WEEKDAY_LABELS_EN_CAP = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
] as const;

const resolveWeekdayIndex = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    return mondayStartDayOfWeek(new Date(Date.UTC(year, month - 1, day)));
};

export const getDayPlanDateHeadingSettings = (
    value: Partial<DayPlanDateHeadingSettings> | null | undefined,
): DayPlanDateHeadingSettings => ({
    format: value?.format ?? DEFAULT_DAY_PLAN_DATE_HEADING_SETTINGS.format,
    customTemplate:
        value?.customTemplate ??
        DEFAULT_DAY_PLAN_DATE_HEADING_SETTINGS.customTemplate,
});

export const getHotCoreSections = (
    planYear: number,
    date: Date = new Date(),
    weekStart: WeekStart = 'monday',
) => {
    const total = daysInYear(planYear);
    const day =
        date.getFullYear() === planYear
            ? dayOfYearFromDate(planYear, date.getMonth() + 1, date.getDate())
            : 1;
    const dateInPlan = new Date(Date.UTC(planYear, 0, day));
    const weekStartDay = day - weekStartOffset(dateInPlan, weekStart);
    const sections = new Set<string>();
    for (let offset = 0; offset < 7; offset += 1) {
        const candidate = weekStartDay + offset;
        if (candidate < 1 || candidate > total) continue;
        sections.add(String(candidate));
    }
    if (sections.size === 0) sections.add('1');
    return sections;
};

export const shiftHotWindowToCore = (
    planYear: number,
    section: string,
    weekStart: WeekStart = 'monday',
) => {
    const core = Number(normalizeCoreSection(section));
    if (!Number.isInteger(core) || core < 1 || core > daysInYear(planYear)) {
        return new Set<string>(['1']);
    }
    const dateInPlan = new Date(Date.UTC(planYear, 0, core));
    return getHotCoreSections(planYear, dateInPlan, weekStart);
};

export const getChineseWeekdayLabel = (date: string) => {
    const weekday = resolveWeekdayIndex(date);
    return WEEKDAY_LABELS[weekday];
};

export const getChineseFullWeekdayLabel = (date: string): string => {
    const weekday = resolveWeekdayIndex(date);
    return WEEKDAY_LABELS_ZH[weekday];
};

export const getEnglishShortWeekdayLabel = (date: string): string => {
    const weekday = resolveWeekdayIndex(date);
    return WEEKDAY_LABELS_EN_CAP[weekday];
};

export const getEnglishFullWeekdayLabel = (date: string): string => {
    const weekday = resolveWeekdayIndex(date);
    return WEEKDAY_LABELS_EN_FULL[weekday];
};

export const getEnglishCapitalizedWeekdayLabel = (date: string): string => {
    const weekday = resolveWeekdayIndex(date);
    return WEEKDAY_LABELS_EN_CAP[weekday];
};

export const getStartOfWeekIsoDate = (
    date: string,
    weekStart: WeekStart = 'monday',
) => {
    const [year, month, day] = date.split('-').map(Number);
    const value = new Date(Date.UTC(year, month - 1, day));
    return addDaysIsoDate(date, -weekStartOffset(value, weekStart));
};

export const getWeekIsoDates = (
    anchorDate: string,
    weekStart: WeekStart = 'monday',
) => {
    const startDate = getStartOfWeekIsoDate(anchorDate, weekStart);
    return Array.from({ length: 7 }, (_, index) =>
        addDaysIsoDate(startDate, index),
    );
};

export const getWeekIndexInPlanYear = (
    anchorDate: string,
    weekStart: WeekStart = 'monday',
) => {
    const planYear = Number(anchorDate.slice(0, 4));
    const firstDayOfYear = `${planYear}-01-01`;
    const firstWeekStart = getStartOfWeekIsoDate(firstDayOfYear, weekStart);
    const currentWeekStart = getStartOfWeekIsoDate(anchorDate, weekStart);
    const firstTime = new Date(`${firstWeekStart}T00:00:00Z`).getTime();
    const currentTime = new Date(`${currentWeekStart}T00:00:00Z`).getTime();
    return Math.floor((currentTime - firstTime) / 604800000) + 1;
};

export type WeekPlanRow = {
    date: string;
    coreSection: string | null;
    inPlanYear: boolean;
};

export const mapWeekPlanRows = (
    planYear: number,
    anchorDate: string,
    weekStart: WeekStart = 'monday',
): WeekPlanRow[] =>
    getWeekIsoDates(anchorDate, weekStart).map((date) => {
        const year = Number(date.slice(0, 4));
        if (year !== planYear) {
            return {
                date,
                coreSection: null,
                inPlanYear: false,
            };
        }
        const [, month, day] = date.split('-').map(Number);
        return {
            date,
            coreSection: String(dayOfYearFromDate(planYear, month, day)),
            inPlanYear: true,
        };
    });

export const sectionAtCellWeek7x9 = (
    row: number,
    col: number,
    rows: WeekPlanRow[],
) => {
    const weekRow = rows[row];
    if (!weekRow?.coreSection) return null;
    if (col === 0) return weekRow.coreSection;
    if (col < 1 || col > 8) return null;
    return `${weekRow.coreSection}.${col}`;
};

export const posOfSectionWeek7x9 = (section: string, rows: WeekPlanRow[]) => {
    const core = normalizeCoreSection(section);
    const row = rows.findIndex((value) => value.coreSection === core);
    if (row === -1) return null;
    if (section === core) return { row, col: 0 };
    const suffix = Number(section.slice(core.length + 1));
    if (!Number.isInteger(suffix) || suffix < 1 || suffix > 8) return null;
    return { row, col: suffix };
};

const replaceToken = (value: string, token: string, replacement: string) =>
    value.split(token).join(replacement);

const buildCenterDateHeadingFromTemplate = (
    date: string,
    template: string,
): string => {
    const normalizedTemplate =
        template.trim() || DAY_PLAN_DEFAULT_CUSTOM_TEMPLATE;
    let rendered = normalizedTemplate;
    rendered = replaceToken(rendered, '{date}', date);
    rendered = replaceToken(rendered, '{cn}', getChineseWeekdayLabel(date));
    rendered = replaceToken(rendered, '{zh}', getChineseFullWeekdayLabel(date));
    rendered = replaceToken(
        rendered,
        '{en}',
        getEnglishShortWeekdayLabel(date),
    );
    rendered = replaceToken(
        rendered,
        '{en_full}',
        getEnglishFullWeekdayLabel(date),
    );
    rendered = replaceToken(
        rendered,
        '{en_cap}',
        getEnglishCapitalizedWeekdayLabel(date),
    );
    rendered = rendered.trim();

    const safeRendered =
        rendered.length > 0
            ? rendered
            : `## ${date} ${getChineseWeekdayLabel(date)}`;
    const withHeadingPrefix = safeRendered.startsWith('## ')
        ? safeRendered
        : `## ${safeRendered}`;
    return withHeadingPrefix.includes(date)
        ? withHeadingPrefix
        : withHeadingPrefix.replace(/^##\s*/, `## ${date} `);
};

export const buildCenterDateHeading = (
    date: string,
    settings?: Partial<DayPlanDateHeadingSettings> | null,
): string => {
    const normalized = getDayPlanDateHeadingSettings(settings);
    switch (normalized.format) {
        case 'date-only':
            return `## ${date}`;
        case 'zh-full':
            return `## ${date} ${getChineseFullWeekdayLabel(date)}`;
        case 'zh-short':
            return `## ${date} ${getChineseWeekdayLabel(date)}`;
        case 'en-short':
            return `## ${date} ${getEnglishShortWeekdayLabel(date)}`;
        case 'custom':
            return buildCenterDateHeadingFromTemplate(
                date,
                normalized.customTemplate,
            );
    }
};

export const extractDateFromCenterHeading = (heading: string) => {
    const match = DAY_PLAN_H2_DATE_PATTERN.exec(heading.trim());
    if (!match) return null;
    const date = match[1] ?? '';
    if (!isIsoDate(date)) return null;
    return date;
};

export const normalizeSlotTitle = (value: string) =>
    value.replace(/^#{1,6}\s*/, '').trim();

export const buildSlotHeading = (title: string) =>
    `### ${normalizeSlotTitle(title)}`;

export const hasValidCenterDateHeading = (content: string) => {
    const lines = splitLines(content);
    const index = firstNonEmptyLineIndex(lines);
    if (index === -1) return false;
    return extractDateFromCenterHeading(lines[index]) !== null;
};

export const upsertCenterDateHeading = (
    content: string,
    date: string,
    settings?: Partial<DayPlanDateHeadingSettings> | null,
): string => {
    const nextHeading = buildCenterDateHeading(date, settings);
    const lines = splitLines(content);
    if (lines.length === 1 && lines[0] === '') {
        return nextHeading;
    }

    const firstContentLine = firstNonEmptyLineIndex(lines);
    if (firstContentLine === -1) {
        return nextHeading;
    }

    if (/^#{1,6}\s+/.test(lines[firstContentLine].trim())) {
        lines[firstContentLine] = nextHeading;
        return lines.join('\n').replace(/^\n+/, '');
    }

    return [nextHeading, ...lines].join('\n').replace(/^\n+/, '');
};

export const upsertSlotHeading = (content: string, title: string) => {
    const nextHeading = buildSlotHeading(title);
    const lines = splitLines(content);

    if (lines.length === 1 && lines[0] === '') {
        return nextHeading;
    }

    const firstContentLine = firstNonEmptyLineIndex(lines);
    if (firstContentLine === -1) {
        return nextHeading;
    }

    if (/^###\s+/.test(lines[firstContentLine].trim())) {
        lines[firstContentLine] = nextHeading;
        return lines.join('\n').replace(/^\n+/, '');
    }

    return [nextHeading, ...lines].join('\n').replace(/^\n+/, '');
};

export const toSlotsRecord = (slots: string[]) => {
    const record: Record<string, string> = {};
    for (let i = 0; i < 8; i += 1) {
        record[String(i + 1)] = normalizeSlotTitle(slots[i] ?? '');
    }
    return record;
};

export const slotsRecordToArray = (
    slots: Record<string, unknown> | null | undefined,
) => {
    const values: string[] = [];
    for (let i = 1; i <= 8; i += 1) {
        const raw = slots?.[String(i)];
        values.push(typeof raw === 'string' ? normalizeSlotTitle(raw) : '');
    }
    return values;
};

export const allSlotsFilled = (slots: string[]) =>
    slots.length === 8 &&
    slots.every((slot) => normalizeSlotTitle(slot).length > 0);

const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;

const readDayPlanConfigurationUncached = (frontmatter: string) => {
    let root: Record<string, unknown> | null;
    try {
        root = asRecord(parseYaml(stripFrontmatterMarkers(frontmatter)));
    } catch {
        return {
            mandalaEnabled: false,
            present: true,
            legacy: false,
            config: null,
            error: 'YAML 格式无效。',
        };
    }
    const legacy = !!root && !(DAY_PLAN_FRONTMATTER_KEY in root);
    const key = legacy
        ? LEGACY_DAY_PLAN_FRONTMATTER_KEY
        : DAY_PLAN_FRONTMATTER_KEY;
    const present = !!root && key in root;
    const raw = asRecord(root?.[key]);
    const base = { mandalaEnabled: root?.mandala === true, present, legacy };
    if (!present) return { ...base, config: null, error: null };
    if (
        !raw ||
        typeof raw.enabled !== 'boolean' ||
        !Number.isInteger(legacy ? Number(raw.year) : raw.year) ||
        Number(raw.year) < 1900 ||
        Number(raw.year) > 9999
    )
        return {
            ...base,
            config: null,
            error: '日计划 enabled 或 year 配置无效。',
        };
    const week = asRecord(raw.week_view);
    const heading = asRecord(raw.date_heading);
    const formats = ['date-only', 'zh-full', 'zh-short', 'en-short', 'custom'];
    if (
        !legacy &&
        ((raw.week_view !== undefined && !week) ||
            (raw.date_heading !== undefined && !heading) ||
            (week?.enabled !== undefined &&
                typeof week.enabled !== 'boolean') ||
            (week?.compact !== undefined &&
                typeof week.compact !== 'boolean') ||
            (week?.start !== undefined &&
                week.start !== 'monday' &&
                week.start !== 'sunday') ||
            (heading?.format !== undefined &&
                (typeof heading.format !== 'string' ||
                    !formats.includes(heading.format))) ||
            (heading?.template !== undefined &&
                typeof heading.template !== 'string') ||
            (heading?.format === 'custom' &&
                (typeof heading.template !== 'string' ||
                    !isValidDayPlanDateTemplate(heading.template))))
    )
        return {
            ...base,
            config: null,
            error: '日计划周视图或日期标题配置无效。',
        };
    const slots = asRecord(raw.slots);
    if (
        raw.slots !== undefined &&
        (!slots ||
            Object.values(slots).some((value) => typeof value !== 'string'))
    )
        return { ...base, config: null, error: '日计划八格标题必须是文字。' };
    const config: DayPlanFrontmatter = {
        enabled: raw.enabled,
        year: Number(raw.year),
        slots: toSlotsRecord(slotsRecordToArray(slots)),
        ...(!legacy
            ? {
                  week_view: {
                      ...(typeof week?.enabled === 'boolean'
                          ? { enabled: week.enabled }
                          : {}),
                      ...(typeof week?.compact === 'boolean'
                          ? { compact: week.compact }
                          : {}),
                      ...(week?.start === 'monday' || week?.start === 'sunday'
                          ? { start: week.start }
                          : {}),
                  },
                  date_heading: {
                      ...(typeof heading?.format === 'string'
                          ? {
                                format: heading.format as DayPlanDateHeadingFormat,
                            }
                          : {}),
                      ...(typeof heading?.template === 'string'
                          ? { template: heading.template }
                          : {}),
                  },
              }
            : {}),
    };
    return { ...base, config, error: null };
};

let cachedConfigurationFrontmatter: string | null = null;
let cachedConfiguration: ReturnType<
    typeof readDayPlanConfigurationUncached
> | null = null;

export const readDayPlanConfiguration = (frontmatter: string) => {
    if (cachedConfiguration && cachedConfigurationFrontmatter === frontmatter)
        return cachedConfiguration;
    cachedConfigurationFrontmatter = frontmatter;
    cachedConfiguration = readDayPlanConfigurationUncached(frontmatter);
    return cachedConfiguration;
};

export const readDayPlanConfigurationFromRecord = (
    root: Record<string, unknown>,
) => readDayPlanConfiguration(stringifyYaml(root));

export const isValidDayPlanDateTemplate = (template: string) =>
    /^(?:##\s+)?\{date\}(?:\s|$)/.test(template.trim()) &&
    !/[\r\n]/.test(template);

export const writeDayPlanConfiguration = (
    root: Record<string, unknown>,
    config: DayPlanFrontmatter,
) => {
    root[DAY_PLAN_FRONTMATTER_KEY] = {
        enabled: config.enabled,
        year: config.year,
        week_view: {
            start: config.week_view?.start ?? 'monday',
        },
        date_heading:
            config.date_heading?.format === 'custom'
                ? config.date_heading
                : { format: config.date_heading?.format ?? 'zh-short' },
        slots: toSlotsRecord(slotsRecordToArray(config.slots)),
    };
    delete root[LEGACY_DAY_PLAN_FRONTMATTER_KEY];
    const settings = asRecord(root.mandala_settings);
    if (settings) delete settings.general;
};

export const resolveLegacyDayPlanSubgridMaxDepthOverride = (
    frontmatter: string,
): SectionRangeLimit | undefined => {
    const parsed = readDayPlanConfiguration(frontmatter);
    if (!parsed.legacy || !parsed.mandalaEnabled || !parsed.config?.enabled)
        return undefined;
    const root = asRecord(parseYaml(stripFrontmatterMarkers(frontmatter)));
    return asRecord(root?.[LEGACY_DAY_PLAN_FRONTMATTER_KEY])?.daily_only_3x3 ===
        false
        ? undefined
        : 2;
};

const parseDayPlanFrontmatterWithMandalaUncached = (
    frontmatter: string,
): DayPlanFrontmatterParseResult => {
    const parsed = readDayPlanConfiguration(frontmatter);
    return {
        mandalaEnabled: parsed.mandalaEnabled,
        dayPlan:
            parsed.mandalaEnabled && parsed.config?.enabled
                ? parsed.config
                : null,
    };
};

export const parseDayPlanFrontmatterWithMandala = (
    frontmatter: string,
): DayPlanFrontmatterParseResult => {
    if (
        cachedDayPlanFrontmatterResult &&
        cachedDayPlanFrontmatter === frontmatter
    ) {
        return cachedDayPlanFrontmatterResult;
    }

    const result = parseDayPlanFrontmatterWithMandalaUncached(frontmatter);
    cachedDayPlanFrontmatter = frontmatter;
    cachedDayPlanFrontmatterResult = result;
    return result;
};

export const parseDayPlanFrontmatter = (
    frontmatter: string,
): DayPlanFrontmatter | null =>
    parseDayPlanFrontmatterWithMandala(frontmatter).dayPlan;

export const parseDayPlanFromMarkdown = (markdown: string) => {
    const frontmatterMatch = markdown.match(/^---\n([\s\S]+?)\n---\n?/);
    if (!frontmatterMatch) return null;
    return parseDayPlanFrontmatter(`---\n${frontmatterMatch[1]}\n---\n`);
};

export const isDayPlanDedicatedFrontmatter = (frontmatter: string) => {
    const parsed = parseDayPlanFrontmatterWithMandala(frontmatter);
    return parsed.mandalaEnabled && parsed.dayPlan?.enabled === true;
};

export const isDayPlanDedicatedMarkdown = (markdown: string) => {
    const frontmatterMatch = markdown.match(/^---\n([\s\S]+?)\n---\n?/);
    if (!frontmatterMatch) return false;
    return isDayPlanDedicatedFrontmatter(`---\n${frontmatterMatch[1]}\n---\n`);
};
