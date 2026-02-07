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
    private folderSuggestEl: HTMLElement | null = null;
    private removeFolderSuggestListeners: (() => void) | null = null;

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

        // Folder path is a vault-relative path, like Obsidian core settings.
        let folderPath = '';
        const existingPath =
            this.plugin.settings.getValue().general.mandalaTemplatesFilePath;
        if (existingPath) {
            const lastSlash = existingPath.lastIndexOf('/');
            folderPath = lastSlash === -1 ? '' : existingPath.slice(0, lastSlash);
        }

        const folderSetting = new Setting(contentEl)
            .setName('存放模板文件的文件夹')
            .setDesc('请输入库内文件夹路径；留空表示根目录')
            .addText((text) => {
                text.setPlaceholder('例如：3resources/templates');
                text.setValue(folderPath);
                text.onChange((value) => {
                    folderPath = value.trim();
                });
            });
        folderSetting.settingEl.addClass('mandala-folder-suggest__setting');

        const folders = this.app.vault
            .getAllLoadedFiles()
            .filter((file): file is TFolder => file instanceof TFolder)
            .map((folder) => folder.path)
            .filter((p) => p && p !== '/')
            .sort((a, b) => a.localeCompare(b));

        const inputEl = folderSetting.controlEl.querySelector(
            'input',
        ) as HTMLInputElement | null;

        const ensureSuggestEl = () => {
            if (this.folderSuggestEl) return this.folderSuggestEl;
            const el = document.createElement('div');
            el.className = 'mandala-folder-suggest-float';
            el.setAttribute('role', 'listbox');
            document.body.appendChild(el);
            this.folderSuggestEl = el;
            return el;
        };

        const hideSuggestions = () => {
            if (!this.folderSuggestEl) return;
            this.folderSuggestEl.remove();
            this.folderSuggestEl = null;
        };

        const positionSuggestEl = () => {
            if (!inputEl || !this.folderSuggestEl) return;
            const rect = inputEl.getBoundingClientRect();
            this.folderSuggestEl.style.left = `${Math.floor(rect.left)}px`;
            this.folderSuggestEl.style.top = `${Math.floor(rect.bottom + 6)}px`;
            this.folderSuggestEl.style.width = `${Math.floor(rect.width)}px`;
        };

        const renderSuggestions = (queryRaw: string) => {
            const query = queryRaw.trim().toLowerCase();
            if (!query) {
                hideSuggestions();
                return;
            }

            const startsWith: string[] = [];
            const includes: string[] = [];
            for (const p of folders) {
                const lower = p.toLowerCase();
                if (lower.startsWith(query)) {
                    startsWith.push(p);
                } else if (lower.includes(query)) {
                    includes.push(p);
                }
            }
            const matches = [...startsWith, ...includes].slice(0, 12);
            if (matches.length === 0) {
                hideSuggestions();
                return;
            }

            const suggestEl = ensureSuggestEl();
            suggestEl.textContent = '';
            positionSuggestEl();

            for (const match of matches) {
                const item = suggestEl.createEl('button', {
                    cls: 'mandala-folder-suggest__item',
                    text: match,
                });
                item.type = 'button';
                item.setAttribute('role', 'option');
                item.addEventListener('mousedown', (e) => {
                    // Prevent input blur before click selection.
                    e.preventDefault();
                });
                item.addEventListener('click', () => {
                    folderPath = match;
                    if (inputEl) inputEl.value = match;
                    hideSuggestions();
                });
            }
        };

        if (inputEl) {
            const onInput = () => renderSuggestions(inputEl.value);
            const onFocus = () => renderSuggestions(inputEl.value);
            const onBlur = () => window.setTimeout(() => hideSuggestions(), 120);
            const onWindowUpdate = () => positionSuggestEl();
            const onDocPointerDown = (e: Event) => {
                const t = e.target as HTMLElement | null;
                if (!t) return;
                if (t === inputEl) return;
                if (this.folderSuggestEl && this.folderSuggestEl.contains(t))
                    return;
                hideSuggestions();
            };

            inputEl.addEventListener('input', onInput);
            inputEl.addEventListener('focus', onFocus);
            inputEl.addEventListener('blur', onBlur);
            window.addEventListener('resize', onWindowUpdate);
            window.addEventListener('scroll', onWindowUpdate, true);
            document.addEventListener('pointerdown', onDocPointerDown, true);

            this.removeFolderSuggestListeners = () => {
                inputEl.removeEventListener('input', onInput);
                inputEl.removeEventListener('focus', onFocus);
                inputEl.removeEventListener('blur', onBlur);
                window.removeEventListener('resize', onWindowUpdate);
                window.removeEventListener('scroll', onWindowUpdate, true);
                document.removeEventListener(
                    'pointerdown',
                    onDocPointerDown,
                    true,
                );
            };
        }

        new Setting(contentEl)
            .setName('新建模板文件')
            .setDesc('文件名为 mandala-templates.md')
            .addButton((button) => {
                button.setButtonText('新建').setCta().onClick(async () => {
                    const folder = this.getFolderFromPath(folderPath);
                    if (!folder) {
                        new Notice('未找到该文件夹，请检查路径。');
                        return;
                    }

                    const existing = this.getTemplatesFileInFolder(folder);
                    if (existing) {
                        this.resolveOnce(existing);
                        this.close();
                        return;
                    }

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
        this.removeFolderSuggestListeners?.();
        this.removeFolderSuggestListeners = null;
        if (this.folderSuggestEl) {
            this.folderSuggestEl.remove();
            this.folderSuggestEl = null;
        }
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

    private getFolderFromPath(path: string): TFolder | null {
        if (!path) return this.app.vault.getRoot();
        const file = this.app.vault.getAbstractFileByPath(path);
        return file instanceof TFolder ? file : null;
    }

    private getTemplatesFileInFolder(folder: TFolder): TFile | null {
        const folderPath = folder.path && folder.path !== '/' ? folder.path : '';
        const filePath = folderPath
            ? `${folderPath}/mandala-templates.md`
            : 'mandala-templates.md';
        const file = this.app.vault.getAbstractFileByPath(filePath);
        return file instanceof TFile ? file : null;
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
