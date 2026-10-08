import type MandalaGrid from 'src/main';
import { TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import { describe, expect, it, vi } from 'vitest';
import {
    refreshCurrentDayPlanDateHeadings,
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
        expect(result.markdown).toContain(
            '<!--section: 1-->\n## 2026-03-16 周一\nbody',
        );
        expect(result.markdown).toContain(
            '<!--section: 2-->\n## 2026-03-17 周二\n',
        );
    });

    it('preserves markdown when the document is not a day plan', () => {
        const markdown =
            '---\nmandala: true\n---\n<!--section: 1-->\n## 2026-03-16\n';

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

it('refreshes the supplied file even if another tab is active, without persisting a derived date', async () => {
    const target = new TFile();
    const other = new TFile();
    const markdown =
        '---\nmandala: true\nmandala_day_plan:\n  enabled: true\n  year: 2026\n  date_heading:\n    format: zh-full\n---\n<!--section: 1-->\n## 2026-01-01 四\nKeep body\n';
    const read = vi.fn().mockResolvedValue(markdown);
    const modify = vi.fn();
    const processFrontMatter = vi.fn();
    const getActiveFile = vi.fn(() => other);
    const plugin = {
        settings: { getValue: DEFAULT_SETTINGS },
        app: {
            workspace: { getActiveFile },
            vault: { read, modify },
            fileManager: { processFrontMatter },
        },
    } as unknown as MandalaGrid;
    await refreshCurrentDayPlanDateHeadings(plugin, {
        file: target,
        notify: false,
    });
    expect(getActiveFile).not.toHaveBeenCalled();
    expect(read).toHaveBeenCalledWith(target);
    expect(modify).toHaveBeenCalledWith(
        target,
        expect.stringContaining('## 2026-01-01 周四\nKeep body'),
    );
    expect(processFrontMatter).not.toHaveBeenCalled();
});
