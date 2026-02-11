import { describe, expect, it } from 'vitest';
import {
    isMandalaFrontmatterEnabled,
    resolveMandalaProfileActivation,
} from 'src/lib/mandala/mandala-profile';

describe('mandala profile activation', () => {
    it('detects mandala frontmatter', () => {
        expect(isMandalaFrontmatterEnabled('---\nmandala: true\n---\n')).toBe(
            true,
        );
        expect(
            isMandalaFrontmatterEnabled('---\nmandala: false\n---\n'),
        ).toBe(false);
    });

    it('resolves day-plan activation for matching year', () => {
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
        const result = resolveMandalaProfileActivation(
            frontmatter,
            new Date('2026-02-10T08:00:00'),
        );
        expect(result.kind).toBe('day-plan');
        expect(result.targetSection).toBe('41');
        expect(result.notice).toBeNull();
        expect(result.hotCoreSections.size).toBeGreaterThan(0);
    });

    it('falls back to section 1 for day-plan year mismatch', () => {
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
        const result = resolveMandalaProfileActivation(
            frontmatter,
            new Date('2027-02-10T08:00:00'),
        );
        expect(result.kind).toBe('day-plan');
        expect(result.targetSection).toBe('1');
        expect(result.notice).toBe('年份错误。');
        expect(result.hotCoreSections.has('1')).toBe(true);
    });

    it('resolves generic mandala when day-plan not enabled', () => {
        const frontmatter = '---\nmandala: true\nfoo: bar\n---\n';
        const result = resolveMandalaProfileActivation(frontmatter);
        expect(result.kind).toBe('generic');
        expect(result.targetSection).toBeNull();
        expect(result.notice).toBeNull();
    });
});
