import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type MandalaGrid from 'src/main';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import { syncEditedDayPlanTitlesByUserChoice } from './toggle-file-view-type';
import { openDayPlanConfirmModal } from 'src/obsidian/modals/day-plan-setup-modal';

vi.mock('src/view/view', () => ({ MANDALA_VIEW_TYPE: 'mandala-view' }));
vi.mock('src/obsidian/events/workspace/helpers/get-leaf-of-file', () => ({
    getLeafOfFile: vi.fn(),
}));
vi.mock('src/obsidian/events/workspace/effects/open-file', () => ({
    openFile: vi.fn(),
}));
vi.mock(
    'src/obsidian/events/workspace/effects/toggle-obsidian-view-type',
    () => ({ toggleObsidianViewType: vi.fn() }),
);
vi.mock('src/mandala-settings/state/actions/set-view-type', () => ({
    setViewType: vi.fn(),
}));
vi.mock('src/obsidian/modals/day-plan-setup-modal', () => ({
    openDayPlanConfirmModal: vi.fn(),
}));
vi.mock('src/obsidian/modals/mandala-conversion-modal', () => ({
    openMandalaConversionModal: vi.fn(),
}));

const plugin = {
    settings: { getValue: DEFAULT_SETTINGS },
} as unknown as MandalaGrid;
const markdown = `---
mandala: true
mandala_day_plan:
  enabled: true
  year: 2026
  slots:
${Array.from({ length: 8 }, (_, i) => `    "${i + 1}": Old ${i + 1}`).join('\n')}
---
<!--section: 1-->
## 2026-01-01 四
${Array.from({ length: 8 }, (_, i) => `<!--section: 1.${i + 1}-->\n### Past ${i + 1}\nPast body`).join('\n')}
<!--section: 2-->
## 2026-01-02 五
${Array.from({ length: 8 }, (_, i) => `<!--section: 2.${i + 1}-->\n### Edited ${i + 1}\nToday body`).join('\n')}
<!--section: 3-->
## 2026-01-03 六
<!--section: 3.1-->
### Old 1
Future body
`;

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 2));
    vi.clearAllMocks();
});
afterEach(() => {
    vi.useRealTimers();
});

describe('directly edited daily headings', () => {
    it('saves the edited headings as template and updates today and later dates', async () => {
        vi.mocked(openDayPlanConfirmModal).mockResolvedValue(true);
        const next = await syncEditedDayPlanTitlesByUserChoice(
            plugin,
            markdown,
            '2.1',
        );
        expect(next).toContain('### Edited 1\nFuture body');
        expect(next).toContain('### Past 1\nPast body');
        expect(next).toContain('### Edited 1\nToday body');
        expect(next).toMatch(/"?1"?: Edited 1/);
        expect(openDayPlanConfirmModal).toHaveBeenCalledWith(
            plugin,
            expect.objectContaining({
                confirmText: '保存为模板',
                cancelText: '暂不更新',
            }),
        );
    });
    it('keeps hand edited content and the original template when dismissed', async () => {
        vi.mocked(openDayPlanConfirmModal).mockResolvedValue(false);
        expect(
            await syncEditedDayPlanTitlesByUserChoice(plugin, markdown, '2.1'),
        ).toBe(markdown);
    });
    it('does not prompt merely because unrelated historical headings differ', async () => {
        const matching = markdown.replace(/Edited ([1-8])/g, 'Old $1');
        expect(
            await syncEditedDayPlanTitlesByUserChoice(plugin, matching, '2.1'),
        ).toBe(matching);
        expect(openDayPlanConfirmModal).not.toHaveBeenCalled();
    });
    it('does not capture an incomplete daily grid as the template', async () => {
        expect(
            await syncEditedDayPlanTitlesByUserChoice(plugin, markdown, '3'),
        ).toBe(markdown);
        expect(openDayPlanConfirmModal).not.toHaveBeenCalled();
    });
});
