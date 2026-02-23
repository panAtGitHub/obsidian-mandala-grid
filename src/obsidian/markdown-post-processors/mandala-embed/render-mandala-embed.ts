import { parseLinktext, TFile, type MarkdownPostProcessorContext } from 'obsidian';
import type MandalaGrid from 'src/main';
import {
    createMandalaEmbedGridModel,
    type MandalaEmbedGridModel,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';
import { parseMandalaEmbedSrc } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-src';

type MandalaEmbedOrientation = 'left-to-right' | 'south-start' | 'bottom-to-top';
export const MANDALA_EMBED_POSTPROCESSOR_SORT_ORDER = 1000;

type EmbedTarget = {
    file: TFile;
    centerSection: string | null;
};

const isSkippedContext = (el: HTMLElement) =>
    el.classList.contains('lng-prev') || Boolean(el.closest('.lng-prev'));

const renderGrid = (container: HTMLElement, model: MandalaEmbedGridModel) => {
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

            if (cell.title) {
                const titleEl = document.createElement('div');
                titleEl.className = 'mandala-embed-3x3-cell-title';
                titleEl.setText(cell.title);
                cellEl.appendChild(titleEl);
            }

            if (cell.body) {
                const bodyEl = document.createElement('div');
                bodyEl.className = 'mandala-embed-3x3-cell-body';
                bodyEl.setText(cell.body);
                cellEl.appendChild(bodyEl);
            }

            const sectionEl = document.createElement('span');
            sectionEl.className = 'mandala-embed-3x3-cell-section';
            sectionEl.setText(cell.section);
            cellEl.appendChild(sectionEl);

            gridEl.appendChild(cellEl);
        }
    }

    container.empty();
    container.appendChild(gridEl);
};

const getEmbedContentEl = (embed: HTMLElement) => {
    const contentEl = embed.querySelector<HTMLElement>('.markdown-embed-content');
    if (contentEl) return contentEl;

    const created = document.createElement('div');
    created.className = 'markdown-embed-content';
    embed.appendChild(created);
    return created;
};

const resolveEmbedTarget = (
    plugin: MandalaGrid,
    ctx: MarkdownPostProcessorContext,
    src: string | null,
): EmbedTarget | null => {
    const parsedSrc = parseMandalaEmbedSrc(src);
    if (!parsedSrc) return null;

    const { path, subpath } = parseLinktext(parsedSrc.linktext);
    if (!path || subpath) return null;

    const file = plugin.app.metadataCache.getFirstLinkpathDest(path, ctx.sourcePath);
    if (!(file instanceof TFile) || file.extension !== 'md') return null;

    return {
        file,
        centerSection: parsedSrc.centerSection,
    };
};

const getOrientation = (plugin: MandalaGrid): MandalaEmbedOrientation =>
    plugin.settings.getValue().view.mandalaGridOrientation ?? 'left-to-right';

const buildModelFromFile = async (
    plugin: MandalaGrid,
    file: TFile,
    orientation: MandalaEmbedOrientation,
    centerSection: string | null,
) => {
    const markdown = await plugin.app.vault.cachedRead(file);
    return createMandalaEmbedGridModel(markdown, orientation, centerSection);
};

export const createRenderMandalaEmbedPostProcessor =
    (plugin: MandalaGrid) =>
    async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        if (isSkippedContext(el)) return;

        const embeds = el.querySelectorAll<HTMLElement>('.internal-embed');
        if (embeds.length === 0) return;

        const orientation = getOrientation(plugin);
        const modelCache = new Map<string, Promise<MandalaEmbedGridModel | null>>();

        const getModel = (target: EmbedTarget) => {
            const center = target.centerSection ?? '1';
            const cacheKey = `${target.file.path}::${target.file.stat.mtime}::${orientation}::${center}`;
            const cached = modelCache.get(cacheKey);
            if (cached) return cached;

            const loading = buildModelFromFile(
                plugin,
                target.file,
                orientation,
                target.centerSection,
            ).catch(() => null);
            modelCache.set(cacheKey, loading);
            return loading;
        };

        await Promise.all(
            Array.from(embeds).map(async (embed) => {
                const target = resolveEmbedTarget(
                    plugin,
                    ctx,
                    embed.getAttribute('src'),
                );
                if (!target) return;

                const model = await getModel(target);
                if (!model || !embed.isConnected) return;

                const contentEl = getEmbedContentEl(embed);

                embed.classList.add('mandala-embed-3x3');
                renderGrid(contentEl, model);
            }),
        );
    };

