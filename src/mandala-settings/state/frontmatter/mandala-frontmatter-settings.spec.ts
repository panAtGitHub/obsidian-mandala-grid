import { describe, expect, test, vi } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import {
    parseMandalaFrontmatterSettings,
    resolveEffectiveMandalaSettings,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';

vi.mock('obsidian', () => ({
    parseYaml: (input: string) => {
        if (input.includes('enable9x9View: false')) {
            return {
                mandala_settings: {
                    view: {
                        enable9x9View: false,
                        coreSectionMax: null,
                        subgridMaxDepth: 2,
                    },
                    general: {
                        weekPlanEnabled: false,
                        dayPlanDateHeadingFormat: 'custom',
                        dayPlanDateHeadingCustomTemplate: '## {date}',
                    },
                },
            };
        }
        if (input.includes('coreSectionMax:')) {
            return {
                mandala_settings: {
                    view: {
                        coreSectionMax: null,
                        subgridMaxDepth: 2,
                    },
                },
            };
        }
        if (input.includes('enable9x9View: maybe')) {
            return {
                mandala_settings: {
                    view: {
                        enable9x9View: 'maybe',
                    },
                    general: {
                        weekStart: 'fri',
                    },
                },
            };
        }
        return {};
    },
}));

describe('mandala-frontmatter-settings', () => {
    test('parses valid mandala_settings fields from frontmatter', () => {
        const parsed = parseMandalaFrontmatterSettings(
            [
                '---',
                'mandala_settings:',
                '  view:',
                '    enable9x9View: false',
                '---',
            ].join('\n'),
        );

        expect(parsed.view?.enable9x9View).toBe(false);
        expect(parsed.general?.weekPlanEnabled).toBe(false);
        expect(parsed.general?.dayPlanDateHeadingFormat).toBe('custom');
        expect(parsed.general?.dayPlanDateHeadingCustomTemplate).toBe(
            '## {date}',
        );
    });

    test('ignores invalid field values', () => {
        const parsed = parseMandalaFrontmatterSettings(
            [
                '---',
                'mandala_settings:',
                '  view:',
                '    enable9x9View: maybe',
                '---',
            ].join('\n'),
        );

        expect(parsed.view?.enable9x9View).toBeUndefined();
        expect(parsed.general?.weekStart).toBeUndefined();
    });

    test('resolves effective settings by merging frontmatter overrides with global defaults', () => {
        const globalSettings = DEFAULT_SETTINGS();
        globalSettings.view.coreSectionMax = 1;
        const effective = resolveEffectiveMandalaSettings(
            globalSettings,
            [
                '---',
                'mandala_settings:',
                '  view:',
                '    enable9x9View: false',
                '    coreSectionMax:',
                '    subgridMaxDepth: 2',
                '---',
            ].join('\n'),
        );

        expect(effective.view.enable9x9View).toBe(false);
        expect(effective.view.enableNx9View).toBe(
            globalSettings.view.enableNx9View,
        );
        expect(effective.view.coreSectionMax).toBeNull();
        expect(effective.view.subgridMaxDepth).toBe(2);
        expect(effective.general.weekPlanEnabled).toBe(false);
        expect(effective.general.dayPlanDateHeadingApplyMode).toBe(
            globalSettings.general.dayPlanDateHeadingApplyMode,
        );
    });
});
