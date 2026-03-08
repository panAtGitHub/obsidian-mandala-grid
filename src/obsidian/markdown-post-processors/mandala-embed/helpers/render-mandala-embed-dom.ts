import { MarkdownRenderChild, setIcon } from 'obsidian';
import type MandalaGrid from 'src/main';
import {
    applyMandalaEmbedResponsiveSizing,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/apply-mandala-embed-responsive-sizing';
import {
    type MandalaEmbedGridModel,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';
import {
    type MandalaEmbedTarget,
} from 'src/obsidian/markdown-post-processors/mandala-embed/mandala-embed-controller-types';
import { renderMarkdownContent } from 'src/view/actions/markdown-preview/helpers/render-markdown-content';

export const MANDALA_EMBED_HOST_CLASS = 'mandala-embed-host';
export const MANDALA_EMBED_HEADER_CLASS = 'mandala-embed-host-header';
export const MANDALA_EMBED_BODY_CLASS = 'mandala-embed-host-body';

type RegisterMarkdownChild = (child: MarkdownRenderChild) => void;

type AttachOpenTargetClick = (
    button: HTMLButtonElement,
    listener: (event: MouseEvent) => void,
) => void;

export const createMandalaEmbedHostLayout = () => {
    const host = document.createElement('div');
    host.className = MANDALA_EMBED_HOST_CLASS;

    const header = document.createElement('div');
    header.className = MANDALA_EMBED_HEADER_CLASS;
    host.appendChild(header);

    const body = document.createElement('div');
    body.className = MANDALA_EMBED_BODY_CLASS;
    host.appendChild(body);

    return { host, header, body };
};

export const renderMandalaEmbedHeader = ({
    headerEl,
    title,
    attachOpenTargetClick,
    onOpenTarget,
}: {
    headerEl: HTMLElement;
    title: string;
    attachOpenTargetClick?: AttachOpenTargetClick;
    onOpenTarget: (event: MouseEvent) => void;
}) => {
    headerEl.empty();

    const titleEl = document.createElement('h1');
    titleEl.className = 'mandala-embed-header-title';
    titleEl.setText(title);
    headerEl.appendChild(titleEl);

    const linkBtn = document.createElement('button');
    linkBtn.className = 'mandala-embed-header-link';
    linkBtn.type = 'button';
    linkBtn.setAttribute('aria-label', 'Open embed target in note');
    headerEl.appendChild(linkBtn);

    const linkIcon = document.createElement('span');
    linkIcon.className = 'mandala-embed-header-link-icon';
    setIcon(linkIcon, 'maximize-2');
    linkBtn.appendChild(linkIcon);

    if (attachOpenTargetClick) {
        attachOpenTargetClick(linkBtn, onOpenTarget);
    } else {
        linkBtn.addEventListener('click', onOpenTarget);
    }
};

export const buildMandalaEmbedGrid = async ({
    plugin,
    model,
    sourcePath,
    registerMarkdownChild,
    onAfterCellMarkdownRender,
    isCanceled,
}: {
    plugin: MandalaGrid;
    model: MandalaEmbedGridModel;
    sourcePath: string;
    registerMarkdownChild: RegisterMarkdownChild;
    onAfterCellMarkdownRender?: (element: HTMLElement) => void;
    isCanceled?: () => boolean;
}) => {
    const gridEl = document.createElement('div');
    gridEl.className = 'mandala-embed-3x3-grid';

    const renderTasks: Promise<void>[] = [];

    for (const row of model.rows) {
        for (const cell of row) {
            if (isCanceled?.()) return null;

            const cellEl = document.createElement('div');
            cellEl.className = 'mandala-embed-3x3-cell';
            cellEl.dataset.mandalaSection = cell.section;
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
                'mandala-embed-3x3-cell-markdown markdown-rendered';
            contentEl.appendChild(markdownEl);

            if (cell.markdown.trim()) {
                const renderChild = new MarkdownRenderChild(markdownEl);
                registerMarkdownChild(renderChild);
                renderTasks.push(
                    (async () => {
                        if (isCanceled?.()) return;

                        await renderMarkdownContent({
                            app: plugin.app,
                            content: cell.markdown,
                            element: markdownEl,
                            sourcePath,
                            component: renderChild,
                            applyFormatText: true,
                        });

                        if (isCanceled?.()) return;
                        onAfterCellMarkdownRender?.(markdownEl);
                    })(),
                );
            }

            gridEl.appendChild(cellEl);
        }
    }

    await Promise.all(renderTasks);
    return isCanceled?.() ? null : gridEl;
};

export const attachMandalaEmbedResponsiveSizing = ({
    rootEl,
    bodyEl,
    gridEl,
}: {
    rootEl: HTMLElement;
    bodyEl: HTMLElement;
    gridEl: HTMLElement;
}) =>
    applyMandalaEmbedResponsiveSizing({
        rootEl,
        bodyEl,
        gridEl,
    });

export const getMandalaEmbedTitle = (target: MandalaEmbedTarget) =>
    target.centerHeading ?? target.file.basename;
