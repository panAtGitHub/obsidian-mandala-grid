import { MarkdownView, TFile } from 'obsidian';
import MandalaGrid from 'src/main';
import { extractEmbedReferencesFromMarkdown } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/extract-embed-references-from-markdown';
import { parseMandalaEmbedReference } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';
import { refreshManagedMandalaEmbedControllersByTargetPaths } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/managed-mandala-embed-registry';
import { resolveMandalaEmbedTarget } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/resolve-mandala-embed-model';

const isMarkdownFile = (file: unknown): file is TFile =>
    file instanceof TFile && file.extension === 'md';

export type MandalaEmbedRefreshViewLike = {
    file: TFile | null;
    mode: 'source' | 'preview';
    markdown: string;
};

export type MandalaEmbedRefreshPlan = {
    previewSourcePaths: Set<string>;
    previewTargetPaths: Set<string>;
    staleSourcePaths: Set<string>;
};

type MarkdownPreviewScrollSnapshot = {
    view: MarkdownView;
    scroll: number;
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
    const previewTargetPaths = new Set<string>();
    const staleSourcePaths = new Set<string>();

    if (changedPathSet.size === 0) {
        return {
            previewSourcePaths,
            previewTargetPaths,
            staleSourcePaths,
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
        const matchedTargetPaths = Array.from(targetPaths).filter((targetPath) =>
            changedPathSet.has(targetPath),
        );
        const isSourceChanged = changedPathSet.has(sourceFile.path);
        const isImpacted = isSourceChanged || matchedTargetPaths.length > 0;
        if (!isImpacted) continue;

        if (view.mode === 'preview') {
            if (isSourceChanged) {
                previewSourcePaths.add(sourceFile.path);
            } else {
                for (const targetPath of matchedTargetPaths) {
                    previewTargetPaths.add(targetPath);
                }
            }
            continue;
        }

        if (matchedTargetPaths.length > 0) {
            staleSourcePaths.add(sourceFile.path);
        }
    }

    return {
        previewSourcePaths,
        previewTargetPaths,
        staleSourcePaths,
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

export const refreshOpenManagedMandalaEmbedsByTargetPaths = (
    targetPaths: Iterable<string>,
) => refreshManagedMandalaEmbedControllersByTargetPaths(targetPaths);

export const captureMarkdownPreviewScrolls = (
    plugin: MandalaGrid,
    sourcePaths?: ReadonlySet<string>,
) => {
    const snapshots: MarkdownPreviewScrollSnapshot[] = [];

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

        snapshots.push({
            view,
            scroll: view.previewMode.getScroll(),
        });
    });

    return snapshots;
};

export const restoreMarkdownPreviewScrolls = (
    snapshots: MarkdownPreviewScrollSnapshot[],
) => {
    const restore = () => {
        for (const { view, scroll } of snapshots) {
            if (!view.file) continue;
            if (view.getMode() !== 'preview') continue;
            view.previewMode.applyScroll(scroll);
        }
    };

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(restore);
    });
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

    plugin.registerEvent(
        plugin.app.workspace.on('active-leaf-change', () => {
            plugin.flushPendingMandalaSourceEmbedRefreshes();
        }),
    );

    plugin.registerEvent(
        plugin.app.workspace.on('file-open', () => {
            plugin.flushPendingMandalaSourceEmbedRefreshes();
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
