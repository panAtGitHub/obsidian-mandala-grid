import {
    addDaysIsoDate,
    allSlotsFilled,
    buildCenterDateHeading,
    DAY_PLAN_DEFAULT_CUSTOM_TEMPLATE,
    DEFAULT_DAY_PLAN_DATE_HEADING_SETTINGS,
    dateFromDayOfYear,
    dayOfYearFromDate,
    daysInYear,
    extractDateFromCenterHeading,
    getChineseFullWeekdayLabel,
    getChineseWeekdayLabel,
    getDayPlanDateHeadingSettings,
    getEnglishCapitalizedWeekdayLabel,
    getEnglishFullWeekdayLabel,
    getEnglishShortWeekdayLabel,
    getHotCoreSections,
    getWeekIndexInPlanYear,
    getStartOfWeekIsoDate,
    getWeekIsoDates,
    hasValidCenterDateHeading,
    isDayPlanDedicatedFrontmatter,
    isDayPlanDedicatedMarkdown,
    isLeapYear,
    isIsoDate,
    mapWeekPlanRows,
    normalizeSlotTitle,
    parseDayPlanFrontmatter,
    parseDayPlanFrontmatterWithMandala,
    posOfSectionWeek7x9,
    sectionFromDateInPlanYear,
    sectionAtCellWeek7x9,
    shiftHotWindowToCore,
    toSlotsRecord,
    upsertCenterDateHeading,
    upsertSlotHeading,
} from 'src/mandala-display/logic/day-plan';
import { describe, expect, it } from 'vitest';

describe('day-plan helpers', () => {
    it('validates iso date correctly', () => {
        expect(isIsoDate('2026-02-10')).toBe(true);
        expect(isIsoDate('2026-02-30')).toBe(false);
        expect(isIsoDate('2026/02/10')).toBe(false);
    });

    it('adds days for iso date', () => {
        expect(addDaysIsoDate('2026-02-10', 1)).toBe('2026-02-11');
        expect(addDaysIsoDate('2026-12-31', 1)).toBe('2027-01-01');
    });

    it('calculates leap years and year days', () => {
        expect(isLeapYear(2024)).toBe(true);
        expect(isLeapYear(2026)).toBe(false);
        expect(daysInYear(2024)).toBe(366);
        expect(daysInYear(2026)).toBe(365);
    });

    it('maps day-of-year and date correctly', () => {
        expect(dayOfYearFromDate(2026, 2, 10)).toBe(41);
        expect(dateFromDayOfYear(2026, 41)).toBe('2026-02-10');
        expect(dateFromDayOfYear(2024, 60)).toBe('2024-02-29');
    });

    it('calculates the week index in plan year from anchor date', () => {
        expect(getWeekIndexInPlanYear('2026-01-01', 'monday')).toBe(1);
        expect(getWeekIndexInPlanYear('2026-04-06', 'monday')).toBe(15);
        expect(getWeekIndexInPlanYear('2026-04-06', 'sunday')).toBe(15);
    });

    it('maps today to section in matching plan year', () => {
        const date = new Date('2026-02-10T08:00:00');
        expect(sectionFromDateInPlanYear(2026, date)).toBe('41');
        expect(sectionFromDateInPlanYear(2027, date)).toBeNull();
    });

    it('extracts date from H2 heading only', () => {
        expect(extractDateFromCenterHeading('## 2026-02-10')).toBe('2026-02-10');
        expect(extractDateFromCenterHeading('## 2026-02-10 二')).toBe(
            '2026-02-10',
        );
        expect(extractDateFromCenterHeading('2026-02-10')).toBeNull();
        expect(extractDateFromCenterHeading('### 2026-02-10')).toBeNull();
    });

    it('checks section center heading validity', () => {
        expect(hasValidCenterDateHeading('## 2026-02-10\ntext')).toBe(true);
        expect(hasValidCenterDateHeading('## 2026-02-10 二\ntext')).toBe(true);
        expect(hasValidCenterDateHeading('### 2026-02-10\ntext')).toBe(false);
        expect(hasValidCenterDateHeading('')).toBe(false);
    });

    it('upserts center heading and keeps body', () => {
        expect(upsertCenterDateHeading('plain body', '2026-02-10')).toBe(
            '## 2026-02-10 二\nplain body',
        );

        expect(
            upsertCenterDateHeading('## 2025-01-01\nbody', '2026-02-10'),
        ).toBe('## 2026-02-10 二\nbody');
    });

    it('builds center heading with chinese weekday', () => {
        expect(getChineseWeekdayLabel('2026-03-16')).toBe('一');
        expect(getChineseFullWeekdayLabel('2026-03-16')).toBe('周一');
        expect(getEnglishShortWeekdayLabel('2026-03-16')).toBe('mon');
        expect(getEnglishCapitalizedWeekdayLabel('2026-03-16')).toBe('Mon');
        expect(getEnglishFullWeekdayLabel('2026-03-16')).toBe('Monday');
        expect(buildCenterDateHeading('2026-03-16')).toBe('## 2026-03-16 一');
    });

    it('supports all preset heading formats', () => {
        expect(
            buildCenterDateHeading('2026-03-16', {
                format: 'date-only',
            }),
        ).toBe('## 2026-03-16');
        expect(
            buildCenterDateHeading('2026-03-16', {
                format: 'zh-full',
            }),
        ).toBe('## 2026-03-16 周一');
        expect(
            buildCenterDateHeading('2026-03-16', {
                format: 'zh-short',
            }),
        ).toBe('## 2026-03-16 一');
        expect(
            buildCenterDateHeading('2026-03-16', {
                format: 'en-short',
            }),
        ).toBe('## 2026-03-16 mon');
    });

    it('renders custom templates and falls back safely', () => {
        expect(
            buildCenterDateHeading('2026-03-16', {
                format: 'custom',
                customTemplate: '## {date} {zh} {en_cap} {en_full}',
            }),
        ).toBe('## 2026-03-16 周一 Mon Monday');
        expect(
            buildCenterDateHeading('2026-03-16', {
                format: 'custom',
                customTemplate: '{date} {cn}',
            }),
        ).toBe('## 2026-03-16 一');
        expect(
            buildCenterDateHeading('2026-03-16', {
                format: 'custom',
                customTemplate: '',
            }),
        ).toBe('## 2026-03-16 一');
        expect(
            buildCenterDateHeading('2026-03-16', {
                format: 'custom',
                customTemplate: '## {zh}',
            }),
        ).toBe('## 2026-03-16 周一');
    });

    it('normalizes missing heading settings with defaults', () => {
        expect(getDayPlanDateHeadingSettings(null)).toEqual(
            DEFAULT_DAY_PLAN_DATE_HEADING_SETTINGS,
        );
        expect(
            getDayPlanDateHeadingSettings({
                format: 'custom',
            }),
        ).toEqual({
            format: 'custom',
            customTemplate: DAY_PLAN_DEFAULT_CUSTOM_TEMPLATE,
            applyMode: 'manual',
        });
        expect(
            getDayPlanDateHeadingSettings({
                applyMode: 'immediate',
            }).applyMode,
        ).toBe('manual');
    });

    it('upserts slot heading and keeps body', () => {
        expect(upsertSlotHeading('body', '09-12')).toBe('### 09-12\nbody');
        expect(upsertSlotHeading('### old\nbody', '12-14')).toBe(
            '### 12-14\nbody',
        );
    });

    it('normalizes slot titles and checks filled state', () => {
        expect(normalizeSlotTitle('### 19-21')).toBe('19-21');
        expect(
            allSlotsFilled(['1', '2', '3', '4', '5', '6', '7', '8']),
        ).toBe(true);
        expect(
            allSlotsFilled(['1', '2', '3', '4', '5', '6', '7', '']),
        ).toBe(false);
    });

    it('converts slot array to record', () => {
        expect(toSlotsRecord(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])).toEqual({
            '1': 'a',
            '2': 'b',
            '3': 'c',
            '4': 'd',
            '5': 'e',
            '6': 'f',
            '7': 'g',
            '8': 'h',
        });
    });

    it('parses day-plan frontmatter without requiring daily_only_3x3', () => {
        const frontmatter =
            '---\n' +
            'mandala: true\n' +
            'mandala_plan:\n' +
            '  enabled: true\n' +
            '  year: 2026\n' +
            '  slots:\n' +
            '    "1": "a"\n' +
            '    "2": "b"\n' +
            '    "3": "c"\n' +
            '    "4": "d"\n' +
            '    "5": "e"\n' +
            '    "6": "f"\n' +
            '    "7": "g"\n' +
            '    "8": "h"\n' +
            '---\n';
        const parsed = parseDayPlanFrontmatter(frontmatter);
        expect(parsed).not.toBeNull();
        expect(parsed?.year).toBe(2026);
    });

    it('requires mandala: true before enabling day-plan parsing', () => {
        const frontmatter =
            '---\n' +
            'mandala: false\n' +
            'mandala_plan:\n' +
            '  enabled: true\n' +
            '  year: 2026\n' +
            '  slots:\n' +
            '    "1": "a"\n' +
            '    "2": "b"\n' +
            '    "3": "c"\n' +
            '    "4": "d"\n' +
            '    "5": "e"\n' +
            '    "6": "f"\n' +
            '    "7": "g"\n' +
            '    "8": "h"\n' +
            '---\n';
        const parsed = parseDayPlanFrontmatter(frontmatter);
        expect(parsed).toBeNull();
    });

    it('parses day-plan even when mandala is after mandala_plan', () => {
        const frontmatter =
            '---\n' +
            'mandala_plan:\n' +
            '  enabled: true\n' +
            '  year: 2026\n' +
            '  slots:\n' +
            '    "1": "a"\n' +
            '    "2": "b"\n' +
            '    "3": "c"\n' +
            '    "4": "d"\n' +
            '    "5": "e"\n' +
            '    "6": "f"\n' +
            '    "7": "g"\n' +
            '    "8": "h"\n' +
            'mandala: true\n' +
            '---\n';
        const parsed = parseDayPlanFrontmatter(frontmatter);
        expect(parsed).not.toBeNull();
        expect(parsed?.year).toBe(2026);
    });

    it('strictly detects day-plan dedicated files from frontmatter', () => {
        const valid =
            '---\n' +
            'mandala: true\n' +
            'mandala_plan:\n' +
            '  enabled: true\n' +
            '  year: 2026\n' +
            '  slots:\n' +
            '    "1": "a"\n' +
            '    "2": "b"\n' +
            '    "3": "c"\n' +
            '    "4": "d"\n' +
            '    "5": "e"\n' +
            '    "6": "f"\n' +
            '    "7": "g"\n' +
            '    "8": "h"\n' +
            '---\n';
        const noMandala = valid.replace('mandala: true\n', '');
        const notEnabled = valid.replace('enabled: true', 'enabled: false');
        expect(isDayPlanDedicatedFrontmatter(valid)).toBe(true);
        expect(isDayPlanDedicatedFrontmatter(noMandala)).toBe(false);
        expect(isDayPlanDedicatedFrontmatter(notEnabled)).toBe(false);
        expect(isDayPlanDedicatedFrontmatter('')).toBe(false);
    });

    it('strictly detects day-plan dedicated files from markdown', () => {
        const validMarkdown =
            '---\n' +
            'mandala: true\n' +
            'mandala_plan:\n' +
            '  enabled: true\n' +
            '  year: 2026\n' +
            '  slots:\n' +
            '    "1": "a"\n' +
            '    "2": "b"\n' +
            '    "3": "c"\n' +
            '    "4": "d"\n' +
            '    "5": "e"\n' +
            '    "6": "f"\n' +
            '    "7": "g"\n' +
            '    "8": "h"\n' +
            '---\n' +
            '\nbody\n';
        expect(isDayPlanDedicatedMarkdown(validMarkdown)).toBe(true);
        expect(isDayPlanDedicatedMarkdown('# no frontmatter')).toBe(false);
    });

    it('reuses cached frontmatter parsing for identical inputs', () => {
        const frontmatter =
            '---\n' +
            'mandala: true\n' +
            'mandala_plan:\n' +
            '  enabled: true\n' +
            '  year: 2026\n' +
            '---\n';

        const first = parseDayPlanFrontmatterWithMandala(frontmatter);
        const second = parseDayPlanFrontmatterWithMandala(frontmatter);
        const changed = parseDayPlanFrontmatterWithMandala(
            frontmatter.replace('2026', '2027'),
        );

        expect(second).toBe(first);
        expect(changed).not.toBe(first);
    });

    it('builds hot core sections from week window', () => {
        const sections = getHotCoreSections(2026, new Date('2026-02-10T08:00:00'));
        expect(sections.has('41')).toBe(true);
        expect(sections.has('43')).toBe(true);
        expect(sections.has('45')).toBe(true);
    });

    it('shifts hot window around target core', () => {
        const sections = shiftHotWindowToCore(2026, '120');
        expect(sections.has('120')).toBe(true);
        expect(sections.has('119')).toBe(true);
    });

    it('calculates week start and week dates for monday/sunday', () => {
        expect(getStartOfWeekIsoDate('2026-03-18', 'monday')).toBe(
            '2026-03-16',
        );
        expect(getStartOfWeekIsoDate('2026-03-18', 'sunday')).toBe(
            '2026-03-15',
        );
        expect(getWeekIsoDates('2026-03-18', 'monday')).toEqual([
            '2026-03-16',
            '2026-03-17',
            '2026-03-18',
            '2026-03-19',
            '2026-03-20',
            '2026-03-21',
            '2026-03-22',
        ]);
    });

    it('maps week rows and cells for in-year and cross-year dates', () => {
        const rows = mapWeekPlanRows(2026, '2026-03-18', 'monday');
        expect(rows[0]).toMatchObject({
            date: '2026-03-16',
            coreSection: '75',
            inPlanYear: true,
        });
        expect(sectionAtCellWeek7x9(0, 0, rows)).toBe('75');
        expect(sectionAtCellWeek7x9(0, 3, rows)).toBe('75.3');
        expect(posOfSectionWeek7x9('75.3', rows)).toEqual({ row: 0, col: 3 });

        const crossYearRows = mapWeekPlanRows(2026, '2026-12-31', 'monday');
        expect(crossYearRows[5]?.inPlanYear).toBe(false);
        expect(sectionAtCellWeek7x9(5, 0, crossYearRows)).toBeNull();
    });
});
