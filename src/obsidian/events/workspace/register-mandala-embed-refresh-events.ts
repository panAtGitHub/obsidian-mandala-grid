import { MarkdownView, TFile } from 'obsidian';
import MandalaGrid from 'src/main';
import { extractEmbedReferencesFromMarkdown } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/extract-embed-references-from-markdown';
import { parseMandalaEmbedReference } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';
import { resolveMandalaEmbedTarget } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/resolve-mandala-embed-model';

const isMarkdownFile = (file: unknown): file is TFile =>
    file instanceof TFile && file.extension === 'md';

export type MandalaEmbedRefreshViewLike = {
    file: TFile | null;
    mode: 'source' | 'preview';
    markdown: string;
};

export type MandalaEmbedRefreshPlan = {
    refreshEditors: boolean;
    previewSourcePaths: Set<string>;
};

export const collectMandalaEmbedTargetPaths = (
    plugin: MandalaGrid,
    sourceFile: TFile,
    markdown: string,
) => {
    const targetPaths = new Set<string>();

    for (const reference of extractEmbedReferencesFromMarkdown(markdown)) {
        const parsedReference = parseMandalaEmbedReference(reference);
        if (!parsedReference) continue;

        const target = resolveMandalaEmbedTarget(
            plugin,
            sourceFile,
            parsedReference,
        );
        if (!target) continue;

        targetPaths.add(target.file.path);
    }

    return targetPaths;
};

export const resolveMandalaEmbedRefreshPlan = (
    plugin: MandalaGrid,
    views: MandalaEmbedRefreshViewLike[],
    changedPaths: Iterable<string>,
): MandalaEmbedRefreshPlan => {
    const changedPathSet = new Set(
        Array.from(changedPaths).filter((path) => path.trim().length > 0),
    );
    const previewSourcePaths = new Set<string>();
    let refreshEditors = false;

    if (changedPathSet.size === 0) {
        return {
            refreshEditors,
            previewSourcePaths,
        };
    }

    for (const view of views) {
        const sourceFile = view.file;
        if (!isMarkdownFile(sourceFile)) continue;

        const targetPaths = collectMandalaEmbedTargetPaths(
            plugin,
            sourceFile,
            view.markdown,
        );
        const isImpacted =
            changedPathSet.has(sourceFile.path) ||
            Array.from(targetPaths).some((targetPath) =>
                changedPathSet.has(targetPath),
            );
        if (!isImpacted) continue;

        if (view.mode === 'preview') {
            previewSourcePaths.add(sourceFile.path);
            continue;
        }

        refreshEditors = true;
    }

    return {
        refreshEditors,
        previewSourcePaths,
    };
};

const getOpenMarkdownViews = (plugin: MandalaGrid) => {
    const views: MarkdownView[] = [];

    plugin.app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof MarkdownView) {
            views.push(leaf.view);
        }
    });

    return views;
};

export const rerenderOpenMarkdownPreviews = (plugin: MandalaGrid) => {
    rerenderMarkdownPreviewsBySourcePaths(plugin);
};

export const rerenderMarkdownPreviewsBySourcePaths = (
    plugin: MandalaGrid,
    sourcePaths?: ReadonlySet<string>,
) => {
    plugin.app.workspace.iterateAllLeaves((leaf) => {
        const view = leaf.view;
        if (!(view instanceof MarkdownView)) return;
        if (view.getMode() !== 'preview') return;
        if (
            sourcePaths &&
            sourcePaths.size > 0 &&
            !sourcePaths.has(view.file?.path ?? '')
        ) {
            return;
        }

        view.previewMode.rerender(true);
    });
};

export const registerMandalaEmbedRefreshEvents = (plugin: MandalaGrid) => {
    const scheduleForChangedPaths = (changedPaths: Iterable<string>) => {
        plugin.scheduleMandalaEmbedRefresh({
            changedPaths,
        });
    };

    plugin.registerEvent(
        plugin.app.metadataCache.on('changed', (file) => {
            if (!isMarkdownFile(file)) return;
            scheduleForChangedPaths([file.path]);
        }),
    );

    plugin.registerEvent(
        plugin.app.vault.on('modify', (file) => {
            if (!isMarkdownFile(file)) return;
            scheduleForChangedPaths([file.path]);
        }),
    );

    plugin.registerEvent(
        plugin.app.vault.on('create', (file) => {
            if (!isMarkdownFile(file)) return;
            scheduleForChangedPaths([file.path]);
        }),
    );

    plugin.registerEvent(
        plugin.app.vault.on('delete', (file) => {
            if (!isMarkdownFile(file)) return;
            plugin.scheduleMandalaEmbedRefresh({
                forceAll: true,
            });
        }),
    );

    plugin.registerEvent(
        plugin.app.vault.on('rename', (file, oldPath) => {
            if (isMarkdownFile(file) || oldPath.endsWith('.md')) {
                plugin.scheduleMandalaEmbedRefresh({
                    forceAll: true,
                });
            }
        }),
    );
};

export const getOpenMandalaEmbedRefreshViews = (
    plugin: MandalaGrid,
): MandalaEmbedRefreshViewLike[] =>
    getOpenMarkdownViews(plugin).map((view) => ({
        file: view.file,
        mode: view.getMode(),
        markdown: view.getViewData(),
    }));
