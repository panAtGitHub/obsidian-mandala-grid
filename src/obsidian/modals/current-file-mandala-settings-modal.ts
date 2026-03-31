import { Modal, Notice, Setting } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import {
    type EffectiveMandalaSettings,
    MANDALA_FRONTMATTER_SETTINGS_KEY,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';
import { renderMandalaCoreSettings } from 'src/obsidian/settings/render-mandala-core-settings';
import { lang } from 'src/lang/lang';
import { setupDayPlanMandalaFormat } from 'src/obsidian/commands/helpers/setup-day-plan-mandala-format';
import { refreshCurrentDayPlanDateHeadings } from 'src/obsidian/commands/helpers/refresh-day-plan-date-headings';
import { writeCurrentCoreDayPlanSlotsToYaml } from 'src/obsidian/commands/helpers/write-day-plan-slots-to-yaml';

type LocalFileSettings = EffectiveMandalaSettings;

const createInitialLocalState = (view: MandalaView): LocalFileSettings => {
    const effective = view.getEffectiveMandalaSettings();
    return {
        view: {
            enable9x9View: effective.view.enable9x9View,
            enableNx9View: effective.view.enableNx9View,
            enable3x3InfiniteNesting: effective.view.enable3x3InfiniteNesting,
        },
        general: {
            dayPlanEnabled: effective.general.dayPlanEnabled,
            weekPlanEnabled: effective.general.weekPlanEnabled,
            weekPlanCompactMode: effective.general.weekPlanCompactMode,
            weekStart: effective.general.weekStart,
            dayPlanDateHeadingFormat: effective.general.dayPlanDateHeadingFormat,
            dayPlanDateHeadingCustomTemplate:
                effective.general.dayPlanDateHeadingCustomTemplate,
            dayPlanDateHeadingApplyMode:
                effective.general.dayPlanDateHeadingApplyMode,
        },
    };
};

export const openCurrentFileMandalaSettingsModal = (view: MandalaView) => {
    const modal = new CurrentFileMandalaSettingsModal(view);
    modal.open();
};

class CurrentFileMandalaSettingsModal extends Modal {
    private state: LocalFileSettings;

    constructor(private readonly view: MandalaView) {
        super(view.plugin.app);
        this.state = createInitialLocalState(view);
    }

    onOpen() {
        this.setTitle('当前文件九宫设置');
        this.modalEl.addClass('mandala-file-settings-modal');
        this.contentEl.addClass('mandala-file-settings');
        this.render();
    }

    onClose() {
        this.contentEl.empty();
    }

    private render() {
        const { contentEl } = this;
        contentEl.empty();

        renderMandalaCoreSettings({
            parentEl: contentEl,
            state: this.state,
            createGroupContainer: (parentEl, title) => {
                const details = parentEl.createEl('details');
                details.addClass('mandala-settings-drawer');
                details.open = true;
                details
                    .createEl('summary', { text: title })
                    .addClass('mandala-settings-drawer__summary');
                return details.createDiv({
                    cls: 'mandala-settings-drawer__content',
                });
            },
            showDescriptions: false,
            handlers: {
                setEnable9x9View: (enabled) => {
                    this.state.view.enable9x9View = enabled;
                },
                setEnableNx9View: (enabled) => {
                    this.state.view.enableNx9View = enabled;
                },
                setEnable3x3InfiniteNesting: (enabled) => {
                    this.state.view.enable3x3InfiniteNesting = enabled;
                },
                setDayPlanEnabled: (enabled) => {
                    this.state.general.dayPlanEnabled = enabled;
                },
                setWeekPlanEnabled: (enabled) => {
                    this.state.general.weekPlanEnabled = enabled;
                    this.render();
                },
                setWeekPlanCompactMode: (enabled) => {
                    this.state.general.weekPlanCompactMode = enabled;
                },
                setWeekStart: (weekStart) => {
                    this.state.general.weekStart = weekStart;
                },
                setDayPlanDateHeadingFormat: (format) => {
                    this.state.general.dayPlanDateHeadingFormat = format;
                    this.render();
                },
                setDayPlanDateHeadingCustomTemplate: (template) => {
                    this.state.general.dayPlanDateHeadingCustomTemplate = template;
                },
                setDayPlanDateHeadingApplyMode: (mode) => {
                    this.state.general.dayPlanDateHeadingApplyMode = mode;
                },
            },
        });

        const actionsDetails = contentEl.createEl('details');
        actionsDetails.addClass('mandala-settings-drawer');
        actionsDetails.open = true;
        actionsDetails
            .createEl('summary', { text: '日计划操作' })
            .addClass('mandala-settings-drawer__summary');
        const actionsContainer = actionsDetails.createDiv({
            cls: 'mandala-settings-drawer__content',
        });

        new Setting(actionsContainer)
            .setName(lang.cmd_set_day_plan_mandala_format)
            .addButton((button) =>
                button.setButtonText('执行').onClick(() => {
                    void setupDayPlanMandalaFormat(this.view.plugin);
                }),
            );

        new Setting(actionsContainer)
            .setName(lang.cmd_refresh_day_plan_date_headings)
            .addButton((button) =>
                button.setButtonText('执行').onClick(() => {
                    void refreshCurrentDayPlanDateHeadings(this.view.plugin);
                }),
            );

        new Setting(actionsContainer)
            .setName(lang.cmd_write_current_core_day_plan_slots_to_yaml)
            .addButton((button) =>
                button.setButtonText('执行').onClick(() => {
                    void writeCurrentCoreDayPlanSlotsToYaml(this.view.plugin);
                }),
            );

        const footerActions = contentEl.createDiv({
            cls: 'mandala-file-settings__actions',
        });
        const cancelButton = footerActions.createEl('button', {
            text: '取消',
            cls: 'mod-muted',
        });
        cancelButton.addEventListener('click', () => this.close());

        const saveButton = footerActions.createEl('button', {
            text: '保存',
            cls: 'mod-cta',
        });
        saveButton.addEventListener('click', () => {
            void this.save();
        });
    }

    private async save() {
        if (!this.view.file) {
            new Notice('未找到当前文件。');
            return;
        }

        await this.view.plugin.app.fileManager.processFrontMatter(
            this.view.file,
            (frontmatter) => {
                const record = frontmatter as Record<string, unknown>;
                record[MANDALA_FRONTMATTER_SETTINGS_KEY] = {
                    view: {
                        enable9x9View: this.state.view.enable9x9View,
                        enableNx9View: this.state.view.enableNx9View,
                        enable3x3InfiniteNesting:
                            this.state.view.enable3x3InfiniteNesting,
                    },
                    general: {
                        dayPlanEnabled: this.state.general.dayPlanEnabled,
                        weekPlanEnabled: this.state.general.weekPlanEnabled,
                        weekPlanCompactMode:
                            this.state.general.weekPlanCompactMode,
                        weekStart: this.state.general.weekStart,
                        dayPlanDateHeadingFormat:
                            this.state.general.dayPlanDateHeadingFormat,
                        dayPlanDateHeadingCustomTemplate:
                            this.state.general.dayPlanDateHeadingCustomTemplate,
                        dayPlanDateHeadingApplyMode:
                            this.state.general.dayPlanDateHeadingApplyMode,
                    },
                };
            },
        );

        const latest = await this.view.plugin.app.vault.cachedRead(this.view.file);
        const { frontmatter } = extractFrontmatter(latest);
        updateFrontmatter(this.view, frontmatter);
        this.view.ensureCompatibleMandalaMode(frontmatter);

        new Notice('当前文件九宫设置已保存到 YAML。');
        this.close();
    }
}
