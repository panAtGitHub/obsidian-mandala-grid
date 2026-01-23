import {
    FuzzySuggestModal,
    Modal,
    Notice,
    Setting,
    TFile,
    TFolder,
} from 'obsidian';
import MandalaGrid from 'src/main';
import { createNewFile } from 'src/obsidian/events/workspace/effects/create-new-file';
import {
    MandalaTemplate,
    formatTemplatePreview,
} from 'src/lib/mandala/mandala-templates';

export const openMandalaTemplateNameModal = (plugin: MandalaGrid) =>
    new Promise<string | null>((resolve) => {
        const modal = new MandalaTemplateNameModal(plugin, resolve);
        modal.open();
    });

export const openMandalaTemplateSelectModal = (
    plugin: MandalaGrid,
    templates: MandalaTemplate[],
) =>
    new Promise<MandalaTemplate | null>((resolve) => {
        const modal = new MandalaTemplateSelectModal(plugin, templates, resolve);
        modal.open();
    });

export const openMandalaTemplatesFileModal = (plugin: MandalaGrid) =>
    new Promise<TFile | null>((resolve) => {
        const modal = new MandalaTemplatesFileModal(plugin, resolve);
        modal.open();
    });

class MandalaTemplateNameModal extends Modal {
    private resolved = false;
    private name = '';

    constructor(
        plugin: MandalaGrid,
        private resolve: (value: string | null) => void,
    ) {
        super(plugin.app);
    }

    onOpen() {
        this.setTitle('新建模板名称');
        const { contentEl } = this;
        contentEl.empty();

        new Setting(contentEl)
            .setName('模板名称')
            .addText((text) => {
                text.onChange((value) => {
                    this.name = value.trim();
                });
            });

        const actions = contentEl.createDiv({
            cls: 'mandala-templates-modal__actions',
        });
        const cancelButton = actions.createEl('button', { text: '取消' });
        cancelButton.addEventListener('click', () => {
            this.resolveOnce(null);
            this.close();
        });
        const confirmButton = actions.createEl('button', { text: '确认' });
        confirmButton.classList.add('is-enabled');
        confirmButton.addEventListener('click', () => {
            if (!this.name) {
                new Notice('模板名称不能为空。');
                return;
            }
            this.resolveOnce(this.name);
            this.close();
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

class MandalaTemplateSelectModal extends Modal {
    private resolved = false;
    private activeIndex: number | null = null;
    private previewEl: HTMLElement | null = null;
    private confirmButton: HTMLElement | null = null;

    constructor(
        plugin: MandalaGrid,
        private templates: MandalaTemplate[],
        private resolve: (value: MandalaTemplate | null) => void,
    ) {
        super(plugin.app);
    }

    onOpen() {
        this.setTitle('选择九宫格模板');
        const { contentEl } = this;
        contentEl.empty();

        const list = contentEl.createDiv({
            cls: 'mandala-templates-modal__list',
        });
        this.templates.forEach((template, index) => {
            const button = list.createEl('button', {
                cls: 'mandala-templates-modal__item',
                text: template.name,
            });
            button.addEventListener('click', () => {
                this.setActive(index);
            });
        });

        this.previewEl = contentEl.createDiv({
            cls: 'mandala-templates-modal__preview',
            text: '请选择一个模板查看内容。',
        });

        const actions = contentEl.createDiv({
            cls: 'mandala-templates-modal__actions',
        });
        const cancelButton = actions.createEl('button', {
            text: '取消',
        });
        cancelButton.addEventListener('click', () => {
            this.resolveOnce(null);
            this.close();
        });
        this.confirmButton = actions.createEl('button', {
            text: '确认',
        });
        this.confirmButton.addEventListener('click', () => {
            if (this.activeIndex === null) {
                new Notice('请先选择一个模板。');
                return;
            }
            this.resolveOnce(this.templates[this.activeIndex] ?? null);
            this.close();
        });
        this.updateConfirmState();
    }

    onClose() {
        this.resolveOnce(null);
        this.contentEl.empty();
    }

    private setActive(index: number) {
        this.activeIndex = index;
        const children = this.contentEl.querySelectorAll(
            '.mandala-templates-modal__item',
        );
        children.forEach((child, idx) => {
            if (idx === index) {
                child.classList.add('is-active');
            } else {
                child.classList.remove('is-active');
            }
        });
        const template = this.templates[index];
        if (this.previewEl && template) {
            this.previewEl.textContent = formatTemplatePreview(template);
        }
        this.updateConfirmState();
    }

    private updateConfirmState() {
        if (!this.confirmButton) return;
        if (this.activeIndex === null) {
            this.confirmButton.setAttribute('disabled', 'true');
            this.confirmButton.classList.remove('is-enabled');
        } else {
            this.confirmButton.removeAttribute('disabled');
            this.confirmButton.classList.add('is-enabled');
        }
    }

    private resolveOnce(value: MandalaTemplate | null) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(value);
    }
}

class MandalaTemplatesFileModal extends Modal {
    private resolved = false;

    constructor(
        private plugin: MandalaGrid,
        private resolve: (value: TFile | null) => void,
    ) {
        super(plugin.app);
    }

    onOpen() {
        this.setTitle('指定模板文件');
        const { contentEl } = this;
        contentEl.empty();

        new Setting(contentEl)
            .setName('新建模板文件')
            .setDesc('选择保存位置，文件名为 mandala-templates.md')
            .addButton((button) => {
                button.setButtonText('新建').setCta().onClick(async () => {
                    const folder = await openMandalaTemplatesFolderModal(
                        this.app,
                    );
                    if (!folder) return;
                    const file = await this.createTemplateFile(folder);
                    if (!file) return;
                    this.resolveOnce(file);
                    this.close();
                });
            });

        new Setting(contentEl)
            .setName('选择已有模板文件')
            .addButton((button) => {
                button.setButtonText('选择').onClick(() => {
                    const modal = new MandalaTemplatesFileSuggestModal(
                        this.app,
                        (file) => {
                            this.resolveOnce(file);
                            this.close();
                        },
                    );
                    modal.open();
                });
            });
    }

    onClose() {
        this.resolveOnce(null);
        this.contentEl.empty();
    }

    private async createTemplateFile(folder: TFolder) {
        try {
            const content = '---\nmandala-templates: true\n---\n';
            return await createNewFile(
                this.plugin,
                folder,
                content,
                'mandala-templates',
            );
        } catch {
            new Notice('创建模板文件失败。');
            return null;
        }
    }

    private resolveOnce(value: TFile | null) {
        if (this.resolved) return;
        this.resolved = true;
        this.resolve(value);
    }
}

class MandalaTemplatesFileSuggestModal extends FuzzySuggestModal<TFile> {
    constructor(app: MandalaGrid['app'], private onChoose: (file: TFile) => void) {
        super(app);
    }

    getItems(): TFile[] {
        return this.app.vault.getMarkdownFiles();
    }

    getItemText(item: TFile): string {
        return item.path;
    }

    onChooseItem(item: TFile) {
        this.onChoose(item);
    }
}

const openMandalaTemplatesFolderModal = (app: MandalaGrid['app']) =>
    new Promise<TFolder | null>((resolve) => {
        const modal = new MandalaTemplatesFolderSuggestModal(app, resolve);
        modal.open();
    });

class MandalaTemplatesFolderSuggestModal extends FuzzySuggestModal<TFolder> {
    private resolved = false;
    constructor(
        app: MandalaGrid['app'],
        private onChoose: (folder: TFolder | null) => void,
    ) {
        super(app);
    }

    getItems(): TFolder[] {
        return this.app.vault
            .getAllLoadedFiles()
            .filter((file): file is TFolder => file instanceof TFolder);
    }

    getItemText(item: TFolder): string {
        return item.path || '/';
    }

    onChooseItem(item: TFolder) {
        this.resolveOnce(item);
    }

    onClose() {
        this.resolveOnce(null);
    }

    private resolveOnce(folder: TFolder | null) {
        if (this.resolved) return;
        this.resolved = true;
        this.onChoose(folder);
    }
}
