import {
    Prec,
    RangeSetBuilder,
    StateField,
    type EditorState,
} from '@codemirror/state';
import {
    Decoration,
    type DecorationSet,
    EditorView,
    WidgetType,
} from '@codemirror/view';
import {
    Component,
    TFile,
    editorInfoField,
    editorLivePreviewField,
} from 'obsidian';
import type MandalaGrid from 'src/main';
import {
    doesSelectionTouchMandalaSourceEmbedLine,
    resolveMandalaSourceEmbedMatch,
    type ResolvedMandalaSourceEmbedMatch,
} from 'src/obsidian/editor-extensions/mandala-source-embed/helpers/resolve-mandala-source-embed-match';
import { logger } from 'src/helpers/logger';
import {
    buildMandalaEmbedModelCacheKey,
    buildMandalaEmbedRenderKey,
    getMandalaEmbedOrientation,
    resolveMandalaEmbedModel,
    resolveMandalaEmbedTarget,
    type ResolvedMandalaEmbedModel,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/resolve-mandala-embed-model';
import {
    attachMandalaEmbedResponsiveSizing,
    buildMandalaEmbedGrid,
    createMandalaEmbedHostLayout,
    getMandalaEmbedTitle,
    primeMandalaEmbedResponsiveSizing,
    renderMandalaEmbedHeader,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/render-mandala-embed-dom';
import { isSafeExternalUrl } from 'src/view/helpers/link-utils';

const EMBED_REGEXP = /!\[\[[^\]\n]+?\]\]/gmu;

const formatUnknownError = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

type LoadResolvedModel = () => Promise<ResolvedMandalaEmbedModel | null>;

type SelectionRangeLike = {
    from: number;
    to: number;
};

type MandalaSourceEmbedCandidate = {
    from: number;
    to: number;
    reference: ResolvedMandalaSourceEmbedMatch['reference'];
    parsedReference: ResolvedMandalaSourceEmbedMatch['parsedReference'];
};

type MandalaSourceEmbedFieldValue = {
    sourceFile: TFile | null;
    livePreview: boolean;
    candidates: MandalaSourceEmbedCandidate[];
    decorations: DecorationSet;
};

const componentByDom = new WeakMap<HTMLElement, Component>();

const getMandalaSourceEmbedEditAnchor = (from: number, to: number) =>
    to - from > 1 ? Math.min(from + 1, to - 1) : from;

class MandalaSourceEmbedWidget extends WidgetType {
    constructor(
        private readonly plugin: MandalaGrid,
        private readonly sourceFile: TFile,
        private readonly linktext: string,
        private readonly original: string,
        private readonly renderKey: string,
        private readonly from: number,
        private readonly to: number,
        private readonly loadResolvedModel: LoadResolvedModel,
    ) {
        super();
    }

    eq(other: WidgetType) {
        return (
            other instanceof MandalaSourceEmbedWidget &&
            other.renderKey === this.renderKey &&
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
        root.className = 'mandala-source-embed-widget';

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

            const editAnchor = getMandalaSourceEmbedEditAnchor(
                this.from,
                this.to,
            );

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
        componentByDom.get(dom)?.unload();
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

            const { host, header, body } = createMandalaEmbedHostLayout();
            root.classList.add('mandala-embed-3x3');

            renderMandalaEmbedHeader({
                headerEl: header,
                title: getMandalaEmbedTitle(resolved.target),
                attachOpenTargetClick: (button, listener) =>
                    component.registerDomEvent(button, 'click', listener),
                onOpenTarget: (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void this.plugin.app.workspace.openLinkText(
                        this.linktext,
                        this.sourceFile.path,
                        false,
                    );
                },
            });

            const gridEl = await buildMandalaEmbedGrid({
                plugin: this.plugin,
                model: resolved.model,
                sourcePath: resolved.target.file.path,
                registerMarkdownChild: (child) => component.addChild(child),
                isCanceled: () => isDestroyed() || !root.isConnected,
            });
            if (!gridEl) return;

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

            body.appendChild(gridEl);
            root.replaceChildren(host);
            primeMandalaEmbedResponsiveSizing({
                rootEl: root,
                bodyEl: body,
                gridEl,
            });
            const detachResponsiveSizing = attachMandalaEmbedResponsiveSizing({
                rootEl: root,
                bodyEl: body,
                gridEl,
            });
            component.register(() => detachResponsiveSizing());
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

const resolveSourceFile = (state: EditorState) => {
    const fileInfo = state.field(editorInfoField, false);
    const sourceFile = fileInfo?.file;

    return sourceFile instanceof TFile && sourceFile.extension === 'md'
        ? sourceFile
        : null;
};

const getSelectionRanges = (state: EditorState): SelectionRangeLike[] =>
    state.selection.ranges.map((range) => ({
        from: range.from,
        to: range.to,
    }));

const collectCandidates = (
    state: EditorState,
    livePreview: boolean,
    sourceFile: TFile | null,
) => {
    if (!livePreview || !sourceFile) return [];

    const docText = state.doc.toString();
    const candidates: MandalaSourceEmbedCandidate[] = [];
    const regexp = new RegExp(EMBED_REGEXP);
    let match: RegExpExecArray | null = null;

    while ((match = regexp.exec(docText)) !== null) {
        const from = match.index;
        const to = from + (match[0]?.length ?? 0);
        const line = state.doc.lineAt(from);
        const resolved = resolveMandalaSourceEmbedMatch({
            matchText: match[0] ?? '',
            from,
            to,
            textBeforeMatch: state.doc.sliceString(line.from, from),
            textAfterMatch: state.doc.sliceString(to, line.to),
            selectionRanges: [],
        });
        if (!resolved) continue;

        candidates.push({
            from,
            to,
            reference: resolved.reference,
            parsedReference: resolved.parsedReference,
        });
    }

    return candidates;
};

const buildDecorations = (
    plugin: MandalaGrid,
    state: EditorState,
    sourceFile: TFile | null,
    candidates: MandalaSourceEmbedCandidate[],
    selectionRanges: SelectionRangeLike[],
) => {
    if (!sourceFile || candidates.length === 0) return Decoration.none;

    const modelCache = new Map<string, Promise<ResolvedMandalaEmbedModel | null>>();
    const orientation = getMandalaEmbedOrientation(plugin);
    const refreshEpoch = plugin.getMandalaEmbedRefreshEpoch();
    const builder = new RangeSetBuilder<Decoration>();

    const getResolvedModel = (
        nextSourceFile: TFile,
        linktext: string,
    ): Promise<ResolvedMandalaEmbedModel | null> => {
        const parsedReference = { linktext };
        const target = resolveMandalaEmbedTarget(
            plugin,
            nextSourceFile,
            parsedReference,
        );
        const cacheKey = target
            ? buildMandalaEmbedModelCacheKey(target, orientation)
            : `${nextSourceFile.path}::${orientation}::${linktext}`;
        const cached = modelCache.get(cacheKey);
        if (cached) return cached;

        const loading = resolveMandalaEmbedModel(
            plugin,
            nextSourceFile,
            parsedReference,
            orientation,
        ).catch(() => null);
        modelCache.set(cacheKey, loading);
        return loading;
    };

    for (const candidate of candidates) {
        const line = state.doc.lineAt(candidate.from);
        if (
            doesSelectionTouchMandalaSourceEmbedLine(
                selectionRanges,
                line.from,
                line.to,
            )
        ) {
            continue;
        }

        builder.add(
            candidate.from,
            candidate.to,
            Decoration.replace({
                block: true,
                widget: new MandalaSourceEmbedWidget(
                    plugin,
                    sourceFile,
                    candidate.parsedReference.linktext,
                    candidate.reference.original,
                    (() => {
                        const target = resolveMandalaEmbedTarget(
                            plugin,
                            sourceFile,
                            candidate.parsedReference,
                        );

                        return target
                            ? buildMandalaEmbedRenderKey(
                                  target,
                                  orientation,
                                  refreshEpoch,
                              )
                            : `${sourceFile.path}::${orientation}::${candidate.parsedReference.linktext}::${candidate.reference.original}::${String(refreshEpoch)}`;
                    })(),
                    candidate.from,
                    candidate.to,
                    () =>
                        getResolvedModel(
                            sourceFile,
                            candidate.parsedReference.linktext,
                        ),
                ),
            }),
        );
    }

    return builder.finish();
};

export const createMandalaSourceEmbedExtension = (plugin: MandalaGrid) => {
    const field = StateField.define<MandalaSourceEmbedFieldValue>({
        create(state) {
            const livePreview =
                state.field(editorLivePreviewField, false) === true;
            const sourceFile = resolveSourceFile(state);
            const candidates = collectCandidates(state, livePreview, sourceFile);
            const decorations = buildDecorations(
                plugin,
                state,
                sourceFile,
                candidates,
                getSelectionRanges(state),
            );

            return {
                sourceFile,
                livePreview,
                candidates,
                decorations,
            };
        },
        update(value, transaction) {
            const nextLivePreview =
                transaction.state.field(editorLivePreviewField, false) === true;
            const nextSourceFile = resolveSourceFile(transaction.state);
            const sourceChanged =
                value.sourceFile?.path !== nextSourceFile?.path;
            const livePreviewChanged = value.livePreview !== nextLivePreview;
            const shouldRecollect =
                transaction.docChanged || sourceChanged || livePreviewChanged;
            const nextCandidates = shouldRecollect
                ? collectCandidates(
                      transaction.state,
                      nextLivePreview,
                      nextSourceFile,
                  )
                : value.candidates;
            const shouldRebuildDecorations =
                shouldRecollect || transaction.selection;

            if (!shouldRebuildDecorations) {
                return {
                    sourceFile: nextSourceFile,
                    livePreview: nextLivePreview,
                    candidates: nextCandidates,
                    decorations: value.decorations,
                };
            }

            return {
                sourceFile: nextSourceFile,
                livePreview: nextLivePreview,
                candidates: nextCandidates,
                decorations: buildDecorations(
                    plugin,
                    transaction.state,
                    nextSourceFile,
                    nextCandidates,
                    getSelectionRanges(transaction.state),
                ),
            };
        },
        provide(field) {
            return EditorView.decorations.from(
                field,
                (value) => value.decorations,
            );
        },
    });

    return Prec.highest(field);
};
