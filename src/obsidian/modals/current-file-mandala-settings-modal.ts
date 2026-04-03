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
import { refreshCurrentDayPlanDateHeadings } from 'src/obsidian/commands/helpers/refresh-day-plan-date-headings';
import { writeCurrentCoreDayPlanSlotsToYaml } from 'src/obsidian/commands/helpers/write-day-plan-slots-to-yaml';
import { isDayPlanDedicatedFrontmatter } from 'src/mandala-display/logic/day-plan';
import { createSettingsFoldCard } from 'src/obsidian/settings/create-settings-fold-card';

type LocalFileSettings = EffectiveMandalaSettings;

const createInitialLocalState = (view: MandalaView): LocalFileSettings => {
    const effective = view.getEffectiveMandalaSettings();
    return {
        view: {
            enable9x9View: effective.view.enable9x9View,
            enableNx9View: effective.view.enableNx9View,
            coreSectionMax: effective.view.coreSectionMax,
            subgridMaxDepth: effective.view.subgridMaxDepth,
        },
        general: {
            dayPlanEnabled: effective.general.dayPlanEnabled,
            weekPlanEnabled: effective.general.weekPlanEnabled,
            weekPlanCompactMode: effective.general.weekPlanCompactMode,
            weekStart: effective.general.weekStart,
            dayPlanDateHeadingFormat:
                effective.general.dayPlanDateHeadingFormat,
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
    private readonly groupOpenState = new Map<string, boolean>([
        ['global-view', true],
        ['time-plan', true],
        ['actions', true],
    ]);

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

    private getScrollContainer() {
        return (this.contentEl.closest('.modal-content') ??
            this.contentEl) as HTMLElement;
    }

    private createFoldCard(parentEl: HTMLElement, title: string, key: string) {
        const opened = this.groupOpenState.get(key) ?? true;
        return createSettingsFoldCard({
            parentEl,
            title,
            opened,
            onToggle: (nextOpen) => {
                this.groupOpenState.set(key, nextOpen);
            },
        }).contentEl;
    }

    private render({
        preserveScroll = false,
    }: { preserveScroll?: boolean } = {}) {
        const { contentEl } = this;
        const scrollContainer = this.getScrollContainer();
        const scrollTop = preserveScroll ? scrollContainer.scrollTop : 0;
        contentEl.empty();
        const isDayPlanDedicated = isDayPlanDedicatedFrontmatter(
            this.view.documentStore.getValue().file.frontmatter,
        );

        contentEl.createDiv({
            cls: 'mandala-file-settings__note',
            text: '仅影响当前 md 文件，保存到 YAML 的 mandala_settings。',
        });

        renderMandalaCoreSettings({
            parentEl: contentEl,
            state: this.state,
            showTimePlanEnabledToggle: false,
            showTimePlanSection: isDayPlanDedicated,
            createGroupContainer: (parentEl, title, group) =>
                this.createFoldCard(parentEl, title, group),
            showDescriptions: false,
            texts: {
                sectionGlobalView: '当前文件视图覆盖',
                sectionTimePlan: '当前文件时间计划覆盖',
                enable9x9View: '当前文件启用 9×9 视图',
                enableNx9View: '当前文件启用 nx9 视图',
                coreSectionMax: '当前文件核心格子编号范围（1 ~ n）',
                subgridMaxDepth: '当前文件子九宫最大层级（含核心层）',
                rangePreviewTitle: '当前文件范围总览（实时）',
                weekStart: '当前文件周计划起始日',
                dayPlanDateHeadingFormat: '当前文件日计划日期标题格式',
                dayPlanDateHeadingCustomTemplate: '当前文件自定义日期标题模板',
            },
            handlers: {
                setEnable9x9View: (enabled) => {
                    this.state.view.enable9x9View = enabled;
                },
                setEnableNx9View: (enabled) => {
                    this.state.view.enableNx9View = enabled;
                },
                setCoreSectionMax: (max) => {
                    this.state.view.coreSectionMax = max;
                },
                setSubgridMaxDepth: (depth) => {
                    this.state.view.subgridMaxDepth = depth;
                },
                setWeekStart: (weekStart) => {
                    this.state.general.weekStart = weekStart;
                },
                setDayPlanDateHeadingFormat: (format) => {
                    this.state.general.dayPlanDateHeadingFormat = format;
                    this.render({ preserveScroll: true });
                },
                setDayPlanDateHeadingCustomTemplate: (template) => {
                    this.state.general.dayPlanDateHeadingCustomTemplate =
                        template;
                },
            },
        });

        if (isDayPlanDedicated) {
            const actionsContainer = this.createFoldCard(
                contentEl,
                '日计划维护',
                'actions',
            );

            new Setting(actionsContainer)
                .setName(lang.cmd_refresh_day_plan_date_headings)
                .addButton((button) =>
                    button.setButtonText('执行').onClick(() => {
                        void refreshCurrentDayPlanDateHeadings(
                            this.view.plugin,
                        );
                    }),
                );

            new Setting(actionsContainer)
                .setName(lang.cmd_write_current_core_day_plan_slots_to_yaml)
                .addButton((button) =>
                    button.setButtonText('执行').onClick(() => {
                        void writeCurrentCoreDayPlanSlotsToYaml(
                            this.view.plugin,
                        );
                    }),
                );
        }

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

        if (preserveScroll) {
            requestAnimationFrame(() => {
                this.getScrollContainer().scrollTop = scrollTop;
            });
        }
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
                        coreSectionMax: this.state.view.coreSectionMax,
                        subgridMaxDepth: this.state.view.subgridMaxDepth,
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

        const latest = await this.view.plugin.app.vault.cachedRead(
            this.view.file,
        );
        const { frontmatter } = extractFrontmatter(latest);
        updateFrontmatter(this.view, frontmatter);
        this.view.ensureCompatibleMandalaMode(frontmatter);

        new Notice('当前文件九宫设置已保存到 YAML。');
        this.close();
    }
}
