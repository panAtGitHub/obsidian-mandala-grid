import { Modal, Notice, Setting } from 'obsidian';
import MandalaGrid from 'src/main';

export const openNx9RowsPerPageModal = (
    plugin: MandalaGrid,
    initialRowsPerPage: number,
) =>
    new Promise<number | null>((resolve) => {
        const modal = new Nx9RowsPerPageModal(
            plugin,
            initialRowsPerPage,
            resolve,
        );
        modal.open();
    });

class Nx9RowsPerPageModal extends Modal {
    private resolved = false;
    private rowsPerPage: string;

    constructor(
        plugin: MandalaGrid,
        initialRowsPerPage: number,
        private resolve: (value: number | null) => void,
    ) {
        super(plugin.app);
        this.rowsPerPage = String(initialRowsPerPage);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.setTitle('设置 nx9 每页行数');

        new Setting(contentEl)
            .setName('每页行数')
            .setDesc('输入一个大于等于 1 的整数。')
            .addText((text) => {
                text.setPlaceholder('3');
                text.setValue(this.rowsPerPage);
                text.onChange((value) => {
                    this.rowsPerPage = value.trim();
                });
            });

        new Setting(contentEl).addButton((button) => {
            button
                .setButtonText('确认')
                .setCta()
                .onClick(() => {
                    const rowsPerPage = Number(this.rowsPerPage);
                    if (!Number.isInteger(rowsPerPage) || rowsPerPage < 1) {
                        new Notice('请输入大于等于 1 的整数。');
                        return;
                    }
                    this.resolveOnce(rowsPerPage);
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
