import {
    MarkdownRenderChild,
    parseLinktext,
    TFile,
    type EmbedCache,
    type MarkdownPostProcessorContext,
} from 'obsidian';
import type MandalaGrid from 'src/main';
import {
    parseMandalaEmbedReference,
    type MandalaEmbedReferenceLike,
    type ParsedMandalaEmbedReference,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';
import { mapRenderedEmbedsToCache } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-cache';
import { mapRenderedEmbedsToMarkdownReferences } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-markdown-references';
import { mapRenderedEmbedsToSectionReferences } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-section-references';
import { type MandalaEmbedGridModel } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';
import {
    buildMandalaEmbedModel,
    buildMandalaEmbedModelCacheKey,
    getMandalaEmbedOrientation,
    resolveMandalaEmbedTarget,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/resolve-mandala-embed-model';
import { logger } from 'src/helpers/logger';
import {
    type MandalaEmbedTarget,
    type MandalaEmbedManagedPayload,
} from 'src/obsidian/markdown-post-processors/mandala-embed/mandala-embed-controller-types';
import { MandalaEmbedController } from 'src/obsidian/markdown-post-processors/mandala-embed/mandala-embed-controller';
import {
    registerManagedMandalaEmbedController,
    unregisterManagedMandalaEmbedController,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/managed-mandala-embed-registry';
import { findRenderedMarkdown } from 'src/view/actions/markdown-preview/helpers/rendered-markdown-registry';

export const MANDALA_EMBED_POSTPROCESSOR_SORT_ORDER = 1000;
const MANDALA_EMBED_MANAGED_ATTR = 'data-mandala-managed';
const MAX_MANAGED_ANCESTOR_DEPTH = 1;

const controllerByEmbed = new WeakMap<HTMLElement, MandalaEmbedController>();
const cleanupChildByEmbed = new WeakMap<HTMLElement, MarkdownRenderChild>();

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

const ensureControllerCleanupChild = (
    ctx: MarkdownPostProcessorContext,
    embed: HTMLElement,
    controller: MandalaEmbedController,
) => {
    if (cleanupChildByEmbed.has(embed)) return;

    class MandalaEmbedControllerCleanupChild extends MarkdownRenderChild {
        override onunload() {
            unregisterManagedMandalaEmbedController(controller);
            controller.destroy();
            controllerByEmbed.delete(embed);
            cleanupChildByEmbed.delete(embed);
        }
    }

    const cleanupChild = new MandalaEmbedControllerCleanupChild(embed);
    cleanupChildByEmbed.set(embed, cleanupChild);
    ctx.addChild(cleanupChild);
};

const formatUnknownError = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

const resolveCachedReferencesForEmbeds = (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
    embeds: HTMLElement[],
) => {
    const sourceFile = plugin.app.vault.getFileByPath(ctx.sourcePath);
    if (!(sourceFile instanceof TFile) || sourceFile.extension !== 'md') {
        return new Map<HTMLElement, EmbedCache>();
    }

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

const doesEmbedTargetMatchReference = (
    plugin: MandalaGrid,
    sourceFile: TFile | null,
    src: string | null,
    linktext: string,
) => {
    if (!sourceFile || !src) return false;

    const embedTarget = resolveMandalaEmbedTarget(plugin, sourceFile, {
        linktext: src,
    });
    const referenceTarget = resolveMandalaEmbedTarget(plugin, sourceFile, {
        linktext,
    });

    return (
        embedTarget?.file.path === referenceTarget?.file.path &&
        embedTarget?.centerHeading === referenceTarget?.centerHeading
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
            const sourceFile = plugin.app.vault.getFileByPath(ctx.sourcePath);

            const debugEnabled =
                plugin.settings.getValue().view.mandalaEmbedDebug ?? false;
            const orientation = getMandalaEmbedOrientation(plugin);
            const modelCache = new Map<
                string,
                Promise<MandalaEmbedGridModel | null>
            >();
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

            const getModel = (target: MandalaEmbedTarget) => {
                const cacheKey = buildMandalaEmbedModelCacheKey(
                    target,
                    orientation,
                );
                const cached = modelCache.get(cacheKey);
                if (cached) return cached;

                const loading = buildMandalaEmbedModel(
                    plugin,
                    target,
                    orientation,
                ).catch(() => null);
                modelCache.set(cacheKey, loading);
                return loading;
            };

            for (const embed of embeds) {
                const controller = getOrCreateController(plugin, embed);
                ensureControllerCleanupChild(ctx, embed, controller);
                const src = embed.getAttribute('src');
                const renderedMarkdownReference =
                    renderedMarkdownReferenceByEmbed.get(embed);
                const sectionReference = sectionReferenceByEmbed.get(embed);
                const cachedReference = cachedReferenceByEmbed.get(embed);
                const managedAncestorDepth = getManagedAncestorDepth(embed);

                try {
                    if (managedAncestorDepth > MAX_MANAGED_ANCESTOR_DEPTH) {
                        unregisterManagedMandalaEmbedController(controller);
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
                                sourceFile instanceof TFile ? sourceFile : null,
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
                        unregisterManagedMandalaEmbedController(controller);
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

                    if (!(sourceFile instanceof TFile) || sourceFile.extension !== 'md') {
                        unregisterManagedMandalaEmbedController(controller);
                        if (debugEnabled) {
                            controller.updateDebug([
                                'mandala debug: source file resolve failed',
                                `src: ${src ?? '<null>'}`,
                                `sourcePath: ${ctx.sourcePath}`,
                            ]);
                            continue;
                        }
                        controller.clear();
                        continue;
                    }

                    const target = resolveMandalaEmbedTarget(
                        plugin,
                        sourceFile,
                        parsedReference,
                    );
                    if (!target) {
                        unregisterManagedMandalaEmbedController(controller);
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
                        unregisterManagedMandalaEmbedController(controller);
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
                    registerManagedMandalaEmbedController(
                        controller,
                        target.file.path,
                    );
                    controller.updateManaged(payload);
                } catch (error: unknown) {
                    unregisterManagedMandalaEmbedController(controller);
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
