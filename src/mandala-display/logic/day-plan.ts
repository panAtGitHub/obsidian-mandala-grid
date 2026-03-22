import type {
    DayPlanDateHeadingApplyMode,
    DayPlanDateHeadingFormat,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';

export const DAY_PLAN_FRONTMATTER_KEY = 'mandala_plan';
export const DAY_PLAN_DEFAULT_CUSTOM_TEMPLATE = '## {date} {cn}';

export const DAY_PLAN_DEFAULT_SLOT_TITLES = [
    '接收太阳的能量，开心一天',
    '09-12',
    '12-14',
    '14-16',
    '16-18',
    '18-19',
    '19-21',
    '睡觉准备',
] as const;

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DAY_PLAN_H2_DATE_PATTERN =
    /^##\s+(\d{4}-\d{2}-\d{2})(?:\s+.*)?$/;

export type DayPlanDateHeadingSettings = {
    format: DayPlanDateHeadingFormat;
    customTemplate: string;
    applyMode: DayPlanDateHeadingApplyMode;
};

export const DEFAULT_DAY_PLAN_DATE_HEADING_SETTINGS: DayPlanDateHeadingSettings =
    {
        format: 'zh-short',
        customTemplate: DAY_PLAN_DEFAULT_CUSTOM_TEMPLATE,
        applyMode: 'manual',
    };

export type DayPlanFrontmatter = {
    enabled: boolean;
    year: number;
    daily_only_3x3: boolean;
    center_date_h2?: string;
    slots: Record<string, string>;
};

export type DayPlanFrontmatterParseResult = {
    mandalaEnabled: boolean;
    dayPlan: DayPlanFrontmatter | null;
};

const normalizeLineEndings = (content: string) => content.replace(/\r\n/g, '\n');

const splitLines = (content: string) => normalizeLineEndings(content).split('\n');

const stripFrontmatterMarkers = (frontmatter: string) =>
    frontmatter.replace(/^---\n/, '').replace(/\n---\n?$/, '').trim();

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

export const dayOfYearFromDate = (
    year: number,
    month: number,
    day: number,
) => {
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
    return String(
        dayOfYearFromDate(year, date.getMonth() + 1, date.getDate()),
    );
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
const WEEKDAY_LABELS_EN_SHORT = [
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun',
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
    applyMode:
        value?.applyMode ?? DEFAULT_DAY_PLAN_DATE_HEADING_SETTINGS.applyMode,
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
    return WEEKDAY_LABELS_EN_SHORT[weekday];
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
        const [_, month, day] = date.split('-').map(Number);
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

export const posOfSectionWeek7x9 = (
    section: string,
    rows: WeekPlanRow[],
) => {
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
    const normalizedTemplate = template.trim() || DAY_PLAN_DEFAULT_CUSTOM_TEMPLATE;
    let rendered = normalizedTemplate;
    rendered = replaceToken(rendered, '{date}', date);
    rendered = replaceToken(rendered, '{cn}', getChineseWeekdayLabel(date));
    rendered = replaceToken(rendered, '{zh}', getChineseFullWeekdayLabel(date));
    rendered = replaceToken(rendered, '{en}', getEnglishShortWeekdayLabel(date));
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

    const safeRendered = rendered.length > 0 ? rendered : `## ${date} ${getChineseWeekdayLabel(date)}`;
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

export const slotsRecordToArray = (slots: Record<string, unknown> | null | undefined) => {
    const values: string[] = [];
    for (let i = 1; i <= 8; i += 1) {
        const raw = slots?.[String(i)];
        values.push(typeof raw === 'string' ? normalizeSlotTitle(raw) : '');
    }
    return values;
};

export const allSlotsFilled = (slots: string[]) =>
    slots.length === 8 && slots.every((slot) => normalizeSlotTitle(slot).length > 0);

export const parseDayPlanFrontmatterWithMandala = (
    frontmatter: string,
): DayPlanFrontmatterParseResult => {
    const stripped = stripFrontmatterMarkers(frontmatter);
    if (!stripped) {
        return { mandalaEnabled: false, dayPlan: null };
    }
    const mandalaMatch = stripped.match(/^mandala\s*:\s*(.*)$/m);
    const mandalaEnabled = mandalaMatch
        ? stripQuotes(mandalaMatch[1]).toLowerCase() === 'true'
        : false;

    const lines = stripped.split('\n');
    let inPlan = false;
    let inSlots = false;
    let enabled = false;
    let year: number | null = null;
    let dailyOnly3x3 = true;
    let centerDateH2: string | undefined;
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

        if (/^enabled\s*:\s*true\s*$/i.test(trimmed)) {
            enabled = true;
            continue;
        }

        const yearMatch = trimmed.match(/^year\s*:\s*(.*)$/);
        if (yearMatch) {
            const parsedYear = Number(stripQuotes(yearMatch[1]));
            year = Number.isInteger(parsedYear) ? parsedYear : null;
            continue;
        }

        const centerDateMatch = trimmed.match(/^center_date_h2\s*:\s*(.*)$/);
        if (centerDateMatch) {
            centerDateH2 = stripQuotes(centerDateMatch[1]);
            continue;
        }

        const dailyOnlyMatch = trimmed.match(/^daily_only_3x3\s*:\s*(.*)$/);
        if (dailyOnlyMatch) {
            const value = stripQuotes(dailyOnlyMatch[1]).toLowerCase();
            dailyOnly3x3 = value === 'true';
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

    if (!mandalaEnabled || !enabled) {
        return { mandalaEnabled, dayPlan: null };
    }
    if (!year || year < 1900 || year > 9999) {
        return { mandalaEnabled, dayPlan: null };
    }
    return {
        mandalaEnabled,
        dayPlan: {
            enabled: true,
            year,
            daily_only_3x3: dailyOnly3x3,
            center_date_h2: centerDateH2,
            slots: toSlotsRecord(slotsRecordToArray(slots)),
        },
    };
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
