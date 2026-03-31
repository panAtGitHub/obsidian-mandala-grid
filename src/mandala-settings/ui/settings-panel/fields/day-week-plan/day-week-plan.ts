import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { lang } from 'src/lang/lang';
import {
    DayPlanDateHeadingApplyMode,
    DayPlanDateHeadingFormat,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';

export const DayWeekPlanSettings = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    const settingsState = settingsStore.getValue();

    // Day Plan Section
    element.createEl('h3', {
        text: '日计划',
        cls: 'mandala-settings-section-title',
    });

    new Setting(element)
        .setName(lang.settings_general_day_plan_enabled)
        .setDesc(lang.settings_general_day_plan_enabled_desc)
        .addToggle((cb) => {
            cb.setValue(settingsState.general.dayPlanEnabled).onChange(
                (enabled) => {
                    settingsStore.dispatch({
                        type: 'settings/general/set-day-plan-enabled',
                        payload: { enabled },
                    });
                },
            );
        });

    if (settingsState.general.dayPlanEnabled) {
        // Date heading format
        new Setting(element)
            .setName(lang.settings_general_day_plan_date_heading_format)
            .setDesc(
                lang.settings_general_day_plan_date_heading_format_desc,
            )
            .addDropdown((cb) => {
                cb.addOptions({
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
                    .setValue(settingsState.general.dayPlanDateHeadingFormat)
                    .onChange((value) => {
                        settingsStore.dispatch({
                            type: 'settings/general/set-day-plan-date-heading-format',
                            payload: {
                                format: value as DayPlanDateHeadingFormat,
                            },
                        });
                    });
            });

        // Custom template
        if (settingsState.general.dayPlanDateHeadingFormat === 'custom') {
            new Setting(element)
                .setName(
                    lang.settings_general_day_plan_date_heading_custom_template,
                )
                .setDesc(
                    lang.settings_general_day_plan_date_heading_custom_template_desc,
                )
                .addText((text) => {
                    text.setPlaceholder('## {date} {cn}')
                        .setValue(
                            settingsState.general
                                .dayPlanDateHeadingCustomTemplate,
                        )
                        .onChange((value) => {
                            settingsStore.dispatch({
                                type: 'settings/general/set-day-plan-date-heading-custom-template',
                                payload: {
                                    template: value,
                                },
                            });
                        });
                });
        }

        // Apply mode
        new Setting(element)
            .setName(lang.settings_general_day_plan_date_heading_apply_mode)
            .setDesc(
                lang.settings_general_day_plan_date_heading_apply_mode_desc,
            )
            .addDropdown((cb) => {
                cb.addOptions({
                    immediate:
                        lang.settings_general_day_plan_date_heading_apply_mode_immediate,
                    manual:
                        lang.settings_general_day_plan_date_heading_apply_mode_manual,
                } satisfies Record<DayPlanDateHeadingApplyMode, string>)
                    .setValue(settingsState.general.dayPlanDateHeadingApplyMode)
                    .onChange((value) => {
                        settingsStore.dispatch({
                            type: 'settings/general/set-day-plan-date-heading-apply-mode',
                            payload: {
                                mode: value as DayPlanDateHeadingApplyMode,
                            },
                        });
                    });
            });

        // Today button desktop
        new Setting(element)
            .setName(lang.settings_display_day_plan_today_button + '（PC）')
            .addToggle((cb) => {
                cb.setValue(
                    settingsState.view.showDayPlanTodayButtonDesktop ?? true,
                ).onChange(() => {
                    settingsStore.dispatch({
                        type: 'settings/view/toggle-day-plan-today-button-desktop',
                    });
                });
            });

        // Today button mobile
        new Setting(element)
            .setName(lang.settings_display_day_plan_today_button + '（手机）')
            .addToggle((cb) => {
                cb.setValue(
                    settingsState.view.showDayPlanTodayButtonMobile ?? true,
                ).onChange(() => {
                    settingsStore.dispatch({
                        type: 'settings/view/toggle-day-plan-today-button-mobile',
                    });
                });
            });
    }

    // Week Plan Section
    element.createEl('h3', {
        text: '周计划',
        cls: 'mandala-settings-section-title',
    });

    new Setting(element)
        .setName(lang.settings_general_week_plan_enabled)
        .setDesc(lang.settings_general_week_plan_enabled_desc)
        .addToggle((cb) => {
            cb.setValue(settingsState.general.weekPlanEnabled).onChange(
                (enabled) => {
                    settingsStore.dispatch({
                        type: 'settings/general/set-week-plan-enabled',
                        payload: { enabled },
                    });
                },
            );
        });

    if (settingsState.general.weekPlanEnabled) {
        new Setting(element)
            .setName(lang.settings_general_week_plan_compact_mode)
            .setDesc(lang.settings_general_week_plan_compact_mode_desc)
            .addToggle((cb) => {
                cb.setValue(settingsState.general.weekPlanCompactMode).onChange(
                    () => {
                        settingsStore.dispatch({
                            type: 'settings/general/set-week-plan-compact-mode',
                            payload: {
                                enabled:
                                    !settingsStore.getValue().general
                                        .weekPlanCompactMode,
                            },
                        });
                    },
                );
            });

        new Setting(element)
            .setName('周计划起始日')
            .setDesc('周视图中一周从周一或周日开始。')
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions({
                        monday: '周一开始',
                        sunday: '周日开始',
                    } satisfies Record<WeekStart, string>)
                    .setValue(settingsState.general.weekStart)
                    .onChange((value) => {
                        settingsStore.dispatch({
                            type: 'settings/general/set-week-start',
                            payload: {
                                weekStart: value as WeekStart,
                            },
                        });
                    });
            });
    }
};
