import { MarkdownView, TFile } from 'obsidian';
import MandalaGrid from 'src/main';

const isMarkdownFile = (file: unknown): file is TFile =>
    file instanceof TFile && file.extension === 'md';

export const rerenderOpenMarkdownPreviews = (plugin: MandalaGrid) => {
    plugin.app.workspace.iterateAllLeaves((leaf) => {
        const view = leaf.view;
        if (!(view instanceof MarkdownView)) return;
        if (view.getMode() !== 'preview') return;

        view.previewMode.rerender(true);
    });
};

export const registerMandalaEmbedRefreshEvents = (plugin: MandalaGrid) => {
    plugin.registerEvent(
        plugin.app.metadataCache.on('changed', (file) => {
            if (!isMarkdownFile(file)) return;
            plugin.scheduleMandalaEmbedRefresh();
        }),
    );

    plugin.registerEvent(
        plugin.app.vault.on('modify', (file) => {
            if (!isMarkdownFile(file)) return;
            plugin.scheduleMandalaEmbedRefresh();
        }),
    );

    plugin.registerEvent(
        plugin.app.vault.on('create', (file) => {
            if (!isMarkdownFile(file)) return;
            plugin.scheduleMandalaEmbedRefresh();
        }),
    );

    plugin.registerEvent(
        plugin.app.vault.on('delete', (file) => {
            if (!isMarkdownFile(file)) return;
            plugin.scheduleMandalaEmbedRefresh();
        }),
    );

    plugin.registerEvent(
        plugin.app.vault.on('rename', (file, oldPath) => {
            if (isMarkdownFile(file) || oldPath.endsWith('.md')) {
                plugin.scheduleMandalaEmbedRefresh();
            }
        }),
    );
};
