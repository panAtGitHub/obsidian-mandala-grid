import { Modal, Notice, Setting } from 'obsidian';
import MandalaGrid from 'src/main';
import {
    buildCenterDateHeading,
    DAY_PLAN_DEFAULT_SLOT_TITLES,
} from 'src/mandala-display/logic/day-plan';
import {
    formatTemplatePreview,
    type MandalaTemplate,
} from 'src/mandala-display/logic/mandala-templates';
import type {
    DayPlanDateHeadingFormat,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';

export type DayPlanSlotsSyncMode =
    | 'all-existing'
    | 'today-and-future'
    | 'template-only';
export type DayPlanDisplayOptions = {
    weekStart: WeekStart;
    dateHeadingFormat: DayPlanDateHeadingFormat;
};
export type DayPlanSlotsSource = 'template' | 'recommended' | 'manual';
export type DayPlanDailySetupValue = {
    slotsSource: DayPlanSlotsSource;
    templateIndex: number | null;
};

export type DayPlanWizardStepResult<T> =
    | { action: 'next'; value: T }
    | { action: 'back' }
    | { action: 'cancel' };

const DAY_PLAN_WIZARD_NOTE =
    '备注：创建后仍可在当前文件设置中调整这些参数。';

export const openDayPlanConfirmModal = (
    plugin: MandalaGrid,
    options: {
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
    },
) =>
    new Promise<boolean>((resolve) => {
        const modal = new DayPlanConfirmModal(plugin, options, resolve);
        modal.open();
    });

export const openDayPlanYearInputModal = (
    plugin: MandalaGrid,
    initialYear: number,
) =>
    new Promise<DayPlanWizardStepResult<number>>((resolve) => {
        const modal = new DayPlanYearInputModal(plugin, initialYear, resolve);
        modal.open();
    });

export const openDayPlanDisplayOptionsModal = (
    plugin: MandalaGrid,
    initialValue: DayPlanDisplayOptions,
) =>
    new Promise<DayPlanWizardStepResult<DayPlanDisplayOptions>>((resolve) => {
        const modal = new DayPlanDisplayOptionsModal(
            plugin,
            initialValue,
            resolve,
        );
        modal.open();
    });

export const openDayPlanDailySetupModal = (
    plugin: MandalaGrid,
    initialValue: DayPlanDailySetupValue,
    templates: MandalaTemplate[],
) =>
    new Promise<DayPlanWizardStepResult<DayPlanDailySetupValue>>((resolve) => {
        const modal = new DayPlanDailySetupModal(
            plugin,
            initialValue,
            templates,
            resolve,
        );
        modal.open();
    });

export const openDayPlanSlotsInputModal = (
    plugin: MandalaGrid,
    initialSlots: string[],
    options: { primaryText?: string } = {},
) =>
    new Promise<DayPlanWizardStepResult<string[]>>((resolve) => {
        const modal = new DayPlanSlotsInputModal(
            plugin,
            initialSlots,
            options,
            resolve,
        );
        modal.open();
    });

export const openDayPlanSlotsSyncModeModal = (plugin: MandalaGrid) =>
    new Promise<DayPlanSlotsSyncMode | null>((resolve) => {
        const modal = new DayPlanSlotsSyncModeModal(plugin, resolve);
        modal.open();
    });

class DayPlanConfirmModal extends Modal {
    private resolved = false;

    constructor(
        plugin: MandalaGrid,
        private options: {
            title: string;
            message: string;
            confirmText?: string;
            cancelText?: string;
        },
        private resolve: (value: boolean) => void,
    ) {
        super(plugin.app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle(this.options.title);
        contentEl
            .createEl('p', { text: this.options.message })
            .setCssProps({ 'white-space': 'pre-wrap' });

        new Setting(contentEl).addButton((button) => {
            button
                .setButtonText(this.options.confirmText ?? '确认')
                .setCta()
                .onClick(() => {
                    this.resolveOnce(true);
                    this.close();
                });
        });

        new Setting(contentEl).addButton((button) => {
            button
                .setButtonText(this.options.cancelText ?? '取消')
                .onClick(() => {
                    this.resolveOnce(false);
                    this.close();
                });
        });
    }

    onClose() {
        this.resolveOnce(false);
        this.contentEl.empty();
    }

    private resolveOnce(value: boolean) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(value);
    }
}

class DayPlanYearInputModal extends Modal {
    private resolved = false;
    private year: string;

    constructor(
        plugin: MandalaGrid,
        initialYear: number,
        private resolve: (value: DayPlanWizardStepResult<number>) => void,
    ) {
        super(plugin.app);
        this.year = String(initialYear);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle('一，「年计划」设置页');

        new Setting(contentEl)
            .setName('1）确认「年份」')
            .setDesc('默认为「今年」，可输入其他年份。')
            .addText((text) => {
                text.setPlaceholder('2026');
                text.setValue(this.year);
                text.onChange((value) => {
                    this.year = value.trim();
                });
            });

        appendWizardNote(contentEl);
        appendWizardActions(contentEl, {
            primaryText: '下一步',
            onPrimary: () => {
                const year = Number(this.year);
                if (!Number.isInteger(year) || year < 1900 || year > 9999) {
                    new Notice('请输入合法年份。');
                    return;
                }
                this.resolveOnce({ action: 'next', value: year });
                this.close();
            },
            onCancel: () => {
                this.resolveOnce({ action: 'cancel' });
                this.close();
            },
        });
    }

    onClose() {
        this.resolveOnce({ action: 'cancel' });
        this.contentEl.empty();
    }

    private resolveOnce(value: DayPlanWizardStepResult<number>) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(value);
    }
}

class DayPlanDisplayOptionsModal extends Modal {
    private resolved = false;
    private weekStart: WeekStart;
    private dateHeadingFormat: Exclude<DayPlanDateHeadingFormat, 'custom'>;

    constructor(
        plugin: MandalaGrid,
        initialValue: DayPlanDisplayOptions,
        private resolve: (
            value: DayPlanWizardStepResult<DayPlanDisplayOptions>,
        ) => void,
    ) {
        super(plugin.app);
        this.weekStart = initialValue.weekStart;
        this.dateHeadingFormat = normalizeDateHeadingFormat(
            initialValue.dateHeadingFormat,
        );
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle('二，「周计划」设置页');
        const sampleDate = new Date();

        const weekStartSetting = new Setting(contentEl)
            .setName('1）确认「周计划」起始日')
            .setDesc('每周的第一天从「周一」或「周日」开始。')
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions({
                        monday: '周一',
                        sunday: '周日',
                    } satisfies Record<WeekStart, string>)
                    .setValue(this.weekStart)
                    .onChange((value) => {
                        this.weekStart = value as WeekStart;
                        renderPreview();
                    });
            });
        const weekPreviewEl = createPreviewPill(weekStartSetting.descEl);

        const dateHeadingSetting = new Setting(contentEl)
            .setName('2）日期标题格式')
            .setDesc('可选项：选择日期标题的显示样式')
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions({
                        'date-only': '仅日期',
                        'zh-full': '日期 + 周一到周日',
                        'zh-short': '日期 + 一到日',
                        'en-short': '日期 + Mon~Sun',
                    } satisfies Record<
                        Exclude<DayPlanDateHeadingFormat, 'custom'>,
                        string
                    >)
                    .setValue(this.dateHeadingFormat)
                    .onChange((value) => {
                        this.dateHeadingFormat =
                            value as Exclude<DayPlanDateHeadingFormat, 'custom'>;
                        renderPreview();
                    });
            });
        const headingPreviewEl = createPreviewPill(dateHeadingSetting.descEl);
        const renderPreview = () => {
            weekPreviewEl.setText(`预览：${buildWeekStartPreview(this.weekStart)}`);
            headingPreviewEl.setText(
                `预览：${buildDateHeadingPreview(sampleDate, this.dateHeadingFormat)}`,
            );
        };
        renderPreview();

        appendWizardNote(contentEl);
        appendWizardActions(contentEl, {
            primaryText: '下一步',
            onPrimary: () => {
                this.resolveOnce({
                    action: 'next',
                    value: {
                        weekStart: this.weekStart,
                        dateHeadingFormat: this.dateHeadingFormat,
                    },
                });
                this.close();
            },
            onBack: () => {
                this.resolveOnce({ action: 'back' });
                this.close();
            },
            onCancel: () => {
                this.resolveOnce({ action: 'cancel' });
                this.close();
            },
        });
    }

    onClose() {
        this.resolveOnce({ action: 'cancel' });
        this.contentEl.empty();
    }

    private resolveOnce(value: DayPlanWizardStepResult<DayPlanDisplayOptions>) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(value);
    }
}

class DayPlanDailySetupModal extends Modal {
    private resolved = false;
    private slotsSource: DayPlanSlotsSource;
    private templateIndex: number | null;

    constructor(
        plugin: MandalaGrid,
        initialValue: DayPlanDailySetupValue,
        private templates: MandalaTemplate[],
        private resolve: (
            value: DayPlanWizardStepResult<DayPlanDailySetupValue>,
        ) => void,
    ) {
        super(plugin.app);
        this.slotsSource = normalizeSlotsSource(
            initialValue.slotsSource,
            templates.length,
        );
        this.templateIndex = normalizeTemplateIndex(
            initialValue.templateIndex,
            templates.length,
        );
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle('三，「日计划」设置页');

        new Setting(contentEl)
            .setName('1）「日计划」视图页')
            .setDesc('提示：每日计划默认为 3x3 九宫格视图，不展开更深层的子九宫；默认关闭9x9视图。');

        const sourceOptions: Record<string, string> = {};
        if (this.templates.length > 0) {
            sourceOptions.template = '使用已配置模板';
        }
        sourceOptions.recommended = '使用插件推荐模板';
        sourceOptions.manual = '手动输入 8 个标题';

        const sourceSetting = new Setting(contentEl)
            .setName('2）8 格标题来源')
            .setDesc('在这里决定 8 个格子的标题从哪里来。')
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions(sourceOptions)
                    .setValue(this.slotsSource)
                    .onChange((value) => {
                        this.slotsSource = normalizeSlotsSource(
                            value as DayPlanSlotsSource,
                            this.templates.length,
                        );
                        renderPreview();
                    });
            });
        const sourceDetailEl = sourceSetting.descEl.createDiv({
            cls: 'mandala-day-plan-wizard__preview-card',
        });
        sourceDetailEl.setCssProps({
            'margin-top': '8px',
            padding: '10px 12px',
            'border-radius': '12px',
            border: '1px solid var(--background-modifier-border)',
            'background-color': 'var(--background-secondary)',
            'white-space': 'pre-wrap',
            'font-size': 'var(--font-ui-smaller)',
            'line-height': '1.6',
        });

        const templateSetting = new Setting(contentEl)
            .setName('模板名称')
            .setDesc('已配置模板来源时，可直接在这里切换模板。')
            .addDropdown((dropdown) => {
                this.templates.forEach((template, index) => {
                    dropdown.addOption(String(index), template.name);
                });
                dropdown
                    .setValue(String(this.templateIndex ?? 0))
                    .onChange((value) => {
                        const nextIndex = Number(value);
                        this.templateIndex = Number.isInteger(nextIndex)
                            ? nextIndex
                            : 0;
                        renderPreview();
                    });
            });
        const templatePreviewEl = templateSetting.descEl.createDiv({
            cls: 'mandala-day-plan-wizard__preview-card',
        });
        templatePreviewEl.setCssProps({
            'margin-top': '8px',
            padding: '10px 12px',
            'border-radius': '12px',
            border: '1px solid var(--background-modifier-border)',
            'background-color': 'var(--background-secondary)',
            'white-space': 'pre-wrap',
            'font-size': 'var(--font-ui-smaller)',
            'line-height': '1.6',
        });

        const setElementDisplay = (
            element: HTMLElement,
            display: '' | 'none',
        ) => {
            element.setCssProps({
                display,
            });
        };

        const renderPreview = () => {
            if (this.slotsSource === 'template') {
                setElementDisplay(sourceDetailEl, 'none');
                setElementDisplay(templateSetting.settingEl, '');
                const activeTemplate =
                    this.templates[this.templateIndex ?? 0] ?? null;
                templatePreviewEl.setText(
                    activeTemplate
                        ? formatTemplatePreview(activeTemplate)
                        : '未找到可用模板。',
                );
                return;
            }

            setElementDisplay(templateSetting.settingEl, 'none');
            if (this.slotsSource === 'recommended') {
                setElementDisplay(sourceDetailEl, '');
                sourceDetailEl.setText(
                    formatSlotsPreview(DAY_PLAN_DEFAULT_SLOT_TITLES),
                );
                templatePreviewEl.empty();
                return;
            }

            setElementDisplay(sourceDetailEl, '');
            sourceDetailEl.setText(
                '将进入手动填写页，你可以逐个设置 8 个格子的标题。',
            );
            templatePreviewEl.empty();
        };
        renderPreview();

        appendWizardNote(contentEl);
        appendWizardActions(contentEl, {
            primaryText: '下一步',
            onPrimary: () => {
                this.resolveOnce({
                    action: 'next',
                    value: {
                        slotsSource: this.slotsSource,
                        templateIndex: this.templateIndex,
                    },
                });
                this.close();
            },
            onBack: () => {
                this.resolveOnce({ action: 'back' });
                this.close();
            },
            onCancel: () => {
                this.resolveOnce({ action: 'cancel' });
                this.close();
            },
        });
    }

    onClose() {
        this.resolveOnce({ action: 'cancel' });
        this.contentEl.empty();
    }

    private resolveOnce(value: DayPlanWizardStepResult<DayPlanDailySetupValue>) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(value);
    }
}

class DayPlanSlotsInputModal extends Modal {
    private resolved = false;
    private values: string[];

    constructor(
        plugin: MandalaGrid,
        initialSlots: string[],
        private options: { primaryText?: string },
        private resolve: (value: DayPlanWizardStepResult<string[]>) => void,
    ) {
        super(plugin.app);
        this.values = Array.from(
            { length: 8 },
            (_, index) => initialSlots[index] ?? '',
        );
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle('四，「日计划模板」设置页');

        for (let i = 0; i < 8; i += 1) {
            const slotIndex = i;
            new Setting(contentEl).setName(`格子 ${i + 1}`).addText((text) => {
                text.setValue(this.values[i] ?? '');
                text.onChange((value) => {
                    this.values[slotIndex] = value.trim();
                });
            });
        }

        contentEl.createEl('p', {
            text: '提示：后续可在 YAML 区修改，修改后可再次运行命令同步到卡片标题。',
        });

        appendWizardNote(contentEl);
        appendWizardActions(contentEl, {
            primaryText: this.options.primaryText ?? '完成',
            onPrimary: () => {
                const hasEmpty = this.values.some(
                    (value) => value.trim().length === 0,
                );
                if (hasEmpty) {
                    new Notice('请填写完整的 8 个格子标题。');
                    return;
                }
                this.resolveOnce({ action: 'next', value: [...this.values] });
                this.close();
            },
            onBack: () => {
                this.resolveOnce({ action: 'back' });
                this.close();
            },
            onCancel: () => {
                this.resolveOnce({ action: 'cancel' });
                this.close();
            },
        });
    }

    onClose() {
        this.resolveOnce({ action: 'cancel' });
        this.contentEl.empty();
    }

    private resolveOnce(value: DayPlanWizardStepResult<string[]>) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(value);
    }
}

class DayPlanSlotsSyncModeModal extends Modal {
    private resolved = false;

    constructor(
        plugin: MandalaGrid,
        private resolve: (value: DayPlanSlotsSyncMode | null) => void,
    ) {
        super(plugin.app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle('检测到日计划模板已变更');

        contentEl.createEl('p', {
            text: '请选择如何同步已存在的格子标题：',
        });

        new Setting(contentEl)
            .setName('替换所有已存在日期的格子标题')
            .setDesc('会覆盖所有已存在 section 的标题行，正文内容不变。')
            .addButton((button) => {
                button
                    .setButtonText('全部替换')
                    .setCta()
                    .onClick(() => {
                        this.resolveOnce('all-existing');
                        this.close();
                    });
            });

        new Setting(contentEl)
            .setName('仅替换今天及以后的日期')
            .setDesc('仅覆盖今天及未来日期的标题行，历史日期保持不变。')
            .addButton((button) => {
                button.setButtonText('今天及以后').onClick(() => {
                    this.resolveOnce('today-and-future');
                    this.close();
                });
            });

        new Setting(contentEl)
            .setName('仅更新模板，不改已有内容')
            .setDesc('本次不修改任何已存在卡片，后续新日期按模板生成。')
            .addButton((button) => {
                button.setButtonText('仅更新模板').onClick(() => {
                    this.resolveOnce('template-only');
                    this.close();
                });
            });

        new Setting(contentEl).addButton((button) => {
            button.setButtonText('取消').onClick(() => {
                this.resolveOnce(null);
                this.close();
            });
        });
    }

    onClose() {
        this.resolveOnce(null);
        this.contentEl.empty();
    }

    private resolveOnce(value: DayPlanSlotsSyncMode | null) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(value);
    }
}

const appendWizardNote = (contentEl: HTMLElement) => {
    contentEl.createEl('p', {
        cls: 'mandala-day-plan-wizard__note',
        text: DAY_PLAN_WIZARD_NOTE,
    });
};

const formatIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildDateHeadingPreview = (
    date: Date,
    format: Exclude<DayPlanDateHeadingFormat, 'custom'>,
) =>
    buildCenterDateHeading(formatIsoDate(date), {
        format,
    });

const buildWeekStartPreview = (weekStart: WeekStart) => {
    const mondayStart = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const sundayStart = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return (weekStart === 'monday' ? mondayStart : sundayStart).join(' | ');
};

const normalizeDateHeadingFormat = (
    format: DayPlanDateHeadingFormat,
): Exclude<DayPlanDateHeadingFormat, 'custom'> => {
    if (format === 'custom') {
        return 'zh-full';
    }
    return format;
};

const normalizeSlotsSource = (
    source: DayPlanSlotsSource,
    templateCount: number,
): DayPlanSlotsSource => {
    if (source === 'template' && templateCount === 0) {
        return 'recommended';
    }
    return source;
};

const normalizeTemplateIndex = (index: number | null, templateCount: number) => {
    if (templateCount === 0) {
        return null;
    }
    if (index === null || index < 0 || index >= templateCount) {
        return 0;
    }
    return index;
};

const formatSlotsPreview = (slots: readonly string[]) =>
    slots.map((slot, index) => `${index + 1}. ${slot}`).join('\n');

const createPreviewPill = (parent: HTMLElement) => {
    const pill = parent.createDiv({ cls: 'mandala-day-plan-wizard__preview-pill' });
    pill.setCssProps({
        display: 'flex',
        'align-items': 'center',
        width: 'fit-content',
        'max-width': '100%',
        'margin-top': '8px',
        padding: '6px 12px',
        'border-radius': '999px',
        border: '1px solid var(--background-modifier-border)',
        'background-color': 'var(--background-secondary)',
        'font-size': 'var(--font-ui-smaller)',
    });
    return pill;
};

const appendWizardActions = (
    contentEl: HTMLElement,
    options: {
        primaryText: string;
        onPrimary: () => void;
        onBack?: () => void;
        onCancel: () => void;
    },
) => {
    const row = new Setting(contentEl);
    row.settingEl.setCssProps({
        'border-top': 'none',
        'padding-top': '0',
    });
    if (options.onBack) {
        const onBack = options.onBack;
        row.addButton((button) => {
            button.setButtonText('上一步').onClick(() => onBack());
        });
    }
    row.addButton((button) => {
        button
            .setButtonText(options.primaryText)
            .setCta()
            .onClick(options.onPrimary);
    });
    row.addButton((button) => {
        button.setButtonText('取消').onClick(options.onCancel);
    });
};
