import { Modal, Notice } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import {
    type EffectiveMandalaSettings,
    MANDALA_FRONTMATTER_SETTINGS_KEY,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';
import { renderMandalaCoreSettings } from 'src/obsidian/settings/render-mandala-core-settings';
import { refreshCurrentDayPlanDateHeadings } from 'src/obsidian/commands/helpers/refresh-day-plan-date-headings';
import {
    getCurrentCoreDayPlanTemplateMismatch,
    writeCurrentCoreDayPlanSlotsToYamlForView,
} from 'src/obsidian/commands/helpers/write-day-plan-slots-to-yaml';
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
    private dismissedTemplateMismatchCore: string | null = null;
    private readonly groupOpenState = new Map<string, boolean>([
        ['global-view', true],
        ['time-plan', true],
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
        return this.contentEl.closest('.modal-content') ?? this.contentEl;
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
        const templateMismatch = isDayPlanDedicated
            ? getCurrentCoreDayPlanTemplateMismatch(this.view)
            : null;
        if (
            templateMismatch &&
            this.dismissedTemplateMismatchCore !== templateMismatch.core
        ) {
            this.dismissedTemplateMismatchCore = null;
        }

        contentEl.createDiv({
            cls: 'mandala-file-settings__note',
            text: isDayPlanDedicated
                ? '仅影响当前 md 文件。视图设置保存到 YAML 的 mandala_settings；日计划模板会写回当前文件的 YAML。'
                : '仅影响当前 md 文件，保存到 YAML 的 mandala_settings。',
        });

        renderMandalaCoreSettings({
            parentEl: contentEl,
            state: this.state,
            showTimePlanEnabledToggle: false,
            showTimePlanSection: isDayPlanDedicated,
            renderTimePlanFooter: (containerEl) => {
                if (!templateMismatch) return;
                if (this.dismissedTemplateMismatchCore === templateMismatch.core) {
                    return;
                }

                const promptCard = containerEl.createDiv({
                    cls: 'mandala-file-settings__template-sync-card',
                });
                promptCard.createDiv({
                    cls: 'mandala-file-settings__template-sync-title',
                    text: '检测到当前核心 8 格标题与 YAML 模板不一致',
                });
                promptCard.createDiv({
                    cls: 'mandala-file-settings__template-sync-core',
                    text: `当前核心：${templateMismatch.core}`,
                });
                promptCard.createDiv({
                    cls: 'mandala-file-settings__template-sync-text',
                    text: '差异提示：当前核心九宫的 8 个标题已被修改，但尚未写回当前文件模板。',
                });
                promptCard.createDiv({
                    cls: 'mandala-file-settings__template-sync-text',
                    text: '如果你希望后续日期继续沿用这组 8 格标题，可写回 YAML 以便复用。',
                });

                const actionsEl = promptCard.createDiv({
                    cls: 'mandala-file-settings__template-sync-actions',
                });
                const writeButton = actionsEl.createEl('button', {
                    text: '写回当前模板',
                    cls: 'mod-cta',
                });
                writeButton.addEventListener('click', () => {
                    void (async () => {
                        const written =
                            await writeCurrentCoreDayPlanSlotsToYamlForView(
                                this.view.plugin,
                                this.view,
                            );
                        if (!written) return;
                        this.dismissedTemplateMismatchCore = null;
                        this.render({ preserveScroll: true });
                    })();
                });

                const dismissButton = actionsEl.createEl('button', {
                    text: '暂不处理',
                    cls: 'mod-muted',
                });
                dismissButton.addEventListener('click', () => {
                    this.dismissedTemplateMismatchCore = templateMismatch.core;
                    this.render({ preserveScroll: true });
                });
            },
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
        const isDayPlanDedicated = isDayPlanDedicatedFrontmatter(
            this.view.documentStore.getValue().file.frontmatter,
        );

        await this.view.plugin.app.fileManager.processFrontMatter(
            this.view.file,
            (frontmatter) => {
                const record = frontmatter as Record<string, unknown>;
                const nextSettings: Record<string, unknown> = {
                    view: {
                        enable9x9View: this.state.view.enable9x9View,
                        enableNx9View: this.state.view.enableNx9View,
                        coreSectionMax: this.state.view.coreSectionMax,
                        subgridMaxDepth: this.state.view.subgridMaxDepth,
                    },
                };
                if (isDayPlanDedicated) {
                    nextSettings.general = {
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
                    };
                }
                record[MANDALA_FRONTMATTER_SETTINGS_KEY] = nextSettings;
            },
        );

        const latest = await this.view.plugin.app.vault.cachedRead(
            this.view.file,
        );
        const { frontmatter } = extractFrontmatter(latest);
        updateFrontmatter(this.view, frontmatter);
        this.view.ensureCompatibleMandalaMode(frontmatter);

        if (isDayPlanDedicated) {
            await refreshCurrentDayPlanDateHeadings(this.view.plugin, {
                notify: false,
            });
        }

        new Notice('当前文件九宫设置已保存到 YAML。');
        this.close();
    }
}
