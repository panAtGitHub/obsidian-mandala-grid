import { MarkdownRenderChild, MarkdownView, type TFile } from 'obsidian';
import type MandalaGrid from 'src/main';
import { logger } from 'src/shared/helpers/logger';
import { isSafeExternalUrl } from 'src/view/helpers/link-utils';
import { type MandalaEmbedManagedPayload } from 'src/obsidian/markdown-post-processors/mandala-embed/mandala-embed-controller-types';
import {
    MANDALA_EMBED_ROOT_DENSITY_COMPACT_CLASS,
    MANDALA_EMBED_ROOT_DENSITY_ULTRA_CLASS,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/apply-mandala-embed-responsive-sizing';
import {
    attachMandalaEmbedResponsiveSizing,
    buildMandalaEmbedGrid,
    getMandalaEmbedTitle,
    MANDALA_EMBED_BODY_CLASS,
    MANDALA_EMBED_HEADER_CLASS,
    MANDALA_EMBED_HOST_CLASS,
    primeMandalaEmbedResponsiveSizing,
    renderMandalaEmbedHeader,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/render-mandala-embed-dom';
import {
    buildMandalaEmbedModel,
    buildMandalaEmbedRenderKey,
    getMandalaEmbedOrientation,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/resolve-mandala-embed-model';

const MANDALA_EMBED_MANAGED_ATTR = 'data-mandala-managed';
const SECTION_COMMENT_BLOCK_RE = /<!--\s*section:\s*(\d+(?:\.\d+)*)\s*-->/gimu;
const TASK_LINE_RE = /^([ \t]*[-*+]\s*\[)([ xX])(\].*)$/gmu;

type ControllerState =
    | { mode: 'native' }
    | { mode: 'debug'; lines: string[] }
    | { mode: 'managed'; payload: MandalaEmbedManagedPayload };

type MarkdownPreviewScrollSnapshot = {
    view: MarkdownView;
    scroll: ReturnType<MarkdownView['previewMode']['getScroll']>;
};

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
    private detachResponsiveSizing: (() => void) | null = null;
    private releaseBodyHeightLock: (() => void) | null = null;
    private bodyHeightUnlockRaf = 0;
    private previewScrollRestoreRaf = 0;
    private pendingPreviewScrollSnapshots: MarkdownPreviewScrollSnapshot[] | null =
        null;
    private observedBody: HTMLElement | null = null;
    private renderScope: MarkdownRenderChild | null = null;

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
        if (
            this.state.mode === 'managed' &&
            this.state.payload.renderKey === payload.renderKey &&
            this.state.payload.src === payload.src &&
            this.state.payload.sourcePath === payload.sourcePath
        ) {
            return;
        }

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

    isConnected() {
        return this.embed.isConnected;
    }

    async refreshManagedModel() {
        if (this.state.mode !== 'managed') return;

        const payload = this.state.payload;
        this.pendingPreviewScrollSnapshots = this.capturePreviewScrollSnapshots(
            payload.sourcePath,
        );
        const orientation = getMandalaEmbedOrientation(this.plugin);
        const model = await buildMandalaEmbedModel(
            this.plugin,
            payload.target,
            orientation,
        );
        if (!this.embed.isConnected) return;

        if (!model) {
            this.clear();
            return;
        }

        const nextRenderKey = buildMandalaEmbedRenderKey(
            payload.target,
            orientation,
            this.plugin.getMandalaEmbedRefreshEpoch(),
        );

        this.state = {
            mode: 'managed',
            payload: {
                ...payload,
                renderKey: nextRenderKey,
                model,
            },
        };

        if (nextRenderKey === payload.renderKey) {
            this.pendingPreviewScrollSnapshots = null;
            return;
        }

        this.scheduleRender();
    }

    destroy() {
        this.cancelScheduledRender();
        this.embedObserver.disconnect();
        this.clearManagedArtifacts();
        this.state = { mode: 'native' };
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
        const renderScope = this.replaceRenderScope(payload);

        renderMandalaEmbedHeader({
            headerEl: header,
            title: getMandalaEmbedTitle(payload.target),
            attachOpenTargetClick: (button, listener) =>
                renderScope.registerDomEvent(button, 'click', listener),
            onOpenTarget: (event) => {
                event.preventDefault();
                event.stopPropagation();
                void this.plugin.app.workspace.openLinkText(
                    payload.parsedReference.linktext,
                    payload.sourcePath,
                    false,
                );
            },
        });
        this.ensureBodyListeners(body);

        const gridEl = await buildMandalaEmbedGrid({
            plugin: this.plugin,
            model: payload.model,
            sourcePath: payload.target.file.path,
            registerMarkdownChild: (child) => renderScope.addChild(child),
            onAfterCellMarkdownRender: enableRenderedCheckboxes,
            isCanceled: () =>
                generation !== this.generation ||
                !this.embed.isConnected ||
                this.embed.getAttribute('src') !== payload.src,
        });
        if (!gridEl) return;

        if (generation !== this.generation) return;

        this.lockBodyHeight(body);
        primeMandalaEmbedResponsiveSizing({
            rootEl: this.embed,
            bodyEl: body,
            gridEl,
        });
        body.replaceChildren(gridEl);
        this.attachResponsiveSizing(body, gridEl);
        this.scheduleBodyHeightUnlock(body, generation);
        this.schedulePendingPreviewScrollRestore(generation);
    }

    private renderDebug(lines: string[]) {
        const { body } = this.getOrCreateHostLayout();
        this.clearBodyHeightLock();
        this.clearRenderScope();
        body.style.removeProperty('height');

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
        this.detachResponsiveSizing?.();
        this.detachResponsiveSizing = null;
        this.clearBodyHeightLock();
        this.clearPendingPreviewScrollRestore();
        this.clearRenderScope();

        const host = this.queryMandalaHost();
        host?.remove();
        this.embed.removeAttribute(MANDALA_EMBED_MANAGED_ATTR);
        this.embed.classList.remove('mandala-embed-3x3');
        this.embed.classList.remove('mandala-embed-debug');
        this.embed.classList.remove(MANDALA_EMBED_ROOT_DENSITY_COMPACT_CLASS);
        this.embed.classList.remove(MANDALA_EMBED_ROOT_DENSITY_ULTRA_CLASS);
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

    private attachResponsiveSizing(body: HTMLElement, gridEl: HTMLElement) {
        this.detachResponsiveSizing?.();
        this.detachResponsiveSizing = attachMandalaEmbedResponsiveSizing({
            rootEl: this.embed,
            bodyEl: body,
            gridEl,
        });
    }

    private lockBodyHeight(body: HTMLElement) {
        this.clearBodyHeightLock();

        const previousHeight = Math.ceil(body.getBoundingClientRect().height);
        if (previousHeight <= 0) return;

        const previousMinHeight = body.style.minHeight;
        body.style.minHeight = `${previousHeight}px`;
        this.releaseBodyHeightLock = () => {
            body.style.minHeight = previousMinHeight;
        };
    }

    private scheduleBodyHeightUnlock(body: HTMLElement, generation: number) {
        if (!this.releaseBodyHeightLock) return;

        this.bodyHeightUnlockRaf = requestAnimationFrame(() => {
            this.bodyHeightUnlockRaf = requestAnimationFrame(() => {
                this.bodyHeightUnlockRaf = 0;
                if (generation !== this.generation) return;
                if (!body.isConnected) return;
                this.clearBodyHeightLock();
            });
        });
    }

    private clearBodyHeightLock() {
        if (this.bodyHeightUnlockRaf !== 0) {
            cancelAnimationFrame(this.bodyHeightUnlockRaf);
            this.bodyHeightUnlockRaf = 0;
        }

        this.releaseBodyHeightLock?.();
        this.releaseBodyHeightLock = null;
    }

    private capturePreviewScrollSnapshots(sourcePath: string) {
        const snapshots: MarkdownPreviewScrollSnapshot[] = [];

        this.plugin.app.workspace.iterateAllLeaves((leaf) => {
            const view = leaf.view;
            if (!(view instanceof MarkdownView)) return;
            if (view.getMode() !== 'preview') return;
            if (view.file?.path !== sourcePath) return;

            snapshots.push({
                view,
                scroll: view.previewMode.getScroll(),
            });
        });

        return snapshots;
    }

    private schedulePendingPreviewScrollRestore(generation: number) {
        const snapshots = this.pendingPreviewScrollSnapshots;
        this.pendingPreviewScrollSnapshots = null;
        if (!snapshots || snapshots.length === 0) return;

        this.clearPendingPreviewScrollRestore();
        this.previewScrollRestoreRaf = requestAnimationFrame(() => {
            this.previewScrollRestoreRaf = requestAnimationFrame(() => {
                this.previewScrollRestoreRaf = requestAnimationFrame(() => {
                    this.previewScrollRestoreRaf = 0;
                    if (generation !== this.generation) return;

                    for (const { view, scroll } of snapshots) {
                        if (!view.file) continue;
                        if (view.getMode() !== 'preview') continue;
                        view.previewMode.applyScroll(scroll);
                    }
                });
            });
        });
    }

    private clearPendingPreviewScrollRestore() {
        if (this.previewScrollRestoreRaf !== 0) {
            cancelAnimationFrame(this.previewScrollRestoreRaf);
            this.previewScrollRestoreRaf = 0;
        }

        this.pendingPreviewScrollSnapshots = null;
    }

    private replaceRenderScope(payload: MandalaEmbedManagedPayload) {
        this.clearRenderScope();

        const renderScope = new MarkdownRenderChild(this.embed);
        payload.ctx.addChild(renderScope);
        this.renderScope = renderScope;
        return renderScope;
    }

    private clearRenderScope() {
        this.renderScope?.unload();
        this.renderScope = null;
    }
}
