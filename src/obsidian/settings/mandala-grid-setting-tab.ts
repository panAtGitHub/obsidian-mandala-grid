import { PluginSettingTab, Setting } from 'obsidian';
import type MandalaGrid from 'src/main';
import { lang } from 'src/lang/lang';

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
    }
}
