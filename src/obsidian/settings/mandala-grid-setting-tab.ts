import { PluginSettingTab, Setting } from 'obsidian';
import type MandalaGrid from 'src/main';
import { lang } from 'src/lang/lang';
import {
    DayPlanDateHeadingApplyMode,
    DayPlanDateHeadingFormat,
    WeekStart,
} from 'src/stores/settings/settings-type';

export class MandalaGridSettingTab extends PluginSettingTab {
    plugin: MandalaGrid;

    constructor(app: MandalaGrid['app'], plugin: MandalaGrid) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName(lang.settings_plugin_title)
            .setHeading();

        new Setting(containerEl)
            .setName(lang.settings_general_day_plan_enabled)
            .setDesc(lang.settings_general_day_plan_enabled_desc)
            .addToggle((toggle) => {
                toggle
                    .setValue(
                        this.plugin.settings.getValue().general.dayPlanEnabled,
                    )
                    .onChange((enabled) => {
                        this.plugin.settings.dispatch({
                            type: 'settings/general/set-day-plan-enabled',
                            payload: { enabled },
                        });
                    });
            });

        const settings = this.plugin.settings.getValue();

        new Setting(containerEl)
            .setName(lang.settings_general_week_plan_enabled)
            .setDesc(lang.settings_general_week_plan_enabled_desc)
            .addToggle((toggle) => {
                toggle
                    .setValue(settings.general.weekPlanEnabled)
                    .onChange((enabled) => {
                        this.plugin.settings.dispatch({
                            type: 'settings/general/set-week-plan-enabled',
                            payload: { enabled },
                        });
                        this.display();
                    });
            });

        if (settings.general.weekPlanEnabled) {
            new Setting(containerEl)
                .setName(lang.settings_general_week_plan_compact_mode)
                .setDesc(lang.settings_general_week_plan_compact_mode_desc)
                .addToggle((toggle) => {
                    toggle
                        .setValue(settings.general.weekPlanCompactMode)
                        .onChange((enabled) => {
                            this.plugin.settings.dispatch({
                                type: 'settings/general/set-week-plan-compact-mode',
                                payload: { enabled },
                            });
                        });
                });

            new Setting(containerEl)
                .setName('周计划起始日')
                .setDesc('周视图中一周从周一或周日开始。')
                .addDropdown((dropdown) => {
                    dropdown
                        .addOptions({
                            monday: '周一开始',
                            sunday: '周日开始',
                        } satisfies Record<WeekStart, string>)
                        .setValue(settings.general.weekStart)
                        .onChange((value) => {
                            this.plugin.settings.dispatch({
                                type: 'settings/general/set-week-start',
                                payload: {
                                    weekStart: value as WeekStart,
                                },
                            });
                        });
                });
        }

        new Setting(containerEl)
            .setName(lang.settings_general_day_plan_date_heading_format)
            .setDesc(lang.settings_general_day_plan_date_heading_format_desc)
            .addDropdown((dropdown) => {
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
                        custom: lang.settings_general_day_plan_date_heading_format_custom,
                    } satisfies Record<DayPlanDateHeadingFormat, string>)
                    .setValue(settings.general.dayPlanDateHeadingFormat)
                    .onChange((value) => {
                        this.plugin.settings.dispatch({
                            type: 'settings/general/set-day-plan-date-heading-format',
                            payload: {
                                format: value as DayPlanDateHeadingFormat,
                            },
                        });
                        this.display();
                    });
            });

        if (settings.general.dayPlanDateHeadingFormat === 'custom') {
            new Setting(containerEl)
                .setName(lang.settings_general_day_plan_date_heading_custom_template)
                .setDesc(
                    lang.settings_general_day_plan_date_heading_custom_template_desc,
                )
                .addText((text) => {
                    text.setPlaceholder('## {date} {cn}')
                        .setValue(
                            settings.general.dayPlanDateHeadingCustomTemplate,
                        )
                        .onChange((value) => {
                            this.plugin.settings.dispatch({
                                type: 'settings/general/set-day-plan-date-heading-custom-template',
                                payload: {
                                    template: value,
                                },
                            });
                        });
                });
        }

        new Setting(containerEl)
            .setName(lang.settings_general_day_plan_date_heading_apply_mode)
            .setDesc(lang.settings_general_day_plan_date_heading_apply_mode_desc)
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions({
                        immediate:
                            lang.settings_general_day_plan_date_heading_apply_mode_immediate,
                        manual:
                            lang.settings_general_day_plan_date_heading_apply_mode_manual,
                    } satisfies Record<DayPlanDateHeadingApplyMode, string>)
                    .setValue(settings.general.dayPlanDateHeadingApplyMode)
                    .onChange((value) => {
                        this.plugin.settings.dispatch({
                            type: 'settings/general/set-day-plan-date-heading-apply-mode',
                            payload: {
                                mode: value as DayPlanDateHeadingApplyMode,
                            },
                        });
                    });
            });
    }
}
