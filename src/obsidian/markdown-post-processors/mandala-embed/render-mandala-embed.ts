import {
    MarkdownRenderChild,
    MarkdownRenderer,
    parseLinktext,
    resolveSubpath,
    setIcon,
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
import { logger } from 'src/helpers/logger';
import { formatText } from 'src/view/actions/markdown-preview/helpers/format-text';
import { markHiddenInfoElements } from 'src/view/actions/markdown-preview/helpers/mark-hidden-info-elements';

type MandalaEmbedOrientation = 'left-to-right' | 'south-start' | 'bottom-to-top';
export const MANDALA_EMBED_POSTPROCESSOR_SORT_ORDER = 1000;
const MANDALA_EMBED_HOST_CLASS = 'mandala-embed-host';
const MANDALA_EMBED_HEADER_CLASS = 'mandala-embed-host-header';
const MANDALA_EMBED_BODY_CLASS = 'mandala-embed-host-body';
const MANDALA_EMBED_MANAGED_ATTR = 'data-mandala-managed';
const MANDALA_EMBED_CELL_SIZE_VAR = '--mandala-embed-cell-size';

type EmbedTarget = {
    file: TFile;
    centerHeading: string | null;
    centerSection: string | null;
};

const isSkippedContext = (el: HTMLElement) =>
    el.classList.contains('lng-prev') || Boolean(el.closest('.lng-prev'));

const SECTION_COMMENT_LINE_RE =
    /^\s*<!--\s*section:\s*(\d+(?:\.\d+)*)\s*-->\s*$/u;

const gridResizeCleanupByHost = new WeakMap<HTMLElement, () => void>();

const updateGridCellSize = (host: HTMLElement, gridEl: HTMLElement) => {
    const width = host.clientWidth;
    if (width <= 0) return;
    const cellSize = Math.max(1, Math.floor(width / 3));
    gridEl.style.setProperty(MANDALA_EMBED_CELL_SIZE_VAR, `${cellSize}px`);
};

const setupGridResizeObserver = (
    ctx: MarkdownPostProcessorContext,
    host: HTMLElement,
    gridEl: HTMLElement,
) => {
    gridResizeCleanupByHost.get(host)?.();

    let rafId = 0;
    const scheduleUpdate = () => {
        if (rafId !== 0) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            rafId = 0;
            updateGridCellSize(host, gridEl);
        });
    };

    const observer = new ResizeObserver(() => scheduleUpdate());
    observer.observe(host);
    scheduleUpdate();

    const cleanup = () => {
        if (rafId !== 0) cancelAnimationFrame(rafId);
        observer.disconnect();
    };
    gridResizeCleanupByHost.set(host, cleanup);

    const cleanupChild = new MarkdownRenderChild(host);
    cleanupChild.onunload = () => {
        const currentCleanup = gridResizeCleanupByHost.get(host);
        if (currentCleanup === cleanup) {
            cleanup();
            gridResizeCleanupByHost.delete(host);
        }
    };
    ctx.addChild(cleanupChild);
};

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

const renderGrid = (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
    container: HTMLElement,
    model: MandalaEmbedGridModel,
    sourceFile: TFile,
) => {
    const gridEl = document.createElement('div');
    gridEl.className = 'mandala-embed-3x3-grid';

    for (const row of model.rows) {
        for (const cell of row) {
            const cellEl = document.createElement('div');
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

            if (cell.markdown.trim()) {
                const renderChild = new MarkdownRenderChild(markdownEl);
                ctx.addChild(renderChild);
                const formatted = formatText(cell.markdown);
                const renderResult = MarkdownRenderer.render(
                    plugin.app,
                    formatted,
                    markdownEl,
                    sourceFile.path,
                    renderChild,
                );
                void Promise.resolve(renderResult).then(() =>
                    markHiddenInfoElements(markdownEl),
                );
            }

            gridEl.appendChild(cellEl);
        }
    }

    container.empty();
    container.appendChild(gridEl);
    setupGridResizeObserver(ctx, container, gridEl);
};

const isMandalaHost = (element: Element) =>
    element.classList.contains(MANDALA_EMBED_HOST_CLASS);

const queryDirectChildByClass = (parent: HTMLElement, className: string) => {
    for (const child of Array.from(parent.children)) {
        if (!(child instanceof HTMLElement)) continue;
        if (child.classList.contains(className)) return child;
    }
    return null;
};

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

const getOrCreateHostSection = (
    host: HTMLElement,
    className: string,
    tagName: 'div' | 'button' = 'div',
) => {
    const existing = queryDirectChildByClass(host, className);
    if (existing) return existing;
    const created = document.createElement(tagName);
    created.className = className;
    host.appendChild(created);
    return created;
};

const getOrCreateMandalaHostLayout = (embed: HTMLElement) => {
    const host = getOrCreateMandalaHost(embed);
    const header = getOrCreateHostSection(host, MANDALA_EMBED_HEADER_CLASS);
    const body = getOrCreateHostSection(host, MANDALA_EMBED_BODY_CLASS);

    if (host.firstElementChild !== header) {
        host.insertBefore(header, host.firstChild);
    }
    if (header.nextElementSibling !== body) {
        host.insertBefore(body, header.nextSibling);
    }

    return { host, header, body };
};

const renderEmbedHeader = (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
    headerEl: HTMLElement,
    target: EmbedTarget,
    parsedSrc: ParsedMandalaEmbedSrc,
) => {
    headerEl.empty();

    const titleEl = document.createElement('h1');
    titleEl.className = 'mandala-embed-header-title';
    titleEl.setText(target.centerHeading ?? target.file.basename);

    const linkBtn = document.createElement('button');
    linkBtn.className = 'mandala-embed-header-link';
    linkBtn.type = 'button';
    linkBtn.setAttribute('aria-label', 'Open embed target in note');
    const linkIcon = document.createElement('span');
    linkIcon.className = 'mandala-embed-header-link-icon';
    setIcon(linkIcon, 'maximize-2');
    linkBtn.appendChild(linkIcon);

    const openTarget = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        void plugin.app.workspace.openLinkText(
            parsedSrc.linktext,
            ctx.sourcePath,
            false,
        );
    };

    linkBtn.addEventListener('click', openTarget);

    headerEl.appendChild(titleEl);
    headerEl.appendChild(linkBtn);
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
    if (host) {
        const body = queryDirectChildByClass(host, MANDALA_EMBED_BODY_CLASS);
        if (body) {
            gridResizeCleanupByHost.get(body)?.();
            gridResizeCleanupByHost.delete(body);
        }
    }
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
            const body =
                queryDirectChildByClass(host, MANDALA_EMBED_BODY_CLASS) ?? host;
            embed.setAttribute(MANDALA_EMBED_MANAGED_ATTR, 'true');
            embed.classList.add('mandala-embed-3x3');
            embed.classList.remove('mandala-embed-debug');
            try {
                renderGrid(plugin, ctx, body, model, sourceFile);
            } catch {
                clearMandalaRender(embed);
            }
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
                try {
                    const parsedSrc = parseMandalaEmbedSrc(src);

                    if (!parsedSrc) {
                        // Keep native embed untouched when marker syntax is absent.
                        clearMandalaRender(embed);
                        continue;
                    }

                    const target = resolveEmbedTarget(plugin, ctx, parsedSrc);

                    if (!target) {
                        if (debugEnabled) {
                            const { body } = getOrCreateMandalaHostLayout(embed);
                            const parsedLink = parseLinktext(parsedSrc.linktext);
                            renderDebugPanel(embed, body, [
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
                        if (debugEnabled && embed.isConnected) {
                            const { body } = getOrCreateMandalaHostLayout(embed);
                            renderDebugPanel(embed, body, [
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

                    const { header, body } = getOrCreateMandalaHostLayout(embed);

                    embed.setAttribute(MANDALA_EMBED_MANAGED_ATTR, 'true');
                    embed.classList.add('mandala-embed-3x3');
                    embed.classList.remove('mandala-embed-debug');
                    renderEmbedHeader(plugin, ctx, header, target, parsedSrc);
                    renderGrid(plugin, ctx, body, model, target.file);
                    scheduleMarkerGridRerender(
                        plugin,
                        ctx,
                        embed,
                        model,
                        target.file,
                        src,
                    );
                } catch (error: unknown) {
                    logger.error('[mandala-embed]', {
                        phase: 'unexpected-error',
                        src: src ?? '<null>',
                        sourcePath: ctx.sourcePath,
                        error: formatUnknownError(error),
                    });
                    if (debugEnabled && embed.isConnected) {
                        const { body } = getOrCreateMandalaHostLayout(embed);
                        renderDebugPanel(embed, body, [
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
