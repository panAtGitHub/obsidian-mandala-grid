import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import {
    buildNewFileMandalaFrontmatterSettings,
    parseMandalaFrontmatterSettings,
    resolveEffectiveMandalaSettings,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';

describe('mandala-frontmatter-settings', () => {
    test('parses valid mandala_settings fields from frontmatter', () => {
        const parsed = parseMandalaFrontmatterSettings(
            [
                '---',
                'mandala_settings:',
                '  view:',
                '    enable9x9View: false',
                '  general:',
                '    weekPlanEnabled: false',
                '    dayPlanDateHeadingFormat: custom',
                '    dayPlanDateHeadingCustomTemplate: "## {date}"',
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
                '  general:',
                '    weekPlanEnabled: false',
                '---',
            ].join('\n'),
        );

        expect(effective.view.enable9x9View).toBe(false);
        expect(effective.view.enableNx9View).toBe(
            globalSettings.view.enableNx9View,
        );
        expect(effective.view.coreSectionMax).toBe('unlimited');
        expect(effective.view.subgridMaxDepth).toBe(2);
        expect(effective.general.weekPlanEnabled).toBe(false);
    });

    test('uses depth 2 for new day-plan files', () => {
        const built = buildNewFileMandalaFrontmatterSettings(
            DEFAULT_SETTINGS(),
            {
                dayPlan: true,
            },
        );

        expect(built.view?.enable9x9View).toBe(false);
        expect(built.view?.subgridMaxDepth).toBe(2);
    });

    test('maps legacy daily_only_3x3 to depth 2 when no view override exists', () => {
        const effective = resolveEffectiveMandalaSettings(
            DEFAULT_SETTINGS(),
            [
                '---',
                'mandala: true',
                'mandala_plan:',
                '  enabled: true',
                '  year: 2026',
                '  daily_only_3x3: true',
                '---',
            ].join('\n'),
        );

        expect(effective.view.subgridMaxDepth).toBe(2);
    });
});

test('new day-plan settings ignore legacy general and global feature gates', () => {
    const settings = DEFAULT_SETTINGS();
    settings.general.dayPlanEnabled = false;
    settings.general.weekStart = 'sunday';
    const effective = resolveEffectiveMandalaSettings(
        settings,
        `mandala: true
mandala_settings:
  general:
    weekStart: sunday
    dayPlanEnabled: false
mandala_day_plan:
  enabled: true
  year: 2026
  week_view:
    enabled: false
  date_heading:
    format: date-only
`,
    );
    expect(effective.general.dayPlanEnabled).toBe(true);
    expect(effective.general.weekPlanEnabled).toBe(false);
    expect(effective.general.weekStart).toBe('monday');
    expect(effective.general.dayPlanDateHeadingFormat).toBe('date-only');
});
