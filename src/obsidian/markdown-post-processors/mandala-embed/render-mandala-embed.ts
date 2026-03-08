import {
    parseLinktext,
    resolveSubpath,
    TFile,
    type EmbedCache,
    type MarkdownPostProcessorContext,
} from 'obsidian';
import type MandalaGrid from 'src/main';
import {
    createMandalaEmbedGridModel,
    type MandalaEmbedGridModel,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';
import {
    parseMandalaEmbedReference,
    type MandalaEmbedReferenceLike,
    type ParsedMandalaEmbedReference,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';
import { mapRenderedEmbedsToDocumentReferences } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-document-references';
import { mapRenderedEmbedsToCache } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-cache';
import { mapRenderedEmbedsToMarkdownReferences } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-markdown-references';
import { mapRenderedEmbedsToSectionReferences } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-section-references';
import { logger } from 'src/helpers/logger';
import {
    type MandalaEmbedTarget,
    type MandalaEmbedManagedPayload,
} from 'src/obsidian/markdown-post-processors/mandala-embed/mandala-embed-controller-types';
import { MandalaEmbedController } from 'src/obsidian/markdown-post-processors/mandala-embed/mandala-embed-controller';
import { findRenderedMarkdown } from 'src/view/actions/markdown-preview/helpers/rendered-markdown-registry';

type MandalaEmbedOrientation = 'left-to-right' | 'south-start';
export const MANDALA_EMBED_POSTPROCESSOR_SORT_ORDER = 1000;

const SECTION_COMMENT_LINE_RE =
    /^\s*<!--\s*section:\s*(\d+(?:\.\d+)*)\s*-->\s*$/u;
const MANDALA_EMBED_MANAGED_ATTR = 'data-mandala-managed';
const MAX_MANAGED_ANCESTOR_DEPTH = 1;

const controllerByEmbed = new WeakMap<HTMLElement, MandalaEmbedController>();

const getOrCreateController = (
    plugin: MandalaGrid,
    embed: HTMLElement,
): MandalaEmbedController => {
    const existing = controllerByEmbed.get(embed);
    if (existing) return existing;

    const created = new MandalaEmbedController(plugin, embed);
    controllerByEmbed.set(embed, created);
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

    return null;
};

const resolveEmbedTarget = (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
    parsedReference: ParsedMandalaEmbedReference,
): MandalaEmbedTarget | null => {
    const { path, subpath } = parseLinktext(parsedReference.linktext);
    if (!path) return null;

    const file = resolveMarkdownFile(plugin, path, ctx.sourcePath);
    if (!(file instanceof TFile) || file.extension !== 'md') return null;

    const normalizedSubpath = subpath?.trim().replace(/^#+/u, '');
    const centerHeading =
        normalizedSubpath && !normalizedSubpath.startsWith('^')
            ? normalizedSubpath
            : null;
    if (!centerHeading) return null;

    return {
        file,
        centerHeading,
    };
};

const getOrientation = (plugin: MandalaGrid): MandalaEmbedOrientation =>
    plugin.settings.getValue().view.mandalaGridOrientation === 'south-start'
        ? 'south-start'
        : 'left-to-right';

const buildModelFromFile = async (
    plugin: MandalaGrid,
    file: TFile,
    orientation: MandalaEmbedOrientation,
    centerHeading: string | null,
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

    const resolvedCenterSection = resolveCenterSectionByOfficialSubpath();
    if (!resolvedCenterSection) return null;

    return createMandalaEmbedGridModel(
        markdown,
        orientation,
        resolvedCenterSection,
    );
};

const formatUnknownError = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

const safeDecodeUriComponent = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const normalizeComparableSubpath = (value: string | null | undefined) => {
    let normalized = value?.trim().replace(/^#+/u, '') ?? '';
    for (let index = 0; index < 3; index += 1) {
        const decoded = safeDecodeUriComponent(normalized);
        if (decoded === normalized) break;
        normalized = decoded;
    }
    return normalized;
};

const resolveSourceMarkdownFile = (
    plugin: MandalaGrid,
    sourcePath: string,
): TFile | null => {
    const file = plugin.app.vault.getFileByPath(sourcePath);
    if (file instanceof TFile && file.extension === 'md') {
        return file;
    }

    return null;
};

const resolveCachedReferencesForEmbeds = (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
    embeds: HTMLElement[],
) => {
    const sourceFile = resolveSourceMarkdownFile(plugin, ctx.sourcePath);
    if (!sourceFile) return new Map<HTMLElement, EmbedCache>();

    const cachedEmbeds =
        plugin.app.metadataCache.getFileCache(sourceFile)?.embeds ?? [];
    return mapRenderedEmbedsToCache(embeds, cachedEmbeds, (embed) =>
        ctx.getSectionInfo(embed),
    );
};

const resolveSectionReferencesForEmbeds = (
    ctx: MarkdownPostProcessorContext,
    embeds: HTMLElement[],
) =>
    mapRenderedEmbedsToSectionReferences(embeds, (embed) =>
        ctx.getSectionInfo(embed),
    );

const resolveRenderedMarkdownReferencesForEmbeds = (
    el: HTMLElement,
    embeds: HTMLElement[],
) => {
    const markdown = findRenderedMarkdown(el);
    if (!markdown) return new Map<HTMLElement, MandalaEmbedReferenceLike>();

    return mapRenderedEmbedsToMarkdownReferences(embeds, markdown);
};

const buildComparableEmbedTargetKey = (
    plugin: MandalaGrid,
    sourcePath: string,
    linktext: string,
) => {
    const { path, subpath } = parseLinktext(linktext);
    if (!path) return null;

    const file = resolveMarkdownFile(plugin, path, sourcePath);
    if (!file) return null;

    const normalizedSubpath = normalizeComparableSubpath(subpath);
    if (!normalizedSubpath || normalizedSubpath.startsWith('^')) return null;

    return `${file.path}::${normalizedSubpath}`;
};

const resolveDocumentReferencesForEmbeds = async (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
    embeds: HTMLElement[],
) => {
    const sourceFile = resolveSourceMarkdownFile(plugin, ctx.sourcePath);
    if (!sourceFile) return new Map<HTMLElement, MandalaEmbedReferenceLike>();

    const markdown = await plugin.app.vault.cachedRead(sourceFile).catch(() => null);
    if (!markdown) return new Map<HTMLElement, MandalaEmbedReferenceLike>();

    return mapRenderedEmbedsToDocumentReferences(
        embeds,
        markdown,
        (embed) => {
            const src = embed.getAttribute('src');
            if (!src) return null;
            return buildComparableEmbedTargetKey(plugin, ctx.sourcePath, src);
        },
        (reference) => {
            const parsedReference = parseMandalaEmbedReference(reference);
            if (!parsedReference) return null;

            return buildComparableEmbedTargetKey(
                plugin,
                ctx.sourcePath,
                parsedReference.linktext,
            );
        },
    );
};

const doesEmbedTargetMatchReference = (
    plugin: MandalaGrid,
    sourcePath: string,
    src: string | null,
    linktext: string,
) => {
    if (!src) return false;

    const embedTargetKey = buildComparableEmbedTargetKey(
        plugin,
        sourcePath,
        src,
    );
    const referenceTargetKey = buildComparableEmbedTargetKey(
        plugin,
        sourcePath,
        linktext,
    );

    return (
        embedTargetKey !== null &&
        referenceTargetKey !== null &&
        embedTargetKey === referenceTargetKey
    );
};

const isMandalaEmbedReferenceLike = (
    reference: MandalaEmbedReferenceLike | undefined,
): reference is MandalaEmbedReferenceLike => Boolean(reference);

const getManagedAncestorDepth = (embed: HTMLElement) => {
    let depth = 0;
    let cursor: HTMLElement | null = embed;

    while (cursor) {
        const parentEl: HTMLElement | null = cursor.parentElement;
        if (!parentEl) break;

        const parentWithClosest = parentEl as unknown as {
            closest: (selector: string) => Element | null;
        };
        const candidateEl = parentWithClosest.closest(
            `.internal-embed[${MANDALA_EMBED_MANAGED_ATTR}='true']`,
        );
        if (!(candidateEl instanceof HTMLElement)) break;

        depth += 1;
        cursor = candidateEl;
    }

    return depth;
};

export const createRenderMandalaEmbedPostProcessor =
    (plugin: MandalaGrid) => {
        return async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            const embeds = Array.from(
                el.querySelectorAll<HTMLElement>('.internal-embed'),
            );
            if (embeds.length === 0) return;

            const debugEnabled =
                plugin.settings.getValue().view.mandalaEmbedDebug ?? false;
            const orientation = getOrientation(plugin);
            const modelCache = new Map<string, Promise<MandalaEmbedGridModel | null>>();
            const renderedMarkdownReferenceByEmbed =
                resolveRenderedMarkdownReferencesForEmbeds(el, embeds);
            const sectionReferenceByEmbed = resolveSectionReferencesForEmbeds(
                ctx,
                embeds,
            );
            const cachedReferenceByEmbed = resolveCachedReferencesForEmbeds(
                plugin,
                ctx,
                embeds,
            );
            let documentReferenceByEmbedPromise:
                | Promise<Map<HTMLElement, MandalaEmbedReferenceLike>>
                | null = null;

            const getModel = (target: MandalaEmbedTarget) => {
                const center = target.centerHeading ?? 'root';
                const cacheKey = `${target.file.path}::${target.file.stat.mtime}::${orientation}::${center}`;
                const cached = modelCache.get(cacheKey);
                if (cached) return cached;

                const loading = buildModelFromFile(
                    plugin,
                    target.file,
                    orientation,
                    target.centerHeading,
                ).catch(() => null);
                modelCache.set(cacheKey, loading);
                return loading;
            };

            const getDocumentReferenceByEmbed = () => {
                documentReferenceByEmbedPromise ??=
                    resolveDocumentReferencesForEmbeds(plugin, ctx, embeds);
                return documentReferenceByEmbedPromise;
            };

            for (const embed of embeds) {
                const controller = getOrCreateController(plugin, embed);
                const src = embed.getAttribute('src');
                const renderedMarkdownReference =
                    renderedMarkdownReferenceByEmbed.get(embed);
                const sectionReference = sectionReferenceByEmbed.get(embed);
                const cachedReference = cachedReferenceByEmbed.get(embed);
                const managedAncestorDepth = getManagedAncestorDepth(embed);

                try {
                    if (managedAncestorDepth > MAX_MANAGED_ANCESTOR_DEPTH) {
                        if (debugEnabled) {
                            controller.updateDebug([
                                'mandala debug: max nested depth reached',
                                `src: ${src ?? '<null>'}`,
                                `maxDepth: ${String(MAX_MANAGED_ANCESTOR_DEPTH)}`,
                            ]);
                        } else {
                            controller.clear();
                        }
                        continue;
                    }

                    const referenceCandidates = [
                        renderedMarkdownReference,
                        sectionReference,
                        cachedReference,
                    ].filter(isMandalaEmbedReferenceLike);
                    const isMarkedReference = referenceCandidates.some(
                        (reference) => reference?.displayText?.trim() === '$',
                    );

                    let parsedReference: ParsedMandalaEmbedReference | null = null;
                    let matchedReferenceOriginal = '<empty>';

                    for (const referenceCandidate of referenceCandidates) {
                        const nextParsedReference =
                            parseMandalaEmbedReference(referenceCandidate);
                        if (!nextParsedReference) continue;
                        if (
                            !doesEmbedTargetMatchReference(
                                plugin,
                                ctx.sourcePath,
                                src,
                                nextParsedReference.linktext,
                            )
                        ) {
                            continue;
                        }
                        parsedReference = nextParsedReference;
                        matchedReferenceOriginal =
                            referenceCandidate?.original ?? '<empty>';
                        break;
                    }

                    if (!parsedReference) {
                        const documentReferenceByEmbed =
                            await getDocumentReferenceByEmbed();
                        const documentReference =
                            documentReferenceByEmbed.get(embed);
                        const nextParsedReference = parseMandalaEmbedReference(
                            documentReference ?? null,
                        );
                        if (
                            nextParsedReference &&
                            doesEmbedTargetMatchReference(
                                plugin,
                                ctx.sourcePath,
                                src,
                                nextParsedReference.linktext,
                            )
                        ) {
                            parsedReference = nextParsedReference;
                            matchedReferenceOriginal =
                                documentReference?.original ?? '<empty>';
                        }
                    }

                    if (!parsedReference) {
                        if (debugEnabled && isMarkedReference) {
                            controller.updateDebug([
                                'mandala debug: marker parse failed',
                                `src: ${src ?? '<null>'}`,
                                `renderedOriginal: ${renderedMarkdownReference?.original ?? '<empty>'}`,
                                `sectionOriginal: ${sectionReference?.original ?? '<empty>'}`,
                                `cachedOriginal: ${cachedReference?.original ?? '<empty>'}`,
                            ]);
                            continue;
                        }
                        controller.clear();
                        continue;
                    }

                    const target = resolveEmbedTarget(
                        plugin,
                        ctx,
                        parsedReference,
                    );
                    if (!target) {
                        if (debugEnabled) {
                            const parsedLink = parseLinktext(
                                parsedReference.linktext,
                            );
                            controller.updateDebug([
                                'mandala debug: target resolve failed',
                                `src: ${src ?? '<null>'}`,
                                `linktext: ${parsedReference.linktext}`,
                                `original: ${matchedReferenceOriginal}`,
                                `path: ${parsedLink.path ?? '<empty>'}`,
                                `subpath: ${parsedLink.subpath ?? '<empty>'}`,
                                `sourcePath: ${ctx.sourcePath}`,
                            ]);
                            continue;
                        }
                        controller.clear();
                        continue;
                    }

                    const model = await getModel(target);
                    if (!model || !embed.isConnected) {
                        if (debugEnabled && embed.isConnected) {
                            controller.updateDebug([
                                'mandala debug: model build failed',
                                `src: ${src ?? '<null>'}`,
                                `file: ${target.file.path}`,
                                `centerHeading: ${target.centerHeading ?? '<null>'}`,
                            ]);
                            continue;
                        }
                        controller.clear();
                        continue;
                    }

                    const payload: MandalaEmbedManagedPayload = {
                        ctx,
                        src,
                        sourcePath: ctx.sourcePath,
                        target,
                        parsedReference,
                        model,
                    };
                    controller.updateManaged(payload);
                } catch (error: unknown) {
                    logger.error('[mandala-embed]', {
                        phase: 'unexpected-error',
                        src: src ?? '<null>',
                        sourcePath: ctx.sourcePath,
                        error: formatUnknownError(error),
                    });

                    if (debugEnabled && embed.isConnected) {
                        controller.updateDebug([
                            'mandala debug: unexpected render error',
                            `src: ${src ?? '<null>'}`,
                            `error: ${formatUnknownError(error)}`,
                        ]);
                        continue;
                    }

                    controller.clear();
                }
            }
        };
    };
