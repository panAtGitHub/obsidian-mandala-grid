import {
    addDaysIsoDate,
    allSlotsFilled,
    dateFromDayOfYear,
    dayOfYearFromDate,
    daysInYear,
    extractDateFromCenterHeading,
    getHotCoreSections,
    hasValidCenterDateHeading,
    isLeapYear,
    isIsoDate,
    normalizeSlotTitle,
    parseDayPlanFrontmatter,
    sectionFromDateInPlanYear,
    shiftHotWindowToCore,
    toSlotsRecord,
    upsertCenterDateHeading,
    upsertSlotHeading,
} from 'src/lib/mandala/day-plan';
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

    it('maps today to section in matching plan year', () => {
        const date = new Date('2026-02-10T08:00:00');
        expect(sectionFromDateInPlanYear(2026, date)).toBe('41');
        expect(sectionFromDateInPlanYear(2027, date)).toBeNull();
    });

    it('extracts date from H2 heading only', () => {
        expect(extractDateFromCenterHeading('## 2026-02-10')).toBe('2026-02-10');
        expect(extractDateFromCenterHeading('2026-02-10')).toBeNull();
        expect(extractDateFromCenterHeading('### 2026-02-10')).toBeNull();
    });

    it('checks section center heading validity', () => {
        expect(hasValidCenterDateHeading('## 2026-02-10\ntext')).toBe(true);
        expect(hasValidCenterDateHeading('### 2026-02-10\ntext')).toBe(false);
        expect(hasValidCenterDateHeading('')).toBe(false);
    });

    it('upserts center heading and keeps body', () => {
        expect(upsertCenterDateHeading('plain body', '2026-02-10')).toBe(
            '## 2026-02-10\nplain body',
        );

        expect(
            upsertCenterDateHeading('## 2025-01-01\nbody', '2026-02-10'),
        ).toBe('## 2026-02-10\nbody');
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

    it('parses daily_only_3x3 as true when missing', () => {
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
        expect(parsed?.daily_only_3x3).toBe(true);
    });

    it('parses daily_only_3x3 as false when explicitly set', () => {
        const frontmatter =
            '---\n' +
            'mandala: true\n' +
            'mandala_plan:\n' +
            '  enabled: true\n' +
            '  year: 2026\n' +
            '  daily_only_3x3: false\n' +
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
        expect(parsed?.daily_only_3x3).toBe(false);
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
});
