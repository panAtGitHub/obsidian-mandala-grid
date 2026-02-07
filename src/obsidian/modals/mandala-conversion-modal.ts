import { Modal, Setting } from 'obsidian';
import MandalaGrid from 'src/main';

export type MandalaConversionChoice = 'convert' | 'cancel';

export type MandalaConversionModalOptions = {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
};

export const openMandalaConversionModal = (
    plugin: MandalaGrid,
    options: MandalaConversionModalOptions,
) => {
    return new Promise<MandalaConversionChoice>((resolve) => {
        const modal = new MandalaConversionModal(plugin, options, resolve);
        modal.open();
    });
};

class MandalaConversionModal extends Modal {
    private resolved = false;

    constructor(
        plugin: MandalaGrid,
        private options: MandalaConversionModalOptions,
        private resolve: (choice: MandalaConversionChoice) => void,
    ) {
        super(plugin.app);
    }

    onOpen() {
        const { contentEl } = this;
        const { title, message } = this.options;
        this.setTitle(title);
        contentEl.empty();
        contentEl
            .createEl('p', { text: message })
            .setCssProps({ 'white-space': 'pre-wrap' });

        const confirmText = this.options.confirmText ?? '转换';
        const cancelText = this.options.cancelText ?? '取消';

        new Setting(contentEl).addButton((button) => {
            button.setButtonText(confirmText).setCta().onClick(() => {
                this.resolveOnce('convert');
                this.close();
            });
        });
        new Setting(contentEl).addButton((button) => {
            button.setButtonText(cancelText).onClick(() => {
                this.resolveOnce('cancel');
                this.close();
            });
        });
    }

    onClose() {
        this.resolveOnce('cancel');
        this.contentEl.empty();
    }

    private resolveOnce(choice: MandalaConversionChoice) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(choice);
    }
}
