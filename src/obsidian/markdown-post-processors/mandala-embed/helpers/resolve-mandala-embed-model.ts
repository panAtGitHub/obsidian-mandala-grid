import { parseLinktext, resolveSubpath, TFile } from 'obsidian';
import type MandalaGrid from 'src/main';
import {
    createMandalaEmbedGridModel,
    type MandalaEmbedGridModel,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';
import { type ParsedMandalaEmbedReference } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';
import { type MandalaEmbedTarget } from 'src/obsidian/markdown-post-processors/mandala-embed/mandala-embed-controller-types';

export type MandalaEmbedOrientation = 'left-to-right' | 'south-start';

export type ResolvedMandalaEmbedModel = {
    target: MandalaEmbedTarget;
    model: MandalaEmbedGridModel;
};

const SECTION_COMMENT_LINE_RE =
    /^\s*<!--\s*section:\s*(\d+(?:\.\d+)*)\s*-->\s*$/u;

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

export const getMandalaEmbedOrientation = (
    plugin: MandalaGrid,
): MandalaEmbedOrientation =>
    plugin.settings.getValue().view.mandalaGridOrientation === 'south-start'
        ? 'south-start'
        : 'left-to-right';

export const resolveMandalaEmbedTarget = (
    plugin: MandalaGrid,
    sourceFile: TFile,
    parsedReference: ParsedMandalaEmbedReference,
): MandalaEmbedTarget | null => {
    const { path, subpath } = parseLinktext(parsedReference.linktext);
    if (!path) return null;

    const file = resolveMarkdownFile(plugin, path, sourceFile.path);
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

export const buildMandalaEmbedModelCacheKey = (
    target: MandalaEmbedTarget,
    orientation: MandalaEmbedOrientation,
) => {
    const center = target.centerHeading ?? 'root';
    return `${target.file.path}::${target.file.stat.mtime}::${orientation}::${center}`;
};

export const buildMandalaEmbedModel = async (
    plugin: MandalaGrid,
    target: MandalaEmbedTarget,
    orientation: MandalaEmbedOrientation,
) => {
    const markdown = await plugin.app.vault.cachedRead(target.file);
    const resolveCenterSectionByOfficialSubpath = () => {
        if (!target.centerHeading) return null;
        const cache = plugin.app.metadataCache.getFileCache(target.file);
        if (!cache) return null;
        const subpathResult = resolveSubpath(cache, `#${target.centerHeading}`);
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

export const resolveMandalaEmbedModel = async (
    plugin: MandalaGrid,
    sourceFile: TFile,
    parsedReference: ParsedMandalaEmbedReference,
    orientation: MandalaEmbedOrientation,
): Promise<ResolvedMandalaEmbedModel | null> => {
    const target = resolveMandalaEmbedTarget(plugin, sourceFile, parsedReference);
    if (!target) return null;

    const model = await buildMandalaEmbedModel(plugin, target, orientation);
    if (!model) return null;

    return { target, model };
};
