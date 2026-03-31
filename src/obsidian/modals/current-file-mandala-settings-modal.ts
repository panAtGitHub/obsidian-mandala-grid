import { Modal, Notice, Setting } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import {
    MANDALA_FRONTMATTER_SETTINGS_KEY,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';

type LocalFileSettings = {
    view: {
        enable9x9View: boolean;
        enableNx9View: boolean;
        enable3x3InfiniteNesting: boolean;
    };
    general: {
        dayPlanEnabled: boolean;
        weekPlanEnabled: boolean;
        weekPlanCompactMode: boolean;
        weekStart: 'monday' | 'sunday';
        dayPlanDateHeadingFormat:
            | 'date-only'
            | 'zh-full'
            | 'zh-short'
            | 'en-short'
            | 'custom';
        dayPlanDateHeadingCustomTemplate: string;
        dayPlanDateHeadingApplyMode: 'immediate' | 'manual';
    };
};

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

        const viewDetails = contentEl.createEl('details');
        viewDetails.open = true;
        viewDetails.createEl('summary', { text: '全局视图' });
        const viewContainer = viewDetails.createDiv();

        new Setting(viewContainer).setName('启用 9×9 视图').addToggle((toggle) =>
            toggle
                .setValue(this.state.view.enable9x9View)
                .onChange((enabled) => {
                    this.state.view.enable9x9View = enabled;
                }),
        );
        new Setting(viewContainer).setName('启用 nx9 视图').addToggle((toggle) =>
            toggle
                .setValue(this.state.view.enableNx9View)
                .onChange((enabled) => {
                    this.state.view.enableNx9View = enabled;
                }),
        );
        new Setting(viewContainer)
            .setName('3×3 无限九宫')
            .setDesc(
                '关闭后：若 9×9 关闭，仅保留到 1.1~1.8；若 9×9 开启，可到 1.1.1~1.8.8。',
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.state.view.enable3x3InfiniteNesting)
                    .onChange((enabled) => {
                        this.state.view.enable3x3InfiniteNesting = enabled;
                    }),
            );

        const planDetails = contentEl.createEl('details');
        planDetails.open = true;
        planDetails.createEl('summary', { text: '时间计划' });
        const planContainer = planDetails.createDiv();

        new Setting(planContainer).setName('日计划启用').addToggle((toggle) =>
            toggle
                .setValue(this.state.general.dayPlanEnabled)
                .onChange((enabled) => {
                    this.state.general.dayPlanEnabled = enabled;
                    this.render();
                }),
        );

        new Setting(planContainer).setName('周计划启用').addToggle((toggle) =>
            toggle
                .setValue(this.state.general.weekPlanEnabled)
                .onChange((enabled) => {
                    this.state.general.weekPlanEnabled = enabled;
                    this.render();
                }),
        );

        if (this.state.general.weekPlanEnabled) {
            new Setting(planContainer).setName('周计划紧凑模式').addToggle((toggle) =>
                toggle
                    .setValue(this.state.general.weekPlanCompactMode)
                    .onChange((enabled) => {
                        this.state.general.weekPlanCompactMode = enabled;
                    }),
            );

            new Setting(planContainer).setName('周计划起始日').addDropdown(
                (dropdown) =>
                    dropdown
                        .addOptions({
                            monday: '周一开始',
                            sunday: '周日开始',
                        })
                        .setValue(this.state.general.weekStart)
                        .onChange((value) => {
                            this.state.general.weekStart =
                                value === 'sunday' ? 'sunday' : 'monday';
                        }),
            );
        }

        new Setting(planContainer).setName('日计划日期标题格式').addDropdown(
            (dropdown) =>
                dropdown
                    .addOptions({
                        'date-only': '仅日期',
                        'zh-full': '中文完整',
                        'zh-short': '中文短格式',
                        'en-short': '英文短格式',
                        custom: '自定义模板',
                    })
                    .setValue(this.state.general.dayPlanDateHeadingFormat)
                    .onChange((value) => {
                        this.state.general.dayPlanDateHeadingFormat =
                            value as LocalFileSettings['general']['dayPlanDateHeadingFormat'];
                        this.render();
                    }),
        );

        if (this.state.general.dayPlanDateHeadingFormat === 'custom') {
            new Setting(planContainer).setName('自定义日期标题模板').addText(
                (text) =>
                    text
                        .setPlaceholder('## {date} {cn}')
                        .setValue(
                            this.state.general.dayPlanDateHeadingCustomTemplate,
                        )
                        .onChange((value) => {
                            this.state.general.dayPlanDateHeadingCustomTemplate =
                                value;
                        }),
            );
        }

        new Setting(planContainer).setName('日期标题应用模式').addDropdown(
            (dropdown) =>
                dropdown
                    .addOptions({
                        immediate: '即时应用',
                        manual: '手动应用',
                    })
                    .setValue(this.state.general.dayPlanDateHeadingApplyMode)
                    .onChange((value) => {
                        this.state.general.dayPlanDateHeadingApplyMode =
                            value === 'immediate' ? 'immediate' : 'manual';
                    }),
        );

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
