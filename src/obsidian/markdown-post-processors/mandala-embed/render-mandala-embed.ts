import {
    MarkdownRenderChild,
    MarkdownRenderer,
    parseLinktext,
    resolveSubpath,
    TFile,
    type MarkdownPostProcessorContext,
} from 'obsidian';
import type MandalaGrid from 'src/main';
import {
    createMandalaEmbedGridModel,
    type MandalaEmbedGridModel,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';
import {
    parseMandalaEmbedSrc,
    type ParsedMandalaEmbedSrc,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-src';

type MandalaEmbedOrientation = 'left-to-right' | 'south-start' | 'bottom-to-top';
export const MANDALA_EMBED_POSTPROCESSOR_SORT_ORDER = 1000;
const MANDALA_EMBED_HOST_CLASS = 'mandala-embed-host';
const MANDALA_EMBED_MANAGED_ATTR = 'data-mandala-managed';

type EmbedTarget = {
    file: TFile;
    centerHeading: string | null;
    centerSection: string | null;
};

const isSkippedContext = (el: HTMLElement) =>
    el.classList.contains('lng-prev') || Boolean(el.closest('.lng-prev'));

const hasMarkerIntent = (src: string | null) =>
    Boolean(src && /(?:\$|%24|%2524)/iu.test(src));
const SECTION_COMMENT_LINE_RE =
    /^\s*<!--\s*section:\s*(\d+(?:\.\d+)*)\s*-->\s*$/u;

const renderDebugPanel = (
    embed: HTMLElement,
    container: HTMLElement,
    lines: string[],
) => {
    embed.setAttribute(MANDALA_EMBED_MANAGED_ATTR, 'true');
    embed.classList.remove('mandala-embed-3x3');
    embed.classList.add('mandala-embed-debug');
    container.empty();

    const panel = document.createElement('div');
    panel.className = 'mandala-embed-debug-panel';

    for (const line of lines) {
        const row = document.createElement('div');
        row.className = 'mandala-embed-debug-line';
        row.setText(line);
        panel.appendChild(row);
    }

    container.appendChild(panel);
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
            contentEl.className = 'mandala-embed-3x3-cell-content';
            cellEl.appendChild(contentEl);

            const markdownEl = document.createElement('div');
            markdownEl.className =
                'mandala-embed-3x3-cell-markdown markdown-preview-view markdown-rendered';
            contentEl.appendChild(markdownEl);

            const previewSectionEl = document.createElement('div');
            previewSectionEl.className = 'markdown-preview-section';
            markdownEl.appendChild(previewSectionEl);

            const previewPusherEl = document.createElement('div');
            previewPusherEl.className = 'markdown-preview-pusher';
            previewSectionEl.appendChild(previewPusherEl);

            const previewBodyEl = document.createElement('div');
            previewSectionEl.appendChild(previewBodyEl);

            if (cell.markdown.trim()) {
                const renderChild = new MarkdownRenderChild(previewBodyEl);
                ctx.addChild(renderChild);
                await Promise.resolve(
                    MarkdownRenderer.render(
                        plugin.app,
                        cell.markdown,
                        previewBodyEl,
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

const isMandalaHost = (element: Element) =>
    element.classList.contains(MANDALA_EMBED_HOST_CLASS);

const queryMandalaHost = (embed: HTMLElement) => {
    const children = Array.from(embed.children);
    for (const child of children) {
        if (!(child instanceof HTMLElement)) continue;
        if (isMandalaHost(child)) return child;
    }
    return null;
};

const getOrCreateMandalaHost = (embed: HTMLElement) => {
    const existing = queryMandalaHost(embed);
    if (existing) return existing;

    const created = document.createElement('div');
    created.className = MANDALA_EMBED_HOST_CLASS;
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
    const resolveCenterSectionByOfficialSubpath = () => {
        if (!centerHeading) return null;
        const cache = plugin.app.metadataCache.getFileCache(file);
        if (!cache) return null;
        const subpathResult = resolveSubpath(cache, `#${centerHeading}`);
        if (!subpathResult) return null;

        const headingLine = subpathResult.start.line;
        if (headingLine <= 0) return null;

        const lines = markdown.split(/\r?\n/u);
        const markerLine = lines[headingLine - 1];
        const markerMatch = markerLine?.match(SECTION_COMMENT_LINE_RE);
        return markerMatch?.[1] ?? null;
    };
    const resolvedCenterSection =
        centerSection ?? resolveCenterSectionByOfficialSubpath();
    return createMandalaEmbedGridModel(
        markdown,
        orientation,
        resolvedCenterSection,
    );
};

const clearMandalaRender = (embed: HTMLElement) => {
    const hadArtifacts =
        embed.getAttribute(MANDALA_EMBED_MANAGED_ATTR) === 'true' ||
        embed.classList.contains('mandala-embed-3x3') ||
        embed.classList.contains('mandala-embed-debug') ||
        Boolean(queryMandalaHost(embed));
    if (!hadArtifacts) return;

    const host = queryMandalaHost(embed);
    host?.remove();
    embed.removeAttribute(MANDALA_EMBED_MANAGED_ATTR);
    embed.classList.remove('mandala-embed-3x3');
    embed.classList.remove('mandala-embed-debug');
};

const formatUnknownError = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

const scheduleMarkerGridRerender = (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
    embed: HTMLElement,
    model: MandalaEmbedGridModel,
    sourceFile: TFile,
    expectedSrc: string | null,
) => {
    const rerenderOnce = (delay_ms: number) => {
        const timer = setTimeout(() => {
            if (!embed.isConnected) return;
            const currentSrc = embed.getAttribute('src');
            if (currentSrc !== expectedSrc) return;
            if (!parseMandalaEmbedSrc(currentSrc)) {
                clearMandalaRender(embed);
                return;
            }

            const host = getOrCreateMandalaHost(embed);
            embed.setAttribute(MANDALA_EMBED_MANAGED_ATTR, 'true');
            embed.classList.add('mandala-embed-3x3');
            embed.classList.remove('mandala-embed-debug');
            void renderGrid(plugin, ctx, host, model, sourceFile).catch(() => {
                clearMandalaRender(embed);
            });
        }, delay_ms);

        plugin.registerTimeout(timer);
    };

    rerenderOnce(0);
    rerenderOnce(24);
};

export const createRenderMandalaEmbedPostProcessor =
    (plugin: MandalaGrid) => {
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

            for (const embed of Array.from(embeds)) {
                const src = embed.getAttribute('src');
                const markerIntent = hasMarkerIntent(src);
                try {
                    const parsedSrc = parseMandalaEmbedSrc(src);

                    if (!parsedSrc) {
                        if (markerIntent && debugEnabled) {
                            const host = getOrCreateMandalaHost(embed);
                            renderDebugPanel(embed, host, [
                                'mandala debug: parse failed',
                                `src: ${src ?? '<null>'}`,
                            ]);
                            continue;
                        }
                        // Keep native embed untouched when marker syntax is absent.
                        clearMandalaRender(embed);
                        continue;
                    }

                    const target = resolveEmbedTarget(plugin, ctx, parsedSrc);

                    if (!target) {
                        if (markerIntent && debugEnabled) {
                            const host = getOrCreateMandalaHost(embed);
                            const parsedLink = parseLinktext(parsedSrc.linktext);
                            renderDebugPanel(embed, host, [
                                'mandala debug: target resolve failed',
                                `src: ${src ?? '<null>'}`,
                                `linktext: ${parsedSrc.linktext}`,
                                `path: ${parsedLink.path ?? '<empty>'}`,
                                `subpath: ${parsedLink.subpath ?? '<empty>'}`,
                                `centerSection: ${parsedSrc.centerSection ?? '<null>'}`,
                                `sourcePath: ${ctx.sourcePath}`,
                            ]);
                            continue;
                        }
                        clearMandalaRender(embed);
                        continue;
                    }

                    const model = await getModel(target);
                    if (!model || !embed.isConnected) {
                        if (markerIntent && debugEnabled && embed.isConnected) {
                            const host = getOrCreateMandalaHost(embed);
                            renderDebugPanel(embed, host, [
                                'mandala debug: model build failed',
                                `src: ${src ?? '<null>'}`,
                                `file: ${target.file.path}`,
                                `centerHeading: ${target.centerHeading ?? '<null>'}`,
                                `centerSection: ${target.centerSection ?? '<null>'}`,
                            ]);
                            continue;
                        }
                        clearMandalaRender(embed);
                        continue;
                    }

                    const host = getOrCreateMandalaHost(embed);

                    embed.setAttribute(MANDALA_EMBED_MANAGED_ATTR, 'true');
                    embed.classList.add('mandala-embed-3x3');
                    embed.classList.remove('mandala-embed-debug');
                    await renderGrid(plugin, ctx, host, model, target.file);
                    scheduleMarkerGridRerender(
                        plugin,
                        ctx,
                        embed,
                        model,
                        target.file,
                        src,
                    );
                } catch (error: unknown) {
                    if (markerIntent && debugEnabled && embed.isConnected) {
                        const host = getOrCreateMandalaHost(embed);
                        renderDebugPanel(embed, host, [
                            'mandala debug: unexpected render error',
                            `src: ${src ?? '<null>'}`,
                            `error: ${formatUnknownError(error)}`,
                        ]);
                        continue;
                    }
                    clearMandalaRender(embed);
                }
            }
        };
    };
