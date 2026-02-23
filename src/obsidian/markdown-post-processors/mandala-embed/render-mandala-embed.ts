import {
    MarkdownRenderChild,
    MarkdownRenderer,
    parseLinktext,
    TFile,
    type MarkdownPostProcessorContext,
} from 'obsidian';
import type MandalaGrid from 'src/main';
import {
    createMandalaEmbedGridModel,
    type MandalaEmbedGridModel,
    resolveMandalaSectionByHeading,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';
import {
    parseMandalaEmbedSrc,
    type ParsedMandalaEmbedSrc,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-src';

type MandalaEmbedOrientation = 'left-to-right' | 'south-start' | 'bottom-to-top';
export const MANDALA_EMBED_POSTPROCESSOR_SORT_ORDER = 1000;

type EmbedTarget = {
    file: TFile;
    centerHeading: string | null;
    centerSection: string | null;
};

const isSkippedContext = (el: HTMLElement) =>
    el.classList.contains('lng-prev') || Boolean(el.closest('.lng-prev'));

const hasMarkerIntent = (src: string | null) =>
    Boolean(src && /(?:\$|%24|%2524)/iu.test(src));

const renderDebugPanel = (
    embed: HTMLElement,
    contentEl: HTMLElement,
    lines: string[],
) => {
    embed.classList.remove('mandala-embed-3x3');
    embed.classList.add('mandala-embed-debug');
    contentEl.empty();

    const panel = document.createElement('div');
    panel.className = 'mandala-embed-debug-panel';

    for (const line of lines) {
        const row = document.createElement('div');
        row.className = 'mandala-embed-debug-line';
        row.setText(line);
        panel.appendChild(row);
    }

    contentEl.appendChild(panel);
};

const renderGrid = async (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
    container: HTMLElement,
    model: MandalaEmbedGridModel,
    sourceFile: TFile,
) => {
    const tableEl = document.createElement('table');
    tableEl.className = 'mandala-embed-3x3-table';
    const tbodyEl = document.createElement('tbody');

    for (const row of model.rows) {
        const trEl = document.createElement('tr');
        for (const cell of row) {
            const cellEl = document.createElement('td');
            cellEl.className = 'mandala-embed-3x3-cell';
            if (cell.section === model.rows[1]?.[1]?.section) {
                cellEl.classList.add('is-center');
            }
            if (cell.empty) {
                cellEl.classList.add('is-empty');
            }

            const sectionEl = document.createElement('span');
            sectionEl.className = 'mandala-embed-3x3-cell-section';
            sectionEl.setText(cell.section);
            cellEl.appendChild(sectionEl);

            const contentEl = document.createElement('div');
            contentEl.className = 'mandala-embed-3x3-cell-content markdown-rendered';
            cellEl.appendChild(contentEl);

            if (cell.markdown.trim()) {
                const renderChild = new MarkdownRenderChild(contentEl);
                ctx.addChild(renderChild);
                await Promise.resolve(
                    MarkdownRenderer.render(
                        plugin.app,
                        cell.markdown,
                        contentEl,
                        sourceFile.path,
                        renderChild,
                    ),
                );
            }

            trEl.appendChild(cellEl);
        }
        tbodyEl.appendChild(trEl);
    }

    tableEl.appendChild(tbodyEl);
    container.empty();
    container.appendChild(tableEl);
};

const getEmbedContentEl = (embed: HTMLElement) => {
    const contentEl = embed.querySelector<HTMLElement>('.markdown-embed-content');
    if (contentEl) return contentEl;

    const created = document.createElement('div');
    created.className = 'markdown-embed-content';
    embed.appendChild(created);
    return created;
};

const resolveMarkdownFile = (
    plugin: MandalaGrid,
    path: string,
    sourcePath: string,
) => {
    const fromSource = plugin.app.metadataCache.getFirstLinkpathDest(path, sourcePath);
    if (fromSource instanceof TFile && fromSource.extension === 'md') {
        return fromSource;
    }

    const fromRoot = plugin.app.metadataCache.getFirstLinkpathDest(path, '');
    if (fromRoot instanceof TFile && fromRoot.extension === 'md') {
        return fromRoot;
    }

    const direct = plugin.app.vault.getAbstractFileByPath(path);
    if (direct instanceof TFile && direct.extension === 'md') return direct;

    const withExt = path.endsWith('.md') ? path : `${path}.md`;
    const directWithExt = plugin.app.vault.getAbstractFileByPath(withExt);
    if (directWithExt instanceof TFile && directWithExt.extension === 'md') {
        return directWithExt;
    }

    const byName = plugin.app.vault
        .getAllLoadedFiles()
        .find(
            (item) =>
                item instanceof TFile &&
                item.extension === 'md' &&
                item.basename.toLowerCase() ===
                    path.split('/').pop()?.trim().toLowerCase(),
        );
    if (byName instanceof TFile) return byName;

    return null;
};

const resolveEmbedTarget = (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
    parsedSrc: ParsedMandalaEmbedSrc,
): EmbedTarget | null => {
    const { path, subpath } = parseLinktext(parsedSrc.linktext);
    if (!path) return null;

    const file = resolveMarkdownFile(plugin, path, ctx.sourcePath);
    if (!(file instanceof TFile) || file.extension !== 'md') return null;

    const normalizedSubpath = subpath?.trim().replace(/^#+/u, '');
    const centerHeading =
        normalizedSubpath && !normalizedSubpath.startsWith('^')
            ? normalizedSubpath
            : null;
    const centerSection =
        parsedSrc.centerSection?.trim() && parsedSrc.centerSection.trim().length > 0
            ? parsedSrc.centerSection.trim()
            : null;

    return {
        file,
        centerHeading,
        centerSection,
    };
};

const getOrientation = (plugin: MandalaGrid): MandalaEmbedOrientation =>
    plugin.settings.getValue().view.mandalaGridOrientation ?? 'left-to-right';

const buildModelFromFile = async (
    plugin: MandalaGrid,
    file: TFile,
    orientation: MandalaEmbedOrientation,
    centerHeading: string | null,
    centerSection: string | null,
) => {
    const markdown = await plugin.app.vault.cachedRead(file);
    const resolvedCenterSection =
        centerSection ??
        resolveMandalaSectionByHeading(markdown, centerHeading);
    return createMandalaEmbedGridModel(
        markdown,
        orientation,
        resolvedCenterSection,
    );
};

const restoreNativeEmbed = (
    embed: HTMLElement,
    contentEl: HTMLElement,
    originalEmbedContent: WeakMap<HTMLElement, Node[]>,
) => {
    const original = originalEmbedContent.get(embed);
    if (original !== undefined) {
        contentEl.empty();
        for (const node of original) {
            contentEl.appendChild(node.cloneNode(true));
        }
        originalEmbedContent.delete(embed);
    }
    embed.classList.remove('mandala-embed-3x3');
    embed.classList.remove('mandala-embed-debug');
};

export const createRenderMandalaEmbedPostProcessor =
    (plugin: MandalaGrid) => {
        const originalEmbedContent = new WeakMap<HTMLElement, Node[]>();
        const ensureOriginalSnapshot = (
            embed: HTMLElement,
            contentEl: HTMLElement,
        ) => {
            if (originalEmbedContent.has(embed)) return;
            originalEmbedContent.set(
                embed,
                Array.from(contentEl.childNodes).map((node) =>
                    node.cloneNode(true),
                ),
            );
        };

        return async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            if (isSkippedContext(el)) return;

            const embeds = el.querySelectorAll<HTMLElement>('.internal-embed');
            if (embeds.length === 0) return;

            const debugEnabled =
                plugin.settings.getValue().view.mandalaEmbedDebug ?? false;
            const orientation = getOrientation(plugin);
            const modelCache = new Map<string, Promise<MandalaEmbedGridModel | null>>();

            const getModel = (target: EmbedTarget) => {
                const center =
                    target.centerSection ?? target.centerHeading ?? 'root';
                const cacheKey = `${target.file.path}::${target.file.stat.mtime}::${orientation}::${center}`;
                const cached = modelCache.get(cacheKey);
                if (cached) return cached;

                const loading = buildModelFromFile(
                    plugin,
                    target.file,
                    orientation,
                    target.centerHeading,
                    target.centerSection,
                ).catch(() => null);
                modelCache.set(cacheKey, loading);
                return loading;
            };

            await Promise.all(
                Array.from(embeds).map(async (embed) => {
                    const src = embed.getAttribute('src');
                    const contentEl = getEmbedContentEl(embed);
                    const markerIntent = hasMarkerIntent(src);
                    const parsedSrc = parseMandalaEmbedSrc(src);

                    if (!parsedSrc) {
                        if (markerIntent && debugEnabled) {
                            ensureOriginalSnapshot(embed, contentEl);
                            renderDebugPanel(embed, contentEl, [
                                'mandala debug: parse failed',
                                `src: ${src ?? '<null>'}`,
                            ]);
                            return;
                        }
                        restoreNativeEmbed(embed, contentEl, originalEmbedContent);
                        return;
                    }

                    const target = resolveEmbedTarget(plugin, ctx, parsedSrc);

                    if (!target) {
                        if (markerIntent && debugEnabled) {
                            ensureOriginalSnapshot(embed, contentEl);
                            const parsedLink = parseLinktext(parsedSrc.linktext);
                            renderDebugPanel(embed, contentEl, [
                                'mandala debug: target resolve failed',
                                `src: ${src ?? '<null>'}`,
                                `linktext: ${parsedSrc.linktext}`,
                                `path: ${parsedLink.path ?? '<empty>'}`,
                                `subpath: ${parsedLink.subpath ?? '<empty>'}`,
                                `centerSection: ${parsedSrc.centerSection ?? '<null>'}`,
                                `sourcePath: ${ctx.sourcePath}`,
                            ]);
                            return;
                        }
                        restoreNativeEmbed(embed, contentEl, originalEmbedContent);
                        return;
                    }

                    const model = await getModel(target);
                    if (!model || !embed.isConnected) {
                        if (markerIntent && debugEnabled && embed.isConnected) {
                            ensureOriginalSnapshot(embed, contentEl);
                            renderDebugPanel(embed, contentEl, [
                                'mandala debug: model build failed',
                                `src: ${src ?? '<null>'}`,
                                `file: ${target.file.path}`,
                                `centerHeading: ${target.centerHeading ?? '<null>'}`,
                                `centerSection: ${target.centerSection ?? '<null>'}`,
                            ]);
                            return;
                        }
                        restoreNativeEmbed(embed, contentEl, originalEmbedContent);
                        return;
                    }

                    ensureOriginalSnapshot(embed, contentEl);

                    embed.classList.add('mandala-embed-3x3');
                    embed.classList.remove('mandala-embed-debug');
                    await renderGrid(plugin, ctx, contentEl, model, target.file);

                    // Obsidian may update embed content asynchronously after post-processing.
                    // Re-apply once on next tick to keep marker embeds in grid mode.
                    const timer = setTimeout(() => {
                        if (!embed.isConnected) return;
                        if (!embed.classList.contains('mandala-embed-3x3')) return;
                        const latestContentEl = getEmbedContentEl(embed);
                        void renderGrid(
                            plugin,
                            ctx,
                            latestContentEl,
                            model,
                            target.file,
                        );
                    }, 0);
                    plugin.registerTimeout(timer);
                }),
            );
        };
    };
