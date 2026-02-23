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
import { parseMandalaEmbedSrc } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-src';

type MandalaEmbedOrientation = 'left-to-right' | 'south-start' | 'bottom-to-top';
export const MANDALA_EMBED_POSTPROCESSOR_SORT_ORDER = 1000;

type EmbedTarget = {
    file: TFile;
    centerHeading: string | null;
    centerSection: string | null;
};

const EMBED_WIKILINK_RE = /!\[\[([^\]]+)\]\]/gu;

const isSkippedContext = (el: HTMLElement) =>
    el.classList.contains('lng-prev') || Boolean(el.closest('.lng-prev'));

const safeDecodeUriComponent = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const normalizeSubpath = (value: string | null | undefined) =>
    value?.trim().replace(/^#+/u, '') ?? '';

const normalizeLinkPath = (value: string) => {
    const decoded = safeDecodeUriComponent(value).trim();
    return decoded.endsWith('.md') ? decoded.slice(0, -3) : decoded;
};

const isSameLinktextTarget = (left: string, right: string) => {
    const leftParsed = parseLinktext(safeDecodeUriComponent(left).trim());
    const rightParsed = parseLinktext(safeDecodeUriComponent(right).trim());
    if (!leftParsed.path || !rightParsed.path) return false;

    return (
        normalizeLinkPath(leftParsed.path) === normalizeLinkPath(rightParsed.path) &&
        normalizeSubpath(leftParsed.subpath) === normalizeSubpath(rightParsed.subpath)
    );
};

const extractEmbedLinktextsFromText = (text: string) => {
    const linktexts: string[] = [];
    for (const match of text.matchAll(EMBED_WIKILINK_RE)) {
        const linktext = match[1]?.trim();
        if (!linktext) continue;
        linktexts.push(linktext);
    }
    return linktexts;
};

const extractEmbedLinktextFromOriginal = (original: string | undefined) => {
    if (!original) return null;
    const match = original.match(/!\[\[([^\]]+)\]\]/u);
    return match?.[1]?.trim() ?? null;
};

const findMarkerLinktextForEmbed = (src: string | null, markerHints: string[]) => {
    if (!src) return null;

    for (const hint of markerHints) {
        const parsedHint = parseMandalaEmbedSrc(hint);
        if (!parsedHint) continue;
        if (isSameLinktextTarget(parsedHint.linktext, src)) {
            return hint;
        }
    }

    return null;
};

const getMarkerHintsFromMetadata = (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
) => {
    const sourceFile = plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
    if (!(sourceFile instanceof TFile)) return [];

    const fileCache = plugin.app.metadataCache.getFileCache(sourceFile);
    if (!fileCache?.embeds?.length) return [];

    return fileCache.embeds
        .map((embed) => extractEmbedLinktextFromOriginal(embed.original))
        .filter((linktext): linktext is string => Boolean(linktext))
        .filter((linktext) => Boolean(parseMandalaEmbedSrc(linktext)));
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
    candidateLinktexts: string[],
): EmbedTarget | null => {
    const parsedSrc = candidateLinktexts
        .map((candidate) => parseMandalaEmbedSrc(candidate))
        .find((parsed): parsed is NonNullable<typeof parsed> => Boolean(parsed));
    if (!parsedSrc) return null;

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
};

export const createRenderMandalaEmbedPostProcessor =
    (plugin: MandalaGrid) => {
        const originalEmbedContent = new WeakMap<HTMLElement, Node[]>();

        return async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            if (isSkippedContext(el)) return;

            const embeds = el.querySelectorAll<HTMLElement>('.internal-embed');
            if (embeds.length === 0) return;

            const sectionInfo = ctx.getSectionInfo(el);
            const sectionLinktexts = sectionInfo
                ? extractEmbedLinktextsFromText(sectionInfo.text)
                : [];
            const metadataMarkerHints = getMarkerHintsFromMetadata(plugin, ctx);
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
                Array.from(embeds).map(async (embed, index) => {
                    const src = embed.getAttribute('src');
                    const sectionLinktext = sectionLinktexts[index] ?? null;
                    const markerFromMetadata = findMarkerLinktextForEmbed(
                        src,
                        metadataMarkerHints,
                    );
                    const candidateLinktexts = [
                        sectionLinktext,
                        src,
                        markerFromMetadata,
                    ].filter((candidate): candidate is string => Boolean(candidate));

                    const target = resolveEmbedTarget(plugin, ctx, candidateLinktexts);
                    const contentEl = getEmbedContentEl(embed);

                    if (!target) {
                        restoreNativeEmbed(embed, contentEl, originalEmbedContent);
                        return;
                    }

                    const model = await getModel(target);
                    if (!model || !embed.isConnected) {
                        restoreNativeEmbed(embed, contentEl, originalEmbedContent);
                        return;
                    }

                    if (!originalEmbedContent.has(embed)) {
                        originalEmbedContent.set(
                            embed,
                            Array.from(contentEl.childNodes).map((node) =>
                                node.cloneNode(true),
                            ),
                        );
                    }

                    embed.classList.add('mandala-embed-3x3');
                    await renderGrid(plugin, ctx, contentEl, model, target.file);
                }),
            );
        };
    };
