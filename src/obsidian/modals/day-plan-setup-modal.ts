import { Modal, Notice, Setting } from 'obsidian';
import MandalaGrid from 'src/main';

export type DayPlanChoice = 'confirm' | 'cancel';

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

export const openDayPlanDateInputModal = (
    plugin: MandalaGrid,
    initialDate: string,
) =>
    new Promise<string | null>((resolve) => {
        const modal = new DayPlanDateInputModal(plugin, initialDate, resolve);
        modal.open();
    });

export const openDayPlanYearInputModal = (
    plugin: MandalaGrid,
    initialYear: number,
) =>
    new Promise<number | null>((resolve) => {
        const modal = new DayPlanYearInputModal(plugin, initialYear, resolve);
        modal.open();
    });

export const openDayPlanSlotsInputModal = (
    plugin: MandalaGrid,
    initialSlots: string[],
) =>
    new Promise<string[] | null>((resolve) => {
        const modal = new DayPlanSlotsInputModal(plugin, initialSlots, resolve);
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

class DayPlanDateInputModal extends Modal {
    private resolved = false;
    private date = '';

    constructor(
        plugin: MandalaGrid,
        initialDate: string,
        private resolve: (value: string | null) => void,
    ) {
        super(plugin.app);
        this.date = initialDate;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle('设置中心日期');

        new Setting(contentEl)
            .setName('日期')
            .setDesc('请输入 yyyy-mm-dd（将写入 section 1 的二级标题）')
            .addText((text) => {
                text.setPlaceholder('2026-02-10');
                text.setValue(this.date);
                text.onChange((value) => {
                    this.date = value.trim();
                });
            });

        new Setting(contentEl).addButton((button) => {
            button.setButtonText('确认').setCta().onClick(() => {
                if (!this.date) {
                    new Notice('日期不能为空。');
                    return;
                }
                this.resolveOnce(this.date);
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

    private resolveOnce(value: string | null) {
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
        private resolve: (value: number | null) => void,
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

        new Setting(contentEl).addButton((button) => {
            button.setButtonText('确认').setCta().onClick(() => {
                const year = Number(this.year);
                if (!Number.isInteger(year) || year < 1900 || year > 9999) {
                    new Notice('请输入合法年份。');
                    return;
                }
                this.resolveOnce(year);
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

    private resolveOnce(value: number | null) {
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
        private resolve: (value: string[] | null) => void,
    ) {
        super(plugin.app);
        this.values = Array.from({ length: 8 }, (_, index) => initialSlots[index] ?? '');
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle('输入 8 个格子标题');

        for (let i = 0; i < 8; i += 1) {
            const slotIndex = i;
            new Setting(contentEl)
                .setName(`格子 ${i + 1}`)
                .addText((text) => {
                    text.setValue(this.values[i] ?? '');
                    text.onChange((value) => {
                        this.values[slotIndex] = value.trim();
                    });
                });
        }

        contentEl.createEl('p', {
            text: '提示：后续可在 YAML 区修改，修改后可再次运行命令同步到卡片标题。',
        });

        new Setting(contentEl).addButton((button) => {
            button.setButtonText('确认').setCta().onClick(() => {
                const hasEmpty = this.values.some((value) => value.trim().length === 0);
                if (hasEmpty) {
                    new Notice('请填写完整的 8 个格子标题。');
                    return;
                }
                this.resolveOnce([...this.values]);
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

    private resolveOnce(value: string[] | null) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(value);
    }
}
