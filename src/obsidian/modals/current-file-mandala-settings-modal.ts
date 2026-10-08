import { onPluginError } from 'src/shared/store/on-plugin-error';
import { Setting } from 'obsidian';
import {
    editDayPlanTemplate,
    localDayPlanDate,
} from 'src/obsidian/commands/helpers/day-plan-template-edit';
import {
    openDayPlanTemplateEditModal,
    openDayPlanHistoryRangeModal,
} from 'src/obsidian/modals/day-plan-template-edit-modal';
import {
    addDaysIsoDate,
    slotsRecordToArray,
} from 'src/mandala-display/logic/day-plan';
import { tx } from 'src/lang/translate';
import { Modal, Notice } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import {
    type EffectiveMandalaSettings,
    MANDALA_FRONTMATTER_SETTINGS_KEY,
    withDayPlanDisplaySettings,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';
import { renderMandalaCoreSettings } from 'src/obsidian/settings/render-mandala-core-settings';
import { refreshCurrentDayPlanDateHeadings } from 'src/obsidian/commands/helpers/refresh-day-plan-date-headings';
import {
    getCurrentCoreDayPlanTemplateMismatch,
    writeCurrentCoreDayPlanSlotsToYamlForView,
} from 'src/obsidian/commands/helpers/write-day-plan-slots-to-yaml';
import {
    readDayPlanConfigurationFromRecord,
    readDayPlanConfiguration,
    writeDayPlanConfiguration,
    isValidDayPlanDateTemplate,
} from 'src/mandala-display/logic/day-plan';
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
        },
    };
};

export const openCurrentFileMandalaSettingsModal = (view: MandalaView) => {
    const modal = new CurrentFileMandalaSettingsModal(view);
    modal.open();
};

class CurrentFileMandalaSettingsModal extends Modal {
    private state: LocalFileSettings;
    private readonly targetFile: MandalaView['file'];
    private dismissedTemplateMismatchCore: string | null = null;
    private readonly groupOpenState = new Map<string, boolean>([
        ['global-view', true],
        ['time-plan', true],
    ]);

    constructor(private readonly view: MandalaView) {
        super(view.plugin.app);
        this.state = createInitialLocalState(view);
        this.targetFile = view.file;
    }

    onOpen() {
        this.setTitle(
            tx(
                readDayPlanConfiguration(
                    this.view.documentStore.getValue().file.frontmatter,
                ).present
                    ? '当前文件日计划设置'
                    : '当前文件九宫设置',
            ),
        );
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
        const dayPlan = readDayPlanConfiguration(
            this.view.documentStore.getValue().file.frontmatter,
        );
        const isDayPlanDedicated = !!dayPlan.config;
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
                ? tx(
                      '仅影响当前 md 文件。视图设置保存到 mandala_settings；日计划设置及每日模板保存到 mandala_day_plan。',
                  )
                : tx('仅影响当前 md 文件，保存到 YAML 的 mandala_settings。'),
        });

        renderMandalaCoreSettings({
            parentEl: contentEl,
            state: this.state,
            showTimePlanEnabledToggle: isDayPlanDedicated,
            showWeekViewOptions: isDayPlanDedicated,
            showTimePlanSection: isDayPlanDedicated,
            renderTimePlanFooter: (containerEl) => {
                if (dayPlan.config) {
                    const year = dayPlan.config.year;
                    const today = localDayPlanDate();
                    const yesterday = addDaysIsoDate(today, -1);
                    new Setting(containerEl)
                        .setName('每日八格模板')
                        .addButton((button) =>
                            button
                                .setButtonText('修改模板标题…')
                                .setDisabled(
                                    !dayPlan.config?.enabled ||
                                        !today.startsWith(`${year}-`),
                                )
                                .onClick(() => {
                                    void (async () => {
                                        const slots =
                                            await openDayPlanTemplateEditModal(
                                                this.view.plugin,
                                                slotsRecordToArray(
                                                    dayPlan.config?.slots,
                                                ),
                                            );
                                        if (
                                            !slots ||
                                            this.view.file !== this.targetFile
                                        )
                                            return;
                                        await editDayPlanTemplate(this.view, {
                                            slots,
                                            start: today,
                                            end: `${year}-12-31`,
                                        });
                                        this.render({ preserveScroll: true });
                                    })().catch((error) =>
                                        onPluginError(
                                            error,
                                            'command',
                                            'edit-day-plan-template',
                                        ),
                                    );
                                }),
                        )
                        .addButton((button) =>
                            button
                                .setButtonText('更新历史标题…')
                                .setDisabled(
                                    !dayPlan.config?.enabled ||
                                        yesterday < `${year}-01-01`,
                                )
                                .onClick(() => {
                                    void (async () => {
                                        const range =
                                            await openDayPlanHistoryRangeModal(
                                                this.view.plugin,
                                                year,
                                                yesterday,
                                            );
                                        if (
                                            !range ||
                                            this.view.file !== this.targetFile
                                        )
                                            return;
                                        await editDayPlanTemplate(
                                            this.view,
                                            range,
                                        );
                                        new Notice(
                                            '所选日期的标题已更新，正文保留。',
                                        );
                                    })().catch((error) =>
                                        onPluginError(
                                            error,
                                            'command',
                                            'update-day-plan-history',
                                        ),
                                    );
                                }),
                        );
                    const preview = containerEl.createDiv({
                        cls: 'setting-item-description',
                    });
                    for (const [id, title] of Object.entries(
                        dayPlan.config.slots,
                    ))
                        preview.createDiv({ text: `${id}：${title}` });
                    containerEl.createDiv({
                        cls: 'setting-item-description',
                        text: '修改模板后，今天及后续日期使用新标题。历史日期可按范围单独更新。所有操作仅修改标题，保留正文。',
                    });
                }
                if (!templateMismatch) return;
                if (
                    this.dismissedTemplateMismatchCore === templateMismatch.core
                ) {
                    return;
                }

                const promptCard = containerEl.createDiv({
                    cls: 'mandala-file-settings__template-sync-card',
                });
                promptCard.createDiv({
                    cls: 'mandala-file-settings__template-sync-title',
                    text: tx('当前日期的八格标题与每日模板不同'),
                });
                promptCard.createDiv({
                    cls: 'mandala-file-settings__template-sync-core',
                    text: tx('当前核心：{0}', templateMismatch.core),
                });
                promptCard.createDiv({
                    cls: 'mandala-file-settings__template-sync-text',
                    text: tx(
                        '差异提示：当前核心九宫的 8 个标题已被修改，但尚未写回当前文件模板。',
                    ),
                });
                promptCard.createDiv({
                    cls: 'mandala-file-settings__template-sync-text',
                    text: tx(
                        '是否将当前八格标题设为每日模板？保存后，今天及后续日期使用这组标题，历史日期保持不变，正文保留。',
                    ),
                });

                const actionsEl = promptCard.createDiv({
                    cls: 'mandala-file-settings__template-sync-actions',
                });
                const writeButton = actionsEl.createEl('button', {
                    text: tx('保存为模板'),
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
                        const today = localDayPlanDate();
                        if (
                            dayPlan.config &&
                            today.startsWith(`${dayPlan.config.year}-`)
                        )
                            await editDayPlanTemplate(this.view, {
                                start: today,
                                end: `${dayPlan.config.year}-12-31`,
                            });
                        this.dismissedTemplateMismatchCore = null;
                        this.render({ preserveScroll: true });
                    })().catch((error) =>
                        onPluginError(
                            error,
                            'command',
                            'save-current-day-plan-template',
                        ),
                    );
                });

                const dismissButton = actionsEl.createEl('button', {
                    text: tx('暂不更新'),
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
                sectionGlobalView: tx('当前文件视图覆盖'),
                sectionTimePlan: tx('日计划显示与每日模板'),
                timePlanEnabled: tx('当前文件启用日计划模式'),
                enable9x9View: tx('当前文件启用 9×9 视图'),
                enableNx9View: tx('当前文件启用 nx9 视图'),
                coreSectionMax: tx('当前文件核心格子编号范围（1 ~ n）'),
                subgridMaxDepth: tx('当前文件子九宫最大层级（含核心层）'),
                rangePreviewTitle: tx('当前文件范围总览（实时）'),
                weekStart: tx('当前文件周计划起始日'),
                dayPlanDateHeadingFormat: tx('当前文件日计划日期标题格式'),
                dayPlanDateHeadingCustomTemplate:
                    tx('当前文件自定义日期标题模板'),
            },
            handlers: {
                setTimePlanEnabled: (enabled) => {
                    this.state.general.dayPlanEnabled = enabled;
                    this.render({ preserveScroll: true });
                },
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
            text: tx('取消'),
            cls: 'mod-muted',
        });
        cancelButton.addEventListener('click', () => this.close());

        const saveButton = footerActions.createEl('button', {
            text: tx('保存'),
            cls: 'mod-cta',
        });
        saveButton.addEventListener('click', () => {
            void this.save().catch((error) =>
                onPluginError(error, 'command', 'save-day-plan-settings'),
            );
        });

        if (preserveScroll) {
            window.requestAnimationFrame(() => {
                this.getScrollContainer().scrollTop = scrollTop;
            });
        }
    }

    private async save() {
        if (!this.view.file || this.view.file !== this.targetFile) {
            new Notice(tx('目标文件已切换，请重新打开设置。'));
            return;
        }
        const dayPlan = readDayPlanConfiguration(
            this.view.documentStore.getValue().file.frontmatter,
        );
        const isDayPlanDedicated = !!dayPlan.config;

        if (dayPlan.error) {
            new Notice(dayPlan.error);
            return;
        }
        if (
            isDayPlanDedicated &&
            this.state.general.dayPlanDateHeadingFormat === 'custom' &&
            !isValidDayPlanDateTemplate(
                this.state.general.dayPlanDateHeadingCustomTemplate,
            )
        ) {
            new Notice(
                '自定义标题必须以 {date} 或 ## {date} 开头，且只能使用一行。',
            );
            return;
        }
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
                    const current = readDayPlanConfigurationFromRecord(record);
                    if (!current.config || current.error)
                        throw new Error(
                            current.error ??
                                '日计划配置已修改，请重新打开设置。',
                        );
                    writeDayPlanConfiguration(
                        record,
                        withDayPlanDisplaySettings(
                            {
                                ...current.config,
                                enabled: this.state.general.dayPlanEnabled,
                            },
                            this.state.general,
                        ),
                    );
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

        if (isDayPlanDedicated && this.state.general.dayPlanEnabled) {
            await refreshCurrentDayPlanDateHeadings(this.view.plugin, {
                notify: false,
                file: this.view.file,
            });
        }

        new Notice(tx('当前文件九宫设置已保存到 YAML。'));
        this.close();
    }
}
