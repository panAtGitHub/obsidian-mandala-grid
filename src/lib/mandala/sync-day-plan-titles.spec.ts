import { describe, expect, it } from 'vitest';
import { syncDayPlanTitlesInMarkdown } from 'src/lib/mandala/sync-day-plan-titles';

describe('syncDayPlanTitlesInMarkdown', () => {
    it('syncs all core day-plan slot headings from yaml', () => {
        const markdown =
            '---\n' +
            'mandala: true\n' +
            'mandala_plan:\n' +
            '  enabled: true\n' +
            '  year: 2026\n' +
            '  slots:\n' +
            '    "1": "接收太阳的能量，开心一天"\n' +
            '    "2": "09-12"\n' +
            '    "3": "12-14"\n' +
            '    "4": "14-16"\n' +
            '    "5": "16-18"\n' +
            '    "6": "18-19"\n' +
            '    "7": "19-21"\n' +
            '    "8": "睡觉准备"\n' +
            '---\n' +
            '<!--section: 1-->\n## 2026-02-10\n' +
            '<!--section: 1.1-->\n### old\nbody\n' +
            '<!--section: 1.2-->\ntext\n' +
            '<!--section: 2-->\n## 2026-02-11\n' +
            '<!--section: 2.1-->\n### old2\n';

        const result = syncDayPlanTitlesInMarkdown(markdown);
        expect(result.changed).toBe(true);
        expect(result.markdown).toContain('<!--section: 1.1-->\n### 接收太阳的能量，开心一天\nbody');
        expect(result.markdown).toContain('<!--section: 1.2-->\n### 09-12\ntext');
        expect(result.markdown).toContain('<!--section: 2.1-->\n### 接收太阳的能量，开心一天');
    });

    it('does not create missing children for empty cores', () => {
        const markdown =
            '---\n' +
            'mandala: true\n' +
            'mandala_plan:\n' +
            '  enabled: true\n' +
            '  year: 2026\n' +
            '  slots:\n' +
            '    "1": "接收太阳的能量，开心一天"\n' +
            '    "2": "09-12"\n' +
            '    "3": "12-14"\n' +
            '    "4": "14-16"\n' +
            '    "5": "16-18"\n' +
            '    "6": "18-19"\n' +
            '    "7": "19-21"\n' +
            '    "8": "睡觉准备"\n' +
            '---\n' +
            '<!--section: 1-->\n## 2026-02-10\n' +
            '<!--section: 2-->\n## 2026-02-11\n';

        const result = syncDayPlanTitlesInMarkdown(markdown);
        expect(result.changed).toBe(false);
        expect(result.markdown).toBe(markdown);
    });

    it('does not change markdown when day plan is not enabled', () => {
        const markdown =
            '---\nmandala: true\n---\n<!--section: 1.1-->\n### old\n';
        const result = syncDayPlanTitlesInMarkdown(markdown);
        expect(result.changed).toBe(false);
        expect(result.markdown).toBe(markdown);
    });
});
