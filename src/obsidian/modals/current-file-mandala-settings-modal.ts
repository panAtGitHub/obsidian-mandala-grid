import { Modal, Notice, Setting } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import {
    type EffectiveMandalaSettings,
    MANDALA_FRONTMATTER_SETTINGS_KEY,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';
import { renderMandalaCoreSettings } from 'src/obsidian/settings/render-mandala-core-settings';

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
                details.open = true;
                details.createEl('summary', { text: title });
                return details.createDiv();
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

        new Setting(contentEl).addButton((button) => {
            button.setButtonText('保存').setCta().onClick(() => {
                void this.save();
            });
        });
        new Setting(contentEl).addButton((button) => {
            button.setButtonText('取消').onClick(() => this.close());
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
