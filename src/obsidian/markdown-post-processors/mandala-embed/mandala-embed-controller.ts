import {
    MarkdownRenderChild,
    setIcon,
    type TFile,
} from 'obsidian';
import type MandalaGrid from 'src/main';
import { logger } from 'src/helpers/logger';
import { isSafeExternalUrl } from 'src/view/helpers/link-utils';
import { renderMarkdownContent } from 'src/view/actions/markdown-preview/helpers/render-markdown-content';
import { type MandalaEmbedManagedPayload } from 'src/obsidian/markdown-post-processors/mandala-embed/mandala-embed-controller-types';

const MANDALA_EMBED_HOST_CLASS = 'mandala-embed-host';
const MANDALA_EMBED_HEADER_CLASS = 'mandala-embed-host-header';
const MANDALA_EMBED_BODY_CLASS = 'mandala-embed-host-body';
const MANDALA_EMBED_MANAGED_ATTR = 'data-mandala-managed';
const MANDALA_EMBED_CELL_SIZE_VAR = '--mandala-embed-cell-size';
const MANDALA_EMBED_FONT_SIZE_VAR = '--mandala-embed-font-size';
const MANDALA_EMBED_HEADER_FONT_SIZE_VAR = '--mandala-embed-header-font-size';
const MANDALA_EMBED_CONTENT_PADDING_Y_VAR = '--mandala-embed-content-padding-y';
const MANDALA_EMBED_CONTENT_PADDING_X_VAR = '--mandala-embed-content-padding-x';
const MANDALA_EMBED_CONTENT_PADDING_BOTTOM_VAR =
    '--mandala-embed-content-padding-bottom';
const MANDALA_EMBED_HEADER_PADDING_Y_VAR = '--mandala-embed-header-padding-y';
const MANDALA_EMBED_HEADER_PADDING_X_VAR = '--mandala-embed-header-padding-x';
const MANDALA_EMBED_HEADER_GAP_VAR = '--mandala-embed-header-gap';
const MANDALA_EMBED_HEADER_BUTTON_SIZE_VAR = '--mandala-embed-header-button-size';
const MANDALA_EMBED_HEADER_ICON_SIZE_VAR = '--mandala-embed-header-icon-size';
const MANDALA_EMBED_SECTION_FONT_SIZE_VAR = '--mandala-embed-section-font-size';
const MANDALA_EMBED_LINE_HEIGHT_VAR = '--mandala-embed-line-height';
const MANDALA_EMBED_COMPACT_CLASS = 'is-compact';
const SECTION_COMMENT_BLOCK_RE = /<!--\s*section:\s*(\d+(?:\.\d+)*)\s*-->/gimu;
const TASK_LINE_RE = /^([ \t]*[-*+]\s*\[)([ xX])(\].*)$/gmu;

type ControllerState =
    | { mode: 'native' }
    | { mode: 'debug'; lines: string[] }
    | { mode: 'managed'; payload: MandalaEmbedManagedPayload };

const findSectionRange = (markdown: string, section: string) => {
    const markers = Array.from(markdown.matchAll(SECTION_COMMENT_BLOCK_RE));
    for (let index = 0; index < markers.length; index += 1) {
        const marker = markers[index];
        if (marker[1]?.trim() !== section) continue;

        const start = (marker.index ?? 0) + marker[0].length;
        const end = markers[index + 1]?.index ?? markdown.length;
        return { start, end };
    }
    return null;
};

const toggleTaskInSection = (
    markdown: string,
    section: string,
    taskIndex: number,
    checked: boolean,
) => {
    const range = findSectionRange(markdown, section);
    if (!range) return null;

    const sectionContent = markdown.slice(range.start, range.end);
    let currentTaskIndex = -1;
    for (const match of sectionContent.matchAll(TASK_LINE_RE)) {
        currentTaskIndex += 1;
        if (currentTaskIndex !== taskIndex) continue;

        const marker = match[1];
        if (!marker) return null;

        const taskStateIndex = range.start + (match.index ?? 0) + marker.length;
        const nextTaskState = checked ? 'x' : ' ';

        if (taskStateIndex < 0 || taskStateIndex >= markdown.length) return null;
        if (markdown[taskStateIndex] === nextTaskState) return markdown;

        return `${markdown.slice(0, taskStateIndex)}${nextTaskState}${markdown.slice(taskStateIndex + 1)}`;
    }

    return null;
};

const persistCheckboxToggle = async (
    plugin: MandalaGrid,
    sourceFile: TFile,
    section: string,
    taskIndex: number,
    checked: boolean,
) => {
    try {
        await plugin.app.vault.process(sourceFile, (markdown) => {
            const updated = toggleTaskInSection(
                markdown,
                section,
                taskIndex,
                checked,
            );
            return updated ?? markdown;
        });
    } catch (error: unknown) {
        logger.error('[mandala-embed]', {
            phase: 'toggle-checkbox-failed',
            file: sourceFile.path,
            section,
            taskIndex,
            checked,
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

const enableRenderedCheckboxes = (container: HTMLElement) => {
    for (const checkbox of Array.from(
        container.querySelectorAll<HTMLInputElement>(
            'input.task-list-item-checkbox[disabled]',
        ),
    )) {
        checkbox.disabled = false;
        checkbox.removeAttribute('disabled');
    }
};

const queryDirectChildByClass = (parent: HTMLElement, className: string) => {
    for (const child of Array.from(parent.children)) {
        if (!(child instanceof HTMLElement)) continue;
        if (child.classList.contains(className)) return child;
    }
    return null;
};

const formatUnknownError = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

export class MandalaEmbedController {
    private state: ControllerState = { mode: 'native' };
    private generation = 0;
    private scheduledRaf: number | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private resizeRafId = 0;
    private observedBody: HTMLElement | null = null;

    private readonly embedObserver: MutationObserver;
    private readonly onBodyClickBound: (event: Event) => void;
    private readonly onBodyChangeBound: (event: Event) => void;

    constructor(
        private readonly plugin: MandalaGrid,
        private readonly embed: HTMLElement,
    ) {
        this.onBodyClickBound = (event: Event) =>
            this.handleBodyClick(event as MouseEvent);
        this.onBodyChangeBound = (event: Event) => this.handleBodyChange(event);

        this.embedObserver = new MutationObserver(() => this.handleEmbedMutation());
        this.embedObserver.observe(this.embed, { childList: true });
    }

    updateManaged(payload: MandalaEmbedManagedPayload) {
        this.state = { mode: 'managed', payload };
        this.scheduleRender();
    }

    updateDebug(lines: string[]) {
        this.state = { mode: 'debug', lines };
        this.scheduleRender();
    }

    clear() {
        this.state = { mode: 'native' };
        this.cancelScheduledRender();
        void this.renderNow(this.nextGeneration());
    }

    private handleEmbedMutation() {
        if (this.state.mode !== 'managed') return;
        const host = this.queryMandalaHost();
        if (!host) {
            this.scheduleRender();
            return;
        }

        const hasHeader = Boolean(
            queryDirectChildByClass(host, MANDALA_EMBED_HEADER_CLASS),
        );
        const hasBody = Boolean(
            queryDirectChildByClass(host, MANDALA_EMBED_BODY_CLASS),
        );
        if (!hasHeader || !hasBody) {
            this.scheduleRender();
        }
    }

    private handleBodyClick(event: MouseEvent) {
        if (this.state.mode !== 'managed') return;

        const target = event.target;
        if (!(target instanceof Element)) return;

        const anchor = target.closest('a');
        if (!(anchor instanceof HTMLAnchorElement)) return;

        const sourcePath = this.state.payload.target.file.path;

        if (anchor.classList.contains('internal-link')) {
            const link =
                anchor.getAttribute('data-href') ?? anchor.getAttribute('href');
            if (!link) return;

            event.preventDefault();
            event.stopPropagation();
            void this.plugin.app.workspace.openLinkText(
                link,
                sourcePath,
                event.metaKey || event.ctrlKey,
            );
            return;
        }

        if (!anchor.classList.contains('external-link')) return;
        const href = anchor.getAttribute('href') ?? '';
        if (!isSafeExternalUrl(href)) return;

        event.preventDefault();
        event.stopPropagation();
        window.open(href, '_blank', 'noopener,noreferrer');
    }

    private handleBodyChange(event: Event) {
        if (this.state.mode !== 'managed') return;

        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        if (!target.classList.contains('task-list-item-checkbox')) return;

        const listItem = target.closest('.task-list-item');
        if (!(listItem instanceof HTMLElement)) return;

        const markdownEl = listItem.closest('.mandala-embed-3x3-cell-markdown');
        if (!(markdownEl instanceof HTMLElement)) return;

        const cellEl = listItem.closest('.mandala-embed-3x3-cell');
        if (!(cellEl instanceof HTMLElement)) return;

        const section = cellEl.dataset.mandalaSection;
        if (!section) return;

        const allItems = Array.from(markdownEl.querySelectorAll('.task-list-item'));
        const taskIndex = allItems.indexOf(listItem);
        if (taskIndex < 0) return;

        listItem.setAttribute('data-task', target.checked ? 'x' : ' ');
        listItem.toggleClass('is-checked', target.checked);

        const sourceFile = this.state.payload.target.file;
        void persistCheckboxToggle(
            this.plugin,
            sourceFile,
            section,
            taskIndex,
            target.checked,
        );
    }

    private nextGeneration() {
        this.generation += 1;
        return this.generation;
    }

    private cancelScheduledRender() {
        if (this.scheduledRaf !== null) {
            cancelAnimationFrame(this.scheduledRaf);
            this.scheduledRaf = null;
        }
    }

    private scheduleRender() {
        const generation = this.nextGeneration();
        this.cancelScheduledRender();
        this.scheduledRaf = requestAnimationFrame(() => {
            this.scheduledRaf = null;
            void this.renderNow(generation);
        });
    }

    private async renderNow(generation: number) {
        if (generation !== this.generation) return;

        try {
            if (this.state.mode === 'native') {
                this.clearManagedArtifacts();
                return;
            }

            if (this.state.mode === 'debug') {
                this.renderDebug(this.state.lines);
                return;
            }

            await this.renderManaged(generation, this.state.payload);
        } catch (error: unknown) {
            this.handleRenderFailure(generation, error);
        }
    }

    private handleRenderFailure(generation: number, error: unknown) {
        // Ignore stale async failures from older generations to avoid
        // clearing a newer successful render.
        if (generation !== this.generation) return;

        logger.error('[mandala-embed]', {
            phase: 'controller-render-failed',
            src: this.embed.getAttribute('src') ?? '<null>',
            error: formatUnknownError(error),
        });
        this.clearManagedArtifacts();
    }

    private async renderManaged(
        generation: number,
        payload: MandalaEmbedManagedPayload,
    ) {
        if (!this.embed.isConnected) return;
        if (generation !== this.generation) return;

        const currentSrc = this.embed.getAttribute('src');
        if (currentSrc !== payload.src) return;

        const { header, body } = this.getOrCreateHostLayout();
        this.embed.setAttribute(MANDALA_EMBED_MANAGED_ATTR, 'true');
        this.embed.classList.add('mandala-embed-3x3');
        this.embed.classList.remove('mandala-embed-debug');

        this.renderHeader(header, payload);
        this.ensureBodyListeners(body);

        const gridEl = document.createElement('div');
        gridEl.className = 'mandala-embed-3x3-grid';

        for (const row of payload.model.rows) {
            for (const cell of row) {
                if (generation !== this.generation) return;

                const cellEl = document.createElement('div');
                cellEl.className = 'mandala-embed-3x3-cell';
                cellEl.dataset.mandalaSection = cell.section;
                if (cell.section === payload.model.rows[1]?.[1]?.section) {
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
                    payload.ctx.addChild(renderChild);
                    await renderMarkdownContent({
                        app: this.plugin.app,
                        content: cell.markdown,
                        element: markdownEl,
                        sourcePath: payload.target.file.path,
                        component: renderChild,
                        applyFormatText: true,
                        onAfterRender: enableRenderedCheckboxes,
                    });
                    if (generation !== this.generation) return;
                }

                gridEl.appendChild(cellEl);
            }
        }

        if (generation !== this.generation) return;

        body.empty();
        body.appendChild(gridEl);
        this.attachResizeObserver(body, gridEl);
    }

    private renderHeader(
        headerEl: HTMLElement,
        payload: MandalaEmbedManagedPayload,
    ) {
        headerEl.empty();

        const titleEl = document.createElement('h1');
        titleEl.className = 'mandala-embed-header-title';
        titleEl.setText(
            payload.target.centerHeading ?? payload.target.file.basename,
        );

        const linkBtn = document.createElement('button');
        linkBtn.className = 'mandala-embed-header-link';
        linkBtn.type = 'button';
        linkBtn.setAttribute('aria-label', 'Open embed target in note');

        const linkIcon = document.createElement('span');
        linkIcon.className = 'mandala-embed-header-link-icon';
        setIcon(linkIcon, 'maximize-2');
        linkBtn.appendChild(linkIcon);

        linkBtn.addEventListener('click', (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            void this.plugin.app.workspace.openLinkText(
                payload.parsedSrc.linktext,
                payload.sourcePath,
                false,
            );
        });

        headerEl.appendChild(titleEl);
        headerEl.appendChild(linkBtn);
    }

    private renderDebug(lines: string[]) {
        const { body } = this.getOrCreateHostLayout();

        this.embed.setAttribute(MANDALA_EMBED_MANAGED_ATTR, 'true');
        this.embed.classList.remove('mandala-embed-3x3');
        this.embed.classList.add('mandala-embed-debug');

        body.empty();
        const panel = document.createElement('div');
        panel.className = 'mandala-embed-debug-panel';

        for (const line of lines) {
            const row = document.createElement('div');
            row.className = 'mandala-embed-debug-line';
            row.setText(line);
            panel.appendChild(row);
        }

        body.appendChild(panel);
    }

    private clearManagedArtifacts() {
        const hadArtifacts =
            this.embed.getAttribute(MANDALA_EMBED_MANAGED_ATTR) === 'true' ||
            this.embed.classList.contains('mandala-embed-3x3') ||
            this.embed.classList.contains('mandala-embed-debug') ||
            Boolean(this.queryMandalaHost());
        if (!hadArtifacts) return;

        this.detachBodyListeners();
        this.detachResizeObserver();

        const host = this.queryMandalaHost();
        host?.remove();
        this.embed.removeAttribute(MANDALA_EMBED_MANAGED_ATTR);
        this.embed.classList.remove('mandala-embed-3x3');
        this.embed.classList.remove('mandala-embed-debug');
    }

    private queryMandalaHost() {
        for (const child of Array.from(this.embed.children)) {
            if (!(child instanceof HTMLElement)) continue;
            if (child.classList.contains(MANDALA_EMBED_HOST_CLASS)) return child;
        }
        return null;
    }

    private getOrCreateHostLayout() {
        let host = this.queryMandalaHost();
        if (!host) {
            host = document.createElement('div');
            host.className = MANDALA_EMBED_HOST_CLASS;
            this.embed.appendChild(host);
        }

        let header = queryDirectChildByClass(host, MANDALA_EMBED_HEADER_CLASS);
        if (!header) {
            header = document.createElement('div');
            header.className = MANDALA_EMBED_HEADER_CLASS;
            host.appendChild(header);
        }

        let body = queryDirectChildByClass(host, MANDALA_EMBED_BODY_CLASS);
        if (!body) {
            body = document.createElement('div');
            body.className = MANDALA_EMBED_BODY_CLASS;
            host.appendChild(body);
        }

        if (host.firstElementChild !== header) {
            host.insertBefore(header, host.firstChild);
        }
        if (header.nextElementSibling !== body) {
            host.insertBefore(body, header.nextSibling);
        }

        return { host, header, body };
    }

    private ensureBodyListeners(body: HTMLElement) {
        if (this.observedBody === body) return;

        this.detachBodyListeners();
        body.addEventListener('click', this.onBodyClickBound);
        body.addEventListener('change', this.onBodyChangeBound);
        this.observedBody = body;
    }

    private detachBodyListeners() {
        if (!this.observedBody) return;

        this.observedBody.removeEventListener('click', this.onBodyClickBound);
        this.observedBody.removeEventListener('change', this.onBodyChangeBound);
        this.observedBody = null;
    }

    private attachResizeObserver(body: HTMLElement, gridEl: HTMLElement) {
        this.detachResizeObserver();

        const clamp = (value: number, min: number, max: number) =>
            Math.min(max, Math.max(min, value));

        const update = () => {
            const width = body.clientWidth;
            if (width <= 0) return;
            const cellSize = Math.max(1, Math.floor(width / 3));
            const scale = clamp(cellSize / 120, 0.45, 1.15);

            const contentFontSize = clamp(Math.round(16 * scale), 9, 16);
            const headerFontSize = clamp(Math.round(contentFontSize * 1.15), 10, 18);
            const sectionFontSize = clamp(Math.round(10 * scale), 7, 10);

            const contentPaddingY = clamp(Math.round(8 * scale), 2, 8);
            const contentPaddingX = clamp(Math.round(10 * scale), 2, 10);
            const contentPaddingBottom = clamp(Math.round(14 * scale), 6, 14);

            const headerPaddingY = clamp(Math.round(4 * scale), 2, 4);
            const headerPaddingX = clamp(Math.round(8 * scale), 4, 8);
            const headerGap = clamp(Math.round(8 * scale), 4, 8);
            const headerButtonSize = clamp(Math.round(20 * scale), 14, 20);
            const headerIconSize = clamp(Math.round(14 * scale), 10, 14);

            const lineHeight = clamp(1.22 + scale * 0.2, 1.26, 1.42);

            gridEl.classList.toggle(MANDALA_EMBED_COMPACT_CLASS, cellSize < 68);
            gridEl.style.setProperty(MANDALA_EMBED_CELL_SIZE_VAR, `${cellSize}px`);
            gridEl.style.setProperty(
                MANDALA_EMBED_FONT_SIZE_VAR,
                `${contentFontSize}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_HEADER_FONT_SIZE_VAR,
                `${headerFontSize}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_SECTION_FONT_SIZE_VAR,
                `${sectionFontSize}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_CONTENT_PADDING_Y_VAR,
                `${contentPaddingY}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_CONTENT_PADDING_X_VAR,
                `${contentPaddingX}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_CONTENT_PADDING_BOTTOM_VAR,
                `${contentPaddingBottom}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_HEADER_PADDING_Y_VAR,
                `${headerPaddingY}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_HEADER_PADDING_X_VAR,
                `${headerPaddingX}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_HEADER_GAP_VAR,
                `${headerGap}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_HEADER_BUTTON_SIZE_VAR,
                `${headerButtonSize}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_HEADER_ICON_SIZE_VAR,
                `${headerIconSize}px`,
            );
            gridEl.style.setProperty(
                MANDALA_EMBED_LINE_HEIGHT_VAR,
                lineHeight.toFixed(2),
            );
        };

        const scheduleUpdate = () => {
            if (this.resizeRafId !== 0) cancelAnimationFrame(this.resizeRafId);
            this.resizeRafId = requestAnimationFrame(() => {
                this.resizeRafId = 0;
                update();
            });
        };

        this.resizeObserver = new ResizeObserver(() => scheduleUpdate());
        this.resizeObserver.observe(body);
        scheduleUpdate();
    }

    private detachResizeObserver() {
        if (this.resizeRafId !== 0) {
            cancelAnimationFrame(this.resizeRafId);
            this.resizeRafId = 0;
        }
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }
}
