import { Prec } from '@codemirror/state';
import {
    Decoration,
    type DecorationSet,
    EditorView,
    MatchDecorator,
    type ViewUpdate,
    ViewPlugin,
    WidgetType,
} from '@codemirror/view';
import {
    Component,
    MarkdownRenderChild,
    TFile,
    editorInfoField,
    editorLivePreviewField,
    setIcon,
} from 'obsidian';
import type MandalaGrid from 'src/main';
import { isSafeExternalUrl } from 'src/view/helpers/link-utils';
import { renderMarkdownContent } from 'src/view/actions/markdown-preview/helpers/render-markdown-content';
import { resolveMandalaSourceEmbedMatch } from 'src/obsidian/editor-extensions/mandala-source-embed/helpers/resolve-mandala-source-embed-match';
import {
    buildMandalaEmbedModelCacheKey,
    getMandalaEmbedOrientation,
    resolveMandalaEmbedTarget,
    resolveMandalaEmbedModel,
    type ResolvedMandalaEmbedModel,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/resolve-mandala-embed-model';
import { logger } from 'src/helpers/logger';

const EMBED_REGEXP = /!\[\[[^\]\n]+?\]\]/gmu;

const formatUnknownError = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

type LoadResolvedModel = () => Promise<ResolvedMandalaEmbedModel | null>;

const componentByDom = new WeakMap<HTMLElement, Component>();

class MandalaSourceEmbedWidget extends WidgetType {
    constructor(
        private readonly plugin: MandalaGrid,
        private readonly sourceFile: TFile,
        private readonly linktext: string,
        private readonly original: string,
        private readonly from: number,
        private readonly to: number,
        private readonly loadResolvedModel: LoadResolvedModel,
    ) {
        super();
    }

    eq(other: WidgetType) {
        return (
            other instanceof MandalaSourceEmbedWidget &&
            other.sourceFile.path === this.sourceFile.path &&
            other.linktext === this.linktext &&
            other.original === this.original
        );
    }

    get estimatedHeight() {
        return 420;
    }

    toDOM(view: EditorView): HTMLElement {
        const root = document.createElement('div');
        root.className = 'internal-embed mandala-source-embed-widget';
        root.setAttribute('data-mandala-managed', 'true');

        const component = new Component();
        let destroyed = false;
        component.register(() => {
            destroyed = true;
            componentByDom.delete(root);
        });
        component.load();
        componentByDom.set(root, component);

        component.registerDomEvent(root, 'mousedown', (event) => {
            const target = event.target;
            if (
                target instanceof Element &&
                target.closest('a,button,input,textarea,select,label')
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            const editAnchor =
                this.to - this.from > 1 ? Math.min(this.from + 1, this.to - 1) : this.from;
            view.dispatch({
                selection: { anchor: editAnchor },
                scrollIntoView: true,
            });
            view.focus();
        });

        this.renderFallback(root);
        void this.renderManaged(root, component, () => destroyed);

        return root;
    }

    destroy(dom: HTMLElement): void {
        const component = componentByDom.get(dom);
        component?.unload();
    }

    ignoreEvent(): boolean {
        return true;
    }

    private async renderManaged(
        root: HTMLElement,
        component: Component,
        isDestroyed: () => boolean,
    ) {
        try {
            const resolved = await this.loadResolvedModel();
            if (!resolved || isDestroyed() || !root.isConnected) return;

            const host = document.createElement('div');
            host.className = 'mandala-embed-host';
            root.classList.add('mandala-embed-3x3');

            const header = document.createElement('div');
            header.className = 'mandala-embed-host-header';
            host.appendChild(header);

            const titleEl = document.createElement('h1');
            titleEl.className = 'mandala-embed-header-title';
            titleEl.setText(
                resolved.target.centerHeading ?? resolved.target.file.basename,
            );
            header.appendChild(titleEl);

            const linkBtn = document.createElement('button');
            linkBtn.className = 'mandala-embed-header-link';
            linkBtn.type = 'button';
            linkBtn.setAttribute('aria-label', 'Open embed target in note');
            header.appendChild(linkBtn);

            const linkIcon = document.createElement('span');
            linkIcon.className = 'mandala-embed-header-link-icon';
            setIcon(linkIcon, 'maximize-2');
            linkBtn.appendChild(linkIcon);

            const body = document.createElement('div');
            body.className = 'mandala-embed-host-body';
            host.appendChild(body);

            const gridEl = document.createElement('div');
            gridEl.className = 'mandala-embed-3x3-grid';
            body.appendChild(gridEl);

            for (const row of resolved.model.rows) {
                for (const cell of row) {
                    if (isDestroyed() || !root.isConnected) return;

                    const cellEl = document.createElement('div');
                    cellEl.className = 'mandala-embed-3x3-cell';
                    cellEl.dataset.mandalaSection = cell.section;
                    if (cell.section === resolved.model.rows[1]?.[1]?.section) {
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
                        component.addChild(renderChild);
                        await renderMarkdownContent({
                            app: this.plugin.app,
                            content: cell.markdown,
                            element: markdownEl,
                            sourcePath: resolved.target.file.path,
                            component: renderChild,
                            applyFormatText: true,
                        });
                    }

                    gridEl.appendChild(cellEl);
                }
            }

            component.registerDomEvent(linkBtn, 'click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                void this.plugin.app.workspace.openLinkText(
                    this.linktext,
                    this.sourceFile.path,
                    false,
                );
            });

            component.registerDomEvent(body, 'click', (event) => {
                const target = event.target;
                if (!(target instanceof Element)) return;

                const anchor = target.closest('a');
                if (!(anchor instanceof HTMLAnchorElement)) return;

                if (anchor.classList.contains('internal-link')) {
                    const link =
                        anchor.getAttribute('data-href') ??
                        anchor.getAttribute('href');
                    if (!link) return;

                    event.preventDefault();
                    event.stopPropagation();
                    void this.plugin.app.workspace.openLinkText(
                        link,
                        resolved.target.file.path,
                        false,
                    );
                    return;
                }

                if (!anchor.classList.contains('external-link')) return;
                const href = anchor.getAttribute('href') ?? '';
                if (!isSafeExternalUrl(href)) return;

                event.preventDefault();
                event.stopPropagation();
                window.open(href, '_blank', 'noopener,noreferrer');
            });

            root.replaceChildren(host);
        } catch (error: unknown) {
            logger.error('[mandala-source-embed]', {
                phase: 'widget-render-failed',
                linktext: this.linktext,
                sourcePath: this.sourceFile.path,
                error: formatUnknownError(error),
            });
            if (!isDestroyed() && root.isConnected) {
                this.renderFallback(root);
            }
        }
    }

    private renderFallback(root: HTMLElement) {
        const code = document.createElement('code');
        code.className = 'mandala-source-embed-widget__fallback';
        code.textContent = this.original;
        root.replaceChildren(code);
    }
}

export const createMandalaSourceEmbedExtension = (plugin: MandalaGrid) => {
    const modelCache = new Map<string, Promise<ResolvedMandalaEmbedModel | null>>();

    const getResolvedModel = (
        sourceFile: TFile,
        linktext: string,
    ): Promise<ResolvedMandalaEmbedModel | null> => {
        const orientation = getMandalaEmbedOrientation(plugin);
        const parsedReference = { linktext };
        const target = resolveMandalaEmbedTarget(
            plugin,
            sourceFile,
            parsedReference,
        );
        const cacheKey = target
            ? buildMandalaEmbedModelCacheKey(target, orientation)
            : `${sourceFile.path}::${orientation}::${linktext}`;
        const cached = modelCache.get(cacheKey);
        if (cached) return cached;

        const loading = resolveMandalaEmbedModel(
            plugin,
            sourceFile,
            parsedReference,
            orientation,
        ).catch(() => null);
        modelCache.set(cacheKey, loading);
        return loading;
    };

    const decorator = new MatchDecorator({
        regexp: EMBED_REGEXP,
        decorate: (add, from, to, match, view) => {
            const isLivePreview =
                view.state.field(editorLivePreviewField, false) === true;
            if (!isLivePreview) return;

            const fileInfo = view.state.field(editorInfoField, false);
            const sourceFile = fileInfo?.file;
            if (!(sourceFile instanceof TFile) || sourceFile.extension !== 'md') {
                return;
            }

            const line = view.state.doc.lineAt(from);
            const resolved = resolveMandalaSourceEmbedMatch({
                matchText: match[0] ?? '',
                from,
                to,
                textBeforeMatch: view.state.doc.sliceString(line.from, from),
                textAfterMatch: view.state.doc.sliceString(to, line.to),
                selectionRanges: view.state.selection.ranges.map((range) => ({
                    from: range.from,
                    to: range.to,
                })),
            });
            if (!resolved) return;

            add(
                from,
                to,
                Decoration.replace({
                    widget: new MandalaSourceEmbedWidget(
                        plugin,
                        sourceFile,
                        resolved.parsedReference.linktext,
                        resolved.reference.original,
                        from,
                        to,
                        () =>
                            getResolvedModel(
                                sourceFile,
                                resolved.parsedReference.linktext,
                            ),
                    ),
                }),
            );
        },
    });

    return Prec.highest(
        ViewPlugin.fromClass(
            class {
                decorations: DecorationSet;

                constructor(view: EditorView) {
                    this.decorations = this.createDecorations(view);
                }

                update(update: ViewUpdate) {
                    const livePreviewEnabled =
                        update.view.state.field(editorLivePreviewField, false) ===
                        true;
                    if (!livePreviewEnabled) {
                        this.decorations = Decoration.none;
                        return;
                    }

                    if (update.selectionSet) {
                        this.decorations = this.createDecorations(update.view);
                        return;
                    }

                    if (update.docChanged || update.viewportChanged) {
                        this.decorations = decorator.updateDeco(
                            update as never,
                            this.decorations,
                        );
                    }
                }

                private createDecorations(view: EditorView) {
                    const livePreviewEnabled =
                        view.state.field(editorLivePreviewField, false) === true;
                    if (!livePreviewEnabled) return Decoration.none;
                    return decorator.createDeco(view);
                }
            },
            {
                decorations: (value) => value.decorations,
            },
        ),
    );
};
