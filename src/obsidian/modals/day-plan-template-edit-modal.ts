import { Modal, Notice, Setting } from 'obsidian';
import type MandalaGrid from 'src/main';
import { allSlotsFilled, isIsoDate } from 'src/mandala-display/logic/day-plan';

export const openDayPlanTemplateEditModal = (
    plugin: MandalaGrid,
    slots: string[],
) =>
    new Promise<string[] | null>((resolve) => {
        new DayPlanTemplateEditModal(plugin, slots, resolve).open();
    });

class DayPlanTemplateEditModal extends Modal {
    private saved = false;
    private values: string[];
    constructor(
        plugin: MandalaGrid,
        slots: string[],
        private resolve: (value: string[] | null) => void,
    ) {
        super(plugin.app);
        this.values = [...slots];
    }
    onOpen() {
        this.setTitle('修改每日模板标题');
        this.contentEl.createEl('p', {
            text: '保存后，将更新今天至本年末已有日期的八格标题；后续新日期也使用此模板。历史日期保持不变，正文保留。',
        });
        for (let i = 0; i < 8; i++)
            new Setting(this.contentEl)
                .setName(`格子 ${i + 1}`)
                .addText((text) =>
                    text.setValue(this.values[i] ?? '').onChange((value) => {
                        this.values[i] = value;
                    }),
                );
        new Setting(this.contentEl)
            .addButton((button) =>
                button.setButtonText('取消').onClick(() => this.close()),
            )
            .addButton((button) =>
                button
                    .setButtonText('保存')
                    .setCta()
                    .onClick(() => {
                        if (!allSlotsFilled(this.values)) {
                            new Notice('请填写完整的八个标题。');
                            return;
                        }
                        this.saved = true;
                        this.resolve(this.values);
                        this.close();
                    }),
            );
    }
    onClose() {
        if (!this.saved) this.resolve(null);
        this.contentEl.empty();
    }
}

export const openDayPlanHistoryRangeModal = (
    plugin: MandalaGrid,
    year: number,
    yesterday: string,
) =>
    new Promise<{ start: string; end: string } | null>((resolve) => {
        new DayPlanHistoryRangeModal(plugin, year, yesterday, resolve).open();
    });

class DayPlanHistoryRangeModal extends Modal {
    private saved = false;
    private start: string;
    private end: string;
    constructor(
        plugin: MandalaGrid,
        private year: number,
        private yesterday: string,
        private resolve: (value: { start: string; end: string } | null) => void,
    ) {
        super(plugin.app);
        this.start = `${year}-01-01`;
        this.end = yesterday < `${year}-12-31` ? yesterday : `${year}-12-31`;
    }
    onOpen() {
        this.setTitle('更新历史日期标题');
        this.contentEl.createEl('p', {
            text: '使用已保存的每日模板，更新所选日期范围内的八格标题。仅影响当前文件，正文保留。',
        });
        for (const key of ['start', 'end'] as const)
            new Setting(this.contentEl)
                .setName(key === 'start' ? '开始日期' : '结束日期')
                .addText((text) => {
                    text.inputEl.type = 'date';
                    text.inputEl.min = `${this.year}-01-01`;
                    text.inputEl.max = this.end;
                    text.setValue(this[key]).onChange((value) => {
                        this[key] = value;
                    });
                });
        new Setting(this.contentEl)
            .addButton((button) =>
                button.setButtonText('取消').onClick(() => this.close()),
            )
            .addButton((button) =>
                button
                    .setButtonText('更新标题')
                    .setCta()
                    .onClick(() => {
                        if (
                            !isIsoDate(this.start) ||
                            !isIsoDate(this.end) ||
                            this.start > this.end ||
                            this.start < `${this.year}-01-01` ||
                            this.end > `${this.year}-12-31` ||
                            this.end > this.yesterday
                        ) {
                            new Notice(
                                '请选择当前计划年份内、截至昨日的有效日期范围。',
                            );
                            return;
                        }
                        this.saved = true;
                        this.resolve({ start: this.start, end: this.end });
                        this.close();
                    }),
            );
    }
    onClose() {
        if (!this.saved) this.resolve(null);
        this.contentEl.empty();
    }
}
