import { PluginSettingTab, Setting } from 'obsidian';
import type MandalaGrid from 'src/main';
import { lang } from 'src/lang/lang';
import { MandalaView } from 'src/view/view';
import { renderMandalaCoreSettings } from 'src/obsidian/settings/render-mandala-core-settings';
import { createSettingsFoldCard } from 'src/obsidian/settings/create-settings-fold-card';

export class MandalaGridSettingTab extends PluginSettingTab {
    plugin: MandalaGrid;
    private readonly groupOpenState = new Map<string, boolean>([
        ['global-view', false],
        ['time-plan', false],
    ]);

    constructor(app: MandalaGrid['app'], plugin: MandalaGrid) {
        super(app, plugin);
        this.plugin = plugin;
    }

    private syncActiveViewModeWithGlobalSwitches() {
        const settings = this.plugin.settings.getValue();
        const mode = settings.view.mandalaMode;
        if (
            (mode === '9x9' && !settings.view.enable9x9View) ||
            (mode === 'nx9' && !settings.view.enableNx9View)
        ) {
            this.plugin.settings.dispatch({
                type: 'settings/view/mandala/set-mode',
                payload: { mode: '3x3' },
            });
            const activeView =
                this.app.workspace.getActiveViewOfType(MandalaView);
            if (activeView) {
                void activeView.setMandalaMode('3x3');
            }
        }
    }

    private createFoldCard(parent: HTMLElement, title: string, key: string) {
        const opened = this.groupOpenState.get(key) ?? false;
        return createSettingsFoldCard({
            parentEl: parent,
            title,
            opened,
            onToggle: (nextOpen) => {
                this.groupOpenState.set(key, nextOpen);
            },
        }).contentEl;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('mandala-plugin-settings');

        new Setting(containerEl)
            .setName(lang.settings_plugin_title)
            .setHeading();
        const settings = this.plugin.settings.getValue();
        renderMandalaCoreSettings({
            parentEl: containerEl,
            state: {
                view: {
                    enable9x9View: settings.view.enable9x9View,
                    enableNx9View: settings.view.enableNx9View,
                    coreSectionMax: settings.view.coreSectionMax,
                    subgridMaxDepth: settings.view.subgridMaxDepth,
                },
                general: {
                    dayPlanEnabled: settings.general.dayPlanEnabled,
                    weekPlanEnabled: settings.general.weekPlanEnabled,
                    weekPlanCompactMode: settings.general.weekPlanCompactMode,
                    weekStart: settings.general.weekStart,
                    dayPlanDateHeadingFormat:
                        settings.general.dayPlanDateHeadingFormat,
                    dayPlanDateHeadingCustomTemplate:
                        settings.general.dayPlanDateHeadingCustomTemplate,
                    dayPlanDateHeadingApplyMode:
                        settings.general.dayPlanDateHeadingApplyMode,
                },
            },
            createGroupContainer: (parentEl, title, group) =>
                this.createFoldCard(parentEl, title, group),
            showDescriptions: true,
            showTimePlanDefaults: false,
            handlers: {
                setEnable9x9View: () => {
                    this.plugin.settings.dispatch({
                        type: 'settings/view/toggle-9x9-view',
                    });
                    this.syncActiveViewModeWithGlobalSwitches();
                },
                setEnableNx9View: () => {
                    this.plugin.settings.dispatch({
                        type: 'settings/view/toggle-nx9-view',
                    });
                    this.syncActiveViewModeWithGlobalSwitches();
                },
                setCoreSectionMax: (max) => {
                    this.plugin.settings.dispatch({
                        type: 'settings/view/set-core-section-max',
                        payload: { max },
                    });
                },
                setSubgridMaxDepth: (depth) => {
                    this.plugin.settings.dispatch({
                        type: 'settings/view/set-subgrid-max-depth',
                        payload: { depth },
                    });
                },
                setTimePlanEnabled: (enabled) => {
                    this.plugin.settings.dispatch({
                        type: 'settings/general/set-day-plan-enabled',
                        payload: { enabled },
                    });
                    this.plugin.settings.dispatch({
                        type: 'settings/general/set-week-plan-enabled',
                        payload: { enabled },
                    });
                    this.display();
                },
                setWeekStart: (weekStart) => {
                    this.plugin.settings.dispatch({
                        type: 'settings/general/set-week-start',
                        payload: { weekStart },
                    });
                },
                setDayPlanDateHeadingFormat: (format) => {
                    this.plugin.settings.dispatch({
                        type: 'settings/general/set-day-plan-date-heading-format',
                        payload: { format },
                    });
                    this.display();
                },
                setDayPlanDateHeadingCustomTemplate: (template) => {
                    this.plugin.settings.dispatch({
                        type: 'settings/general/set-day-plan-date-heading-custom-template',
                        payload: { template },
                    });
                },
            },
        });
    }
}
