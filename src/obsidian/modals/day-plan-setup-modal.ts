import { Modal, Notice, Setting } from 'obsidian';
import MandalaGrid from 'src/main';
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

export const openDayPlanDailyOnlyModal = (
    plugin: MandalaGrid,
    initialValue: boolean,
) =>
    new Promise<DayPlanWizardStepResult<boolean>>((resolve) => {
        const modal = new DayPlanDailyOnlyModal(plugin, initialValue, resolve);
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
        this.setTitle('确认年计划年份');

        new Setting(contentEl)
            .setName('年份')
            .setDesc('默认取今天年份，可改为其他年份。')
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
        this.setTitle('输入 8 个格子标题');

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

class DayPlanDisplayOptionsModal extends Modal {
    private resolved = false;
    private weekStart: WeekStart;
    private dateHeadingFormat: DayPlanDateHeadingFormat;

    constructor(
        plugin: MandalaGrid,
        initialValue: DayPlanDisplayOptions,
        private resolve: (
            value: DayPlanWizardStepResult<DayPlanDisplayOptions>,
        ) => void,
    ) {
        super(plugin.app);
        this.weekStart = initialValue.weekStart;
        this.dateHeadingFormat = initialValue.dateHeadingFormat;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle('日/周显示参数');

        new Setting(contentEl)
            .setName('周计划起始日')
            .setDesc('周视图中一周从周一或周日开始。')
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions({
                        monday: '周一开始',
                        sunday: '周日开始',
                    } satisfies Record<WeekStart, string>)
                    .setValue(this.weekStart)
                    .onChange((value) => {
                        this.weekStart = value as WeekStart;
                    });
            });

        new Setting(contentEl)
            .setName('日计划日期标题格式')
            .setDesc('控制如“## 2026-03-16 …”这类日期标题的显示格式。')
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions({
                        'date-only': '仅日期',
                        'zh-full': '日期 + 周一到周日',
                        'zh-short': '日期 + 一到日',
                        'en-short': 'Date + mon~sun',
                        custom: '自定义模板',
                    } satisfies Record<DayPlanDateHeadingFormat, string>)
                    .setValue(this.dateHeadingFormat)
                    .onChange((value) => {
                        this.dateHeadingFormat =
                            value as DayPlanDateHeadingFormat;
                    });
            });

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

class DayPlanDailyOnlyModal extends Modal {
    private resolved = false;
    private enabled: boolean;

    constructor(
        plugin: MandalaGrid,
        initialValue: boolean,
        private resolve: (value: DayPlanWizardStepResult<boolean>) => void,
    ) {
        super(plugin.app);
        this.enabled = initialValue;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle('每日仅九宫格设置');

        new Setting(contentEl)
            .setName('推荐：每日仅九宫格（不展开子九宫）')
            .setDesc('开启后将不再创建如 1.1.1 这类更深层子九宫。')
            .addToggle((toggle) => {
                toggle.setValue(this.enabled);
                toggle.onChange((value) => {
                    this.enabled = value;
                });
            });

        appendWizardNote(contentEl);
        appendWizardActions(contentEl, {
            primaryText: '下一步',
            onPrimary: () => {
                this.resolveOnce({ action: 'next', value: this.enabled });
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

    private resolveOnce(value: DayPlanWizardStepResult<boolean>) {
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
