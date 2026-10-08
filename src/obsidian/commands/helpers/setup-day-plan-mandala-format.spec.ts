import { applyDayPlanSlotTitles } from 'src/obsidian/commands/helpers/apply-day-plan-slot-titles';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile, parseYaml } from 'obsidian';
import type MandalaGrid from 'src/main';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { setupDayPlanMandalaFormat } from './setup-day-plan-mandala-format';

vi.mock('src/view/view', () => ({ MANDALA_VIEW_TYPE: 'mandala-view' }));
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

const mocks = vi.hoisted(() => ({
    year: vi.fn(),
    display: vi.fn(),
    daily: vi.fn(),
    slots: vi.fn(),
    leaf: vi.fn(),
}));
vi.mock('src/obsidian/modals/day-plan-setup-modal', () => ({
    openDayPlanYearInputModal: mocks.year,
    openDayPlanDisplayOptionsModal: mocks.display,
    openDayPlanDailySetupModal: mocks.daily,
    openDayPlanSlotsInputModal: mocks.slots,
}));
vi.mock('src/obsidian/events/workspace/helpers/get-leaf-of-file', () => ({
    getLeafOfFile: mocks.leaf,
}));

const fixture = (initial: string) => {
    let markdown = initial;
    const file = Object.assign(new TFile(), {
        path: 'plan.md',
        extension: 'md',
    });
    const process = vi.fn(
        async (_file: TFile, update: (raw: string) => string) => {
            markdown = update(markdown);
            return markdown;
        },
    );
    const modify = vi.fn();
    const settings = DEFAULT_SETTINGS();
    const plugin = {
        settings: { getValue: () => settings },
        app: { vault: { read: vi.fn(async () => markdown), process, modify } },
    } as unknown as MandalaGrid;
    return {
        plugin,
        file,
        process,
        modify,
        markdown: () => markdown,
        change: (value: string) => {
            markdown = value;
        },
    };
};

const existing = `---
mandala: true
id: user-id
mandala_settings:
  general:
    weekStart: sunday
mandala_plan:
  enabled: true
  year: 2026
  center_date_h2: "## 2026-01-01 四"
  slots:
    "1": Original
---
<!--section: 1-->
## 2026-01-01 四
<!--section: 1.1-->
### Original
Keep this body
`;

beforeEach(() => {
    vi.clearAllMocks();
    mocks.year.mockResolvedValue({ action: 'next', value: 2026 });
    mocks.display.mockResolvedValue({
        action: 'next',
        value: { weekStart: 'monday', dateHeadingFormat: 'zh-short' },
    });
    mocks.daily.mockResolvedValue({
        action: 'next',
        value: { slotsSource: 'recommended', templateIndex: null },
    });
    mocks.leaf.mockReturnValue({ view: { setViewData: vi.fn() } });
});

describe('day-plan setup persistence', () => {
    it('preserves original note content when creating the first year', async () => {
        const f = fixture('# Original note\nKeep my content');
        expect(await setupDayPlanMandalaFormat(f.plugin, f.file)).toBe(true);
        expect(f.markdown()).toContain('# Original note\nKeep my content');
        expect(f.markdown()).toContain('## 2026-01-01 四');
    });
    it('creates a complete year with the new dedicated configuration in one write', async () => {
        const f = fixture(
            '---\nmandala: true\n---\n<!--section: 1-->\n<!--section: 1.1-->\n',
        );
        expect(await setupDayPlanMandalaFormat(f.plugin, f.file)).toBe(true);
        expect(f.markdown()).toContain('mandala_day_plan:');
        expect(f.markdown()).not.toContain('mandala_plan:');
        expect(f.markdown()).not.toContain('dayPlanEnabled:');
        expect(f.markdown()).not.toContain('center_date_h2:');
        expect(f.markdown()).toContain('<!--section: 365-->\n## 2026-12-31 四');
        expect(f.markdown()).toContain(
            '<!--section: 1.1-->\n### 接收太阳的能量，开心一天',
        );
        expect(f.process).toHaveBeenCalledTimes(1);
    });
    it('does not convert or write an existing file when the wizard is canceled', async () => {
        const f = fixture('# Ordinary note\nUser content');
        mocks.year.mockResolvedValue({ action: 'cancel' });
        expect(await setupDayPlanMandalaFormat(f.plugin, f.file)).toBe(false);
        expect(f.markdown()).toBe('# Ordinary note\nUser content');
        expect(f.process).not.toHaveBeenCalled();
        expect(f.modify).not.toHaveBeenCalled();
    });

    it('migrates legacy configuration without rewriting existing daily content', async () => {
        const f = fixture(existing);
        expect(await setupDayPlanMandalaFormat(f.plugin, f.file)).toBe(true);
        expect(extractFrontmatter(f.markdown()).body).toBe(
            extractFrontmatter(existing).body,
        );
        const root: unknown = parseYaml(
            extractFrontmatter(f.markdown())
                .frontmatter.replace(/^---\n/, '')
                .replace(/\n---\n?$/, ''),
        );
        expect(root).toMatchObject({
            id: 'user-id',
            mandala_day_plan: {
                enabled: true,
                year: 2026,
                date_heading: { format: 'zh-short' },
            },
        });
        expect(root).not.toHaveProperty('mandala_plan');
        expect(root).not.toHaveProperty('mandala_settings.general');
        expect(root).not.toHaveProperty('mandala_day_plan.center_date_h2');
        expect(f.process).toHaveBeenCalledTimes(1);
    });

    it('preserves edits made while the wizard is open', async () => {
        const f = fixture(existing);
        mocks.daily.mockImplementation(async () => {
            f.change(existing + 'New user content\n');
            return {
                action: 'next',
                value: { slotsSource: 'recommended', templateIndex: null },
            };
        });
        expect(await setupDayPlanMandalaFormat(f.plugin, f.file)).toBe(false);
        expect(f.markdown()).toBe(existing + 'New user content\n');
        expect(f.process).not.toHaveBeenCalled();
    });
});

describe('applyDayPlanSlotTitles', () => {
    it('seeds slot headings for the first core and the target day core', () => {
        const body = [
            '<!--section: 1-->',
            '## 2027-01-01 周五',
            '<!--section: 2-->',
            '## 2027-01-02 周六',
            '',
        ].join('\n');

        const next = applyDayPlanSlotTitles(
            body,
            ['1', '2'],
            [
                '接收太阳的能量，开心一天',
                '09-12',
                '12-14',
                '14-16',
                '16-18',
                '18-19',
                '19-21',
                '睡觉准备',
            ],
        );

        expect(next).toContain(
            '<!--section: 1.1-->\n### 接收太阳的能量，开心一天',
        );
        expect(next).toContain('<!--section: 1.8-->\n### 睡觉准备');
        expect(next).toContain(
            '<!--section: 2.1-->\n### 接收太阳的能量，开心一天',
        );
        expect(next).toContain('<!--section: 2.8-->\n### 睡觉准备');
    });
});
