import { Notice, PluginSettingTab } from 'obsidian';
import type { SettingDefinition, SettingDefinitionItem } from 'obsidian';
import { tx } from 'src/lang/translate';
import {
    normalizeInterfaceLanguage,
    setInterfaceLanguage,
} from 'src/lang/interface-language';
import type MandalaGrid from 'src/main';
import { lang } from 'src/lang/lang';
import { MandalaView } from 'src/view/view';
import {
    GLOBAL_VIEW_PRESETS,
    resolveGlobalViewPresetId,
} from 'src/obsidian/settings/render-mandala-core-settings';
import { fitSettingsLabel } from 'src/obsidian/settings/fit-settings-label';
import { applyCssProps } from 'src/shared/helpers/apply-css-props';
import {
    parsePositiveIntegerInput,
    resolveMaxSectionExample,
} from 'src/mandala-settings/state/helpers/section-range';
import {
    cloneMandalaCellFormatConfig,
    createDefaultMandalaCellFormat,
} from 'src/mandala-settings/state/frontmatter/mandala-cell-format';
import { renderMandalaCellFormatSettings } from 'src/obsidian/settings/render-mandala-cell-format-settings';

export class MandalaGridSettingTab extends PluginSettingTab {
    plugin: MandalaGrid;
    private readonly rangeRefreshers = new Set<() => void>();
    private readonly presetRenderCleanups = new WeakMap<
        HTMLElement,
        () => void
    >();
    private readonly newFileCellFormatRenderCleanups = new WeakMap<
        HTMLElement,
        () => void
    >();

    constructor(app: MandalaGrid['app'], plugin: MandalaGrid) {
        super(app, plugin);
        this.plugin = plugin;
        this.containerEl.addClass('mandala-plugin-settings');
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
            if (activeView) void activeView.setMandalaMode('3x3');
        }
    }

    getControlValue(key: string): unknown {
        const settings = this.plugin.settings.getValue();
        switch (key) {
            case 'interfaceLanguage':
                return settings.general.interfaceLanguage;
            case 'enable9x9View':
                return settings.view.enable9x9View;
            case 'enableNx9View':
                return settings.view.enableNx9View;
            case 'enableCellFormatPreset':
                return settings.view.enableCellFormatPreset;
            case 'timePlanEnabled':
                return (
                    settings.general.dayPlanEnabled &&
                    settings.general.weekPlanEnabled
                );
            default:
                return undefined;
        }
    }

    async setControlValue(key: string, value: unknown): Promise<void> {
        switch (key) {
            case 'interfaceLanguage': {
                const language = normalizeInterfaceLanguage(value);
                this.plugin.settings.dispatch({
                    type: 'settings/general/set-interface-language',
                    payload: { language },
                });
                await this.plugin.saveSettings();
                setInterfaceLanguage(language);
                this.plugin.refreshCommands();
                this.update();
                new Notice(
                    tx('语言设置已保存，请重新加载 Mandala Grid 插件。'),
                );
                return;
            }
            case 'enable9x9View':
            case 'enableNx9View':
                if (typeof value !== 'boolean') return;
                if (this.plugin.settings.getValue().view[key] !== value) {
                    this.plugin.settings.dispatch({
                        type:
                            key === 'enable9x9View'
                                ? 'settings/view/toggle-9x9-view'
                                : 'settings/view/toggle-nx9-view',
                    });
                    this.syncActiveViewModeWithGlobalSwitches();
                }
                break;
            case 'enableCellFormatPreset':
                if (typeof value !== 'boolean') return;
                if (
                    this.plugin.settings.getValue().view
                        .enableCellFormatPreset !== value
                ) {
                    this.plugin.settings.dispatch({
                        type: 'settings/view/toggle-cell-format-preset',
                    });
                }
                break;
            case 'timePlanEnabled':
                if (typeof value !== 'boolean') return;
                this.plugin.settings.dispatch({
                    type: 'settings/general/set-day-plan-enabled',
                    payload: { enabled: value },
                });
                this.plugin.settings.dispatch({
                    type: 'settings/general/set-week-plan-enabled',
                    payload: { enabled: value },
                });
                break;
            default:
                return;
        }
        await this.saveAndUpdate();
    }

    private async saveAndUpdate() {
        await this.plugin.saveSettings();
        this.update();
    }

    private createPresetDefinition(): SettingDefinition {
        return {
            name: tx('预设模式'),
            desc: tx(
                '提示：选择预设后，下方参数会自动联动；若手动修改参数，预设自动切换为「自定义」。',
            ),
            aliases: GLOBAL_VIEW_PRESETS.map((preset) => tx(preset.label)),
            render: (setting) => {
                this.presetRenderCleanups.get(setting.settingEl)?.();
                setting.settingEl
                    .querySelectorAll('.mandala-settings-view-presets__grid')
                    .forEach((grid) => grid.remove());
                const cleanups: (() => void)[] = [];
                const grid = setting.settingEl.createDiv({
                    cls: 'mandala-settings-view-presets__grid',
                });
                applyCssProps(setting.settingEl, { display: 'block' });
                applyCssProps(grid, {
                    display: 'grid',
                    'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
                    gap: '6px 8px',
                    'margin-top': '8px',
                });
                const buttons: (() => void)[] = [];
                for (const preset of GLOBAL_VIEW_PRESETS) {
                    const button = grid.createEl('button', {
                        cls: 'mod-muted',
                        attr: { type: 'button' },
                    });
                    const label = button.createSpan({
                        cls: 'mandala-settings-preset-label',
                    });
                    applyCssProps(button, {
                        'text-align': 'left',
                        padding: '8px 10px',
                        'border-radius': '12px',
                        'font-size': 'var(--font-ui-small)',
                        'font-weight': 'var(--font-medium)',
                        'line-height': '1.2',
                        margin: '0',
                    });
                    buttons.push(() => {
                        const active =
                            preset.id ===
                            resolveGlobalViewPresetId(
                                this.plugin.settings.getValue().view,
                            );
                        label.setText(
                            `${active ? '●' : '○'} ${tx(preset.label)}`,
                        );
                        applyCssProps(button, {
                            border: active
                                ? '1px solid var(--interactive-accent)'
                                : '1px solid var(--background-modifier-border)',
                            'background-color': active
                                ? 'color-mix(in srgb, var(--interactive-accent) 12%, var(--background-secondary))'
                                : 'var(--background-secondary)',
                            color: active
                                ? 'var(--text-normal)'
                                : 'var(--text-muted)',
                        });
                    });
                    const applyPreset = async () => {
                        if (preset.id === 'custom') return;
                        const view = this.plugin.settings.getValue().view;
                        if (view.enable9x9View !== preset.view.enable9x9View)
                            this.plugin.settings.dispatch({
                                type: 'settings/view/toggle-9x9-view',
                            });
                        if (view.enableNx9View !== preset.view.enableNx9View)
                            this.plugin.settings.dispatch({
                                type: 'settings/view/toggle-nx9-view',
                            });
                        this.plugin.settings.dispatch({
                            type: 'settings/view/set-core-section-max',
                            payload: { max: preset.view.coreSectionMax },
                        });
                        this.plugin.settings.dispatch({
                            type: 'settings/view/set-subgrid-max-depth',
                            payload: { depth: preset.view.subgridMaxDepth },
                        });
                        this.syncActiveViewModeWithGlobalSwitches();
                        await this.saveAndUpdate();
                    };
                    button.addEventListener('click', () => {
                        void applyPreset();
                    });
                    cleanups.push(fitSettingsLabel(label));
                }
                const refresh = () => buttons.forEach((update) => update());
                refresh();
                this.rangeRefreshers.add(refresh);
                let disposed = false;
                const cleanup = () => {
                    if (disposed) return;
                    disposed = true;
                    this.rangeRefreshers.delete(refresh);
                    cleanups.forEach((cleanup) => cleanup());
                    if (
                        this.presetRenderCleanups.get(setting.settingEl) ===
                        cleanup
                    )
                        this.presetRenderCleanups.delete(setting.settingEl);
                };
                this.presetRenderCleanups.set(setting.settingEl, cleanup);
                return cleanup;
            },
        };
    }

    private createNewFileCellFormatDefinition(): SettingDefinition {
        return {
            name: lang.settings_global_new_file_cell_format,
            desc: lang.settings_global_new_file_cell_format_desc,
            visible: () =>
                this.plugin.settings.getValue().view.enableCellFormatPreset,
            render: (setting) => {
                this.newFileCellFormatRenderCleanups.get(setting.settingEl)?.();
                setting.settingEl
                    .querySelectorAll('.mandala-settings-new-file-cell-format')
                    .forEach((container) => container.remove());
                applyCssProps(setting.settingEl, { display: 'block' });
                const container = setting.settingEl.createDiv({
                    cls: 'mandala-settings-new-file-cell-format',
                });
                let renderedDepth =
                    this.plugin.settings.getValue().view.subgridMaxDepth;

                const render = () => {
                    container.replaceChildren();
                    const settings = this.plugin.settings.getValue();
                    const config = cloneMandalaCellFormatConfig(
                        settings.view.newFileCellFormat ??
                            createDefaultMandalaCellFormat(
                                settings.view.subgridMaxDepth,
                                true,
                            ),
                    );
                    config.enabled = true;
                    renderMandalaCellFormatSettings({
                        parentEl: container,
                        state: {
                            config,
                            maxDepth: settings.view.subgridMaxDepth,
                        },
                        showDescription: false,
                        showEnabledToggle: false,
                        createGroupContainer: (parentEl) => parentEl,
                        onChanged: () => {
                            this.plugin.settings.dispatch({
                                type: 'settings/view/set-new-file-cell-format',
                                payload: { config },
                            });
                            void this.saveAndUpdate();
                        },
                    });
                    renderedDepth = settings.view.subgridMaxDepth;
                };
                render();
                const refresh = () => {
                    const nextDepth =
                        this.plugin.settings.getValue().view.subgridMaxDepth;
                    if (nextDepth !== renderedDepth) render();
                };
                this.rangeRefreshers.add(refresh);
                let disposed = false;
                const cleanup = () => {
                    if (disposed) return;
                    disposed = true;
                    this.rangeRefreshers.delete(refresh);
                    container.remove();
                    if (
                        this.newFileCellFormatRenderCleanups.get(
                            setting.settingEl,
                        ) === cleanup
                    )
                        this.newFileCellFormatRenderCleanups.delete(
                            setting.settingEl,
                        );
                };
                this.newFileCellFormatRenderCleanups.set(
                    setting.settingEl,
                    cleanup,
                );
                return cleanup;
            },
        };
    }

    private createRangeDefinition(
        key: 'coreSectionMax' | 'subgridMaxDepth',
        name: string,
    ): SettingDefinition {
        const value = this.plugin.settings.getValue().view[key];
        return {
            name,
            desc:
                value === 'unlimited'
                    ? tx(
                          '实时提示：{0}',
                          lang.settings_global_range_input_empty,
                      )
                    : key === 'coreSectionMax'
                      ? tx('实时提示：当前仅允许核心编号 1 ~ {0}。', value)
                      : tx(
                            '实时提示：当前最大层级 = {0}，最大 section 可到 {1}。',
                            value,
                            resolveMaxSectionExample(value),
                        ),
            render: (setting) => {
                setting.addText((text) =>
                    text
                        .setPlaceholder(tx('留空表示不限'))
                        .setValue(value === 'unlimited' ? '' : String(value))
                        .onChange(async (input) => {
                            const parsed = parsePositiveIntegerInput(input);
                            if (!parsed.valid) {
                                setting.setDesc(
                                    lang.settings_global_range_input_invalid,
                                );
                                return;
                            }
                            this.plugin.settings.dispatch(
                                key === 'coreSectionMax'
                                    ? {
                                          type: 'settings/view/set-core-section-max',
                                          payload: { max: parsed.value },
                                      }
                                    : {
                                          type: 'settings/view/set-subgrid-max-depth',
                                          payload: { depth: parsed.value },
                                      },
                            );
                            this.rangeRefreshers.forEach((refresh) =>
                                refresh(),
                            );
                            await this.plugin.saveSettings();
                        }),
                );
                const refresh = () => {
                    const desc = this.createRangeDefinition(key, name).desc;
                    if (desc !== undefined) setting.setDesc(desc);
                };
                this.rangeRefreshers.add(refresh);
                return () => this.rangeRefreshers.delete(refresh);
            },
        };
    }

    private rangePreview(): string {
        const { view } = this.plugin.settings.getValue();
        return [
            view.coreSectionMax === 'unlimited'
                ? tx('核心范围：1 ~ n（不设上限）')
                : tx('核心范围：1 ~ {0}', view.coreSectionMax),
            view.subgridMaxDepth === 'unlimited'
                ? tx('子九宫层级：n 层（不设上限）')
                : tx('子九宫层级：{0} 层（含核心层）', view.subgridMaxDepth),
            tx(
                '最大 section 示例：{0}',
                tx(resolveMaxSectionExample(view.subgridMaxDepth)),
            ),
            lang.settings_global_range_preview_limit_behavior,
        ].join('\n');
    }

    getSettingDefinitions(): SettingDefinitionItem[] {
        return [
            {
                name: tx('界面语言'),
                desc: tx('修改后重新加载插件，使已打开的菜单和视图更新。'),
                control: {
                    type: 'dropdown',
                    key: 'interfaceLanguage',
                    options: {
                        auto: tx('跟随 Obsidian'),
                        zh: '简体中文',
                        en: 'English',
                    },
                },
            },
            {
                type: 'group',
                heading: lang.settings_section_global_view,
                cls: 'mandala-settings-card__content is-open',
                items: [
                    this.createPresetDefinition(),
                    {
                        name: lang.settings_global_enable_9x9_view,
                        control: { type: 'toggle', key: 'enable9x9View' },
                    },
                    {
                        name: lang.settings_global_enable_nx9_view,
                        control: { type: 'toggle', key: 'enableNx9View' },
                    },
                    this.createRangeDefinition(
                        'coreSectionMax',
                        lang.settings_global_core_section_max,
                    ),
                    this.createRangeDefinition(
                        'subgridMaxDepth',
                        lang.settings_global_subgrid_max_depth,
                    ),
                    {
                        name: lang.settings_global_range_preview_title,
                        desc: this.rangePreview(),
                        render: (setting) => {
                            const refresh = () => {
                                setting.setDesc(this.rangePreview());
                            };
                            applyCssProps(setting.descEl, {
                                'white-space': 'pre-line',
                            });
                            this.rangeRefreshers.add(refresh);
                            return () => this.rangeRefreshers.delete(refresh);
                        },
                    },
                    {
                        name: lang.settings_global_enable_cell_format_preset,
                        desc: lang.settings_global_enable_cell_format_preset_desc,
                        control: {
                            type: 'toggle',
                            key: 'enableCellFormatPreset',
                        },
                    },
                    this.createNewFileCellFormatDefinition(),
                ],
            },
            {
                type: 'group',
                heading: lang.settings_section_time_plan,
                cls: 'mandala-settings-card__content is-open',
                items: [
                    {
                        name: lang.settings_general_time_plan_enabled,
                        desc: lang.settings_general_time_plan_enabled_desc,
                        control: { type: 'toggle', key: 'timePlanEnabled' },
                    },
                ],
            },
        ];
    }
}
