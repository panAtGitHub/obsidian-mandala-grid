import { Setting } from 'obsidian';
import { lang } from 'src/lang/lang';
import type {
    DayPlanDateHeadingApplyMode,
    DayPlanDateHeadingFormat,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';
import type { EffectiveMandalaSettings } from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';

export type MandalaCoreSettingsState = EffectiveMandalaSettings;

export type MandalaCoreSettingsHandlers = {
    setEnable9x9View: (enabled: boolean) => void;
    setEnableNx9View: (enabled: boolean) => void;
    setEnable3x3InfiniteNesting: (enabled: boolean) => void;
    setDayPlanEnabled: (enabled: boolean) => void;
    setWeekPlanEnabled: (enabled: boolean) => void;
    setWeekPlanCompactMode: (enabled: boolean) => void;
    setWeekStart: (weekStart: WeekStart) => void;
    setDayPlanDateHeadingFormat: (format: DayPlanDateHeadingFormat) => void;
    setDayPlanDateHeadingCustomTemplate: (template: string) => void;
    setDayPlanDateHeadingApplyMode: (mode: DayPlanDateHeadingApplyMode) => void;
};

type RenderMandalaCoreSettingsOptions = {
    parentEl: HTMLElement;
    state: MandalaCoreSettingsState;
    handlers: MandalaCoreSettingsHandlers;
    createGroupContainer: (
        parentEl: HTMLElement,
        title: string,
        group: 'global-view' | 'time-plan',
    ) => HTMLElement;
    showDescriptions: boolean;
    texts?: Partial<{
        sectionGlobalView: string;
        sectionTimePlan: string;
        enable9x9View: string;
        enableNx9View: string;
        enable3x3InfiniteNesting: string;
        dayPlanEnabled: string;
        weekPlanEnabled: string;
        weekPlanCompactMode: string;
        weekStart: string;
        dayPlanDateHeadingFormat: string;
        dayPlanDateHeadingCustomTemplate: string;
        dayPlanDateHeadingApplyMode: string;
    }>;
};

const createMaybeDescriptionSetting = (
    setting: Setting,
    description: string | null,
    showDescriptions: boolean,
) => {
    if (showDescriptions && description) {
        setting.setDesc(description);
    }
    return setting;
};

export const renderMandalaCoreSettings = ({
    parentEl,
    state,
    handlers,
    createGroupContainer,
    showDescriptions,
    texts,
}: RenderMandalaCoreSettingsOptions) => {
    const globalViewContainer = createGroupContainer(
        parentEl,
        texts?.sectionGlobalView ?? lang.settings_section_global_view,
        'global-view',
    );
    const timePlanContainer = createGroupContainer(
        parentEl,
        texts?.sectionTimePlan ?? lang.settings_section_time_plan,
        'time-plan',
    );

    new Setting(globalViewContainer)
        .setName(texts?.enable9x9View ?? lang.settings_global_enable_9x9_view)
        .addToggle((toggle) =>
            toggle
                .setValue(state.view.enable9x9View)
                .onChange((enabled) => handlers.setEnable9x9View(enabled)),
        );

    new Setting(globalViewContainer)
        .setName(texts?.enableNx9View ?? lang.settings_global_enable_nx9_view)
        .addToggle((toggle) =>
            toggle
                .setValue(state.view.enableNx9View)
                .onChange((enabled) => handlers.setEnableNx9View(enabled)),
        );

    createMaybeDescriptionSetting(
        new Setting(globalViewContainer).setName(
            texts?.enable3x3InfiniteNesting ??
                lang.settings_global_enable_3x3_infinite,
        ),
        lang.settings_global_enable_3x3_infinite_desc,
        showDescriptions,
    ).addToggle((toggle) =>
        toggle
            .setValue(state.view.enable3x3InfiniteNesting)
            .onChange((enabled) => handlers.setEnable3x3InfiniteNesting(enabled)),
    );

    createMaybeDescriptionSetting(
        new Setting(timePlanContainer).setName(
            texts?.dayPlanEnabled ?? lang.settings_general_day_plan_enabled,
        ),
        lang.settings_general_day_plan_enabled_desc,
        showDescriptions,
    ).addToggle((toggle) =>
        toggle
            .setValue(state.general.dayPlanEnabled)
            .onChange((enabled) => handlers.setDayPlanEnabled(enabled)),
    );

    createMaybeDescriptionSetting(
        new Setting(timePlanContainer).setName(
            texts?.weekPlanEnabled ?? lang.settings_general_week_plan_enabled,
        ),
        lang.settings_general_week_plan_enabled_desc,
        showDescriptions,
    ).addToggle((toggle) =>
        toggle
            .setValue(state.general.weekPlanEnabled)
            .onChange((enabled) => handlers.setWeekPlanEnabled(enabled)),
    );

    if (state.general.weekPlanEnabled) {
        createMaybeDescriptionSetting(
            new Setting(timePlanContainer).setName(
                texts?.weekPlanCompactMode ??
                    lang.settings_general_week_plan_compact_mode,
            ),
            lang.settings_general_week_plan_compact_mode_desc,
            showDescriptions,
        ).addToggle((toggle) =>
            toggle
                .setValue(state.general.weekPlanCompactMode)
                .onChange((enabled) => handlers.setWeekPlanCompactMode(enabled)),
        );

        new Setting(timePlanContainer)
            .setName(texts?.weekStart ?? '周计划起始日')
            .addDropdown(
            (dropdown) =>
                dropdown
                    .addOptions({
                        monday: '周一开始',
                        sunday: '周日开始',
                    } satisfies Record<WeekStart, string>)
                    .setValue(state.general.weekStart)
                    .onChange((value) => handlers.setWeekStart(value as WeekStart)),
            );
    }

    createMaybeDescriptionSetting(
        new Setting(timePlanContainer).setName(
            texts?.dayPlanDateHeadingFormat ??
                lang.settings_general_day_plan_date_heading_format,
        ),
        lang.settings_general_day_plan_date_heading_format_desc,
        showDescriptions,
    ).addDropdown((dropdown) =>
        dropdown
            .addOptions({
                'date-only':
                    lang.settings_general_day_plan_date_heading_format_date_only,
                'zh-full':
                    lang.settings_general_day_plan_date_heading_format_zh_full,
                'zh-short':
                    lang.settings_general_day_plan_date_heading_format_zh_short,
                'en-short':
                    lang.settings_general_day_plan_date_heading_format_en_short,
                custom:
                    lang.settings_general_day_plan_date_heading_format_custom,
            } satisfies Record<DayPlanDateHeadingFormat, string>)
            .setValue(state.general.dayPlanDateHeadingFormat)
            .onChange((value) =>
                handlers.setDayPlanDateHeadingFormat(
                    value as DayPlanDateHeadingFormat,
                ),
            ),
    );

    if (state.general.dayPlanDateHeadingFormat === 'custom') {
        createMaybeDescriptionSetting(
            new Setting(timePlanContainer).setName(
                texts?.dayPlanDateHeadingCustomTemplate ??
                    lang.settings_general_day_plan_date_heading_custom_template,
            ),
            lang.settings_general_day_plan_date_heading_custom_template_desc,
            showDescriptions,
        ).addText((text) =>
            text
                .setPlaceholder('## {date} {cn}')
                .setValue(state.general.dayPlanDateHeadingCustomTemplate)
                .onChange((value) =>
                    handlers.setDayPlanDateHeadingCustomTemplate(value),
                ),
        );
    }

    createMaybeDescriptionSetting(
        new Setting(timePlanContainer).setName(
            texts?.dayPlanDateHeadingApplyMode ??
                lang.settings_general_day_plan_date_heading_apply_mode,
        ),
        lang.settings_general_day_plan_date_heading_apply_mode_desc,
        showDescriptions,
    ).addDropdown((dropdown) =>
        dropdown
            .addOptions({
                immediate:
                    lang.settings_general_day_plan_date_heading_apply_mode_immediate,
                manual: lang.settings_general_day_plan_date_heading_apply_mode_manual,
            } satisfies Record<DayPlanDateHeadingApplyMode, string>)
            .setValue(state.general.dayPlanDateHeadingApplyMode)
            .onChange((value) =>
                handlers.setDayPlanDateHeadingApplyMode(
                    value as DayPlanDateHeadingApplyMode,
                ),
            ),
    );
};
