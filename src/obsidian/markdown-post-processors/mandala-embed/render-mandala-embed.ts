import {
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
import { logger } from 'src/helpers/logger';
import {
    type MandalaEmbedTarget,
    type MandalaEmbedManagedPayload,
} from 'src/obsidian/markdown-post-processors/mandala-embed/mandala-embed-controller-types';
import { MandalaEmbedController } from 'src/obsidian/markdown-post-processors/mandala-embed/mandala-embed-controller';

type MandalaEmbedOrientation = 'left-to-right' | 'south-start' | 'bottom-to-top';
export const MANDALA_EMBED_POSTPROCESSOR_SORT_ORDER = 1000;

const SECTION_COMMENT_LINE_RE =
    /^\s*<!--\s*section:\s*(\d+(?:\.\d+)*)\s*-->\s*$/u;

const isSkippedContext = (el: HTMLElement) =>
    el.classList.contains('lng-prev') || Boolean(el.closest('.lng-prev'));

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
    parsedSrc: ParsedMandalaEmbedSrc,
): MandalaEmbedTarget | null => {
    const { path, subpath } = parseLinktext(parsedSrc.linktext);
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
    plugin.settings.getValue().view.mandalaGridOrientation ?? 'left-to-right';

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

            for (const embed of Array.from(embeds)) {
                const controller = getOrCreateController(plugin, embed);
                const src = embed.getAttribute('src');

                try {
                    const parsedSrc = parseMandalaEmbedSrc(src);
                    if (!parsedSrc) {
                        controller.clear();
                        continue;
                    }

                    const target = resolveEmbedTarget(plugin, ctx, parsedSrc);
                    if (!target) {
                        if (debugEnabled) {
                            const parsedLink = parseLinktext(parsedSrc.linktext);
                            controller.updateDebug([
                                'mandala debug: target resolve failed',
                                `src: ${src ?? '<null>'}`,
                                `linktext: ${parsedSrc.linktext}`,
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
                        parsedSrc,
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
