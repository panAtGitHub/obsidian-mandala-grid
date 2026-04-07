import { describe, expect, it } from 'vitest';
import {
    refreshDayPlanDateHeadingsInMarkdown,
} from 'src/obsidian/commands/helpers/refresh-day-plan-date-headings';
import { getDayPlanDateHeadingSettings } from 'src/mandala-display/logic/day-plan';

describe('refreshDayPlanDateHeadingsInMarkdown', () => {
    it('refreshes all core date headings using current settings', () => {
        const markdown =
            '---\n' +
            'mandala: true\n' +
            'mandala_plan:\n' +
            '  enabled: true\n' +
            '  year: 2026\n' +
            '---\n' +
            '<!--section: 1-->\n## 2026-03-16 一\nbody\n' +
            '<!--section: 1.1-->\n### slot\n' +
            '<!--section: 2-->\n## 2026-03-17 二\n';

        const result = refreshDayPlanDateHeadingsInMarkdown(
            markdown,
            getDayPlanDateHeadingSettings({
                format: 'zh-full',
            }),
        );

        expect(result.changed).toBe(true);
        expect(result.markdown).toContain('<!--section: 1-->\n## 2026-03-16 周一\nbody');
        expect(result.markdown).toContain('<!--section: 2-->\n## 2026-03-17 周二\n');
    });

    it('preserves markdown when the document is not a day plan', () => {
        const markdown = '---\nmandala: true\n---\n<!--section: 1-->\n## 2026-03-16\n';

        const result = refreshDayPlanDateHeadingsInMarkdown(
            markdown,
            getDayPlanDateHeadingSettings({
                format: 'en-short',
            }),
        );

        expect(result.changed).toBe(false);
        expect(result.markdown).toBe(markdown);
    });
});
