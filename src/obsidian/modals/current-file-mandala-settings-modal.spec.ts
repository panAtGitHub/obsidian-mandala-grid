import { describe, expect, it, vi } from 'vitest';
import { stringifyYaml } from 'obsidian';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import { resolveEffectiveMandalaSettings } from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import { refreshCurrentDayPlanDateHeadings } from 'src/obsidian/commands/helpers/refresh-day-plan-date-headings';
import { openCurrentFileMandalaSettingsModal } from './current-file-mandala-settings-modal';

const { opened } = vi.hoisted(() => ({ opened: vi.fn<[unknown], void>() }));
vi.mock('obsidian', async (importOriginal) => ({
    ...(await importOriginal<typeof import('obsidian')>()),
    Modal: class {
        open() {
            opened(this);
        }
        close() {}
    },
}));
vi.mock('src/obsidian/commands/helpers/refresh-day-plan-date-headings', () => ({
    refreshCurrentDayPlanDateHeadings: vi.fn(),
}));
vi.mock(
    'src/stores/view/subscriptions/actions/document/update-frontmatter',
    () => ({ updateFrontmatter: vi.fn() }),
);
vi.mock(
    'src/obsidian/commands/helpers/write-day-plan-slots-to-yaml',
    () => ({}),
);

describe('saving daily file settings', () => {
    it('merges the body choice into the latest YAML and refreshes dates only after a date format change', async () => {
        const record = {
            mandala: true,
            mandala_day_plan: {
                year: 2026,
                enabled: true,
                slots: { '1': '阅读' },
            },
            mandala_cell_format: {
                enabled: true,
                levels: { '2': { body: 'paragraph' } },
            },
        };
        const frontmatter = () => '---\n' + stringifyYaml(record) + '---\n';
        const app = {
            fileManager: {
                processFrontMatter: async (
                    _file: unknown,
                    update: (yaml: typeof record) => void,
                ) => update(record),
            },
            vault: { cachedRead: async () => frontmatter() },
        };
        const view = {
            file: {},
            plugin: { app },
            documentStore: {
                getValue: () => ({ file: { frontmatter: frontmatter() } }),
            },
            getEffectiveMandalaSettings: () =>
                resolveEffectiveMandalaSettings(
                    DEFAULT_SETTINGS(),
                    frontmatter(),
                ),
            ensureCompatibleMandalaMode: vi.fn(),
        };
        openCurrentFileMandalaSettingsModal(view as never);
        const modal = opened.mock.lastCall?.[0] as {
            state: {
                cellFormatDirty: boolean;
                cellFormat: { dayPlanBody: string };
                general: { dayPlanDateHeadingFormat: string };
            };
            save: () => Promise<void>;
        };
        expect(modal.state.cellFormat.dayPlanBody).toBe('paragraph');
        record.mandala_day_plan.slots['1'] = '另一窗格设置的标题';
        modal.state.cellFormatDirty = true;
        modal.state.cellFormat.dayPlanBody = 'ordered-list';
        await modal.save();
        expect(record.mandala_cell_format).toEqual({
            enabled: true,
            levels: { '2': { body: 'paragraph' } },
            dayPlanBody: 'ordered-list',
        });
        expect(record.mandala_day_plan).toEqual({
            year: 2026,
            enabled: true,
            slots: { '1': '另一窗格设置的标题' },
        });
        expect(refreshCurrentDayPlanDateHeadings).not.toHaveBeenCalled();
        modal.state.general.dayPlanDateHeadingFormat = 'en-short';
        await modal.save();
        expect(refreshCurrentDayPlanDateHeadings).toHaveBeenCalledOnce();
    });
});
