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
import { logger } from 'src/shared/helpers/logger';
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
import {
    registerLivePreviewMandalaWidget,
    unregisterLivePreviewMandalaWidget,
    type LivePreviewMandalaWidgetController,
} from 'src/obsidian/editor-extensions/mandala-source-embed/helpers/live-preview-mandala-widget-registry';
import { isSafeExternalUrl } from 'src/view/helpers/link-utils';

const EMBED_REGEXP = /!\[\[[^\]\n]+?\]\]/gmu;
const DEFAULT_ESTIMATED_HEIGHT = 420;

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

const estimatedHeightBySourcePath = new Map<string, number>();

const getMandalaSourceEmbedEditAnchor = (from: number, to: number) =>
    to - from > 1 ? Math.min(from + 1, to - 1) : from;

const getEstimatedHeightForSourceFile = (sourceFile: TFile) =>
    estimatedHeightBySourcePath.get(sourceFile.path) ?? DEFAULT_ESTIMATED_HEIGHT;

const rememberEstimatedHeightForSourceFile = (
    sourceFile: TFile,
    height: number,
) => {
    if (height <= 0) return;
    estimatedHeightBySourcePath.set(sourceFile.path, height);
};

export class MandalaSourceEmbedWidget
    extends WidgetType
    implements LivePreviewMandalaWidgetController
{
    private component: Component | null = null;
    private renderScope: Component | null = null;
    private root: HTMLElement | null = null;
    private destroyed = false;
    private resolvedTargetPath: string | null = null;
    private lastRenderedModelKey: string | null = null;
    private refreshInFlightGeneration = 0;
    private currentEstimatedHeight: number;

    constructor(
        private readonly plugin: MandalaGrid,
        private readonly sourceFile: TFile,
        private readonly linktext: string,
        private readonly original: string,
        private readonly widgetKey: string,
        private readonly from: number,
        private readonly to: number,
        private readonly loadResolvedModel: LoadResolvedModel,
    ) {
        super();
        this.currentEstimatedHeight = getEstimatedHeightForSourceFile(
            this.sourceFile,
        );
    }

    eq(other: WidgetType) {
        return (
            other instanceof MandalaSourceEmbedWidget &&
            other.widgetKey === this.widgetKey &&
            other.sourceFile.path === this.sourceFile.path &&
            other.linktext === this.linktext &&
            other.original === this.original
        );
    }

    get estimatedHeight() {
        return this.currentEstimatedHeight;
    }

    toDOM(view: EditorView): HTMLElement {
        const root = document.createElement('div');
        root.className = 'mandala-source-embed-widget';
        this.root = root;
        this.destroyed = false;

        const component = new Component();
        this.component = component;
        component.register(() => {
            this.destroyed = true;
            this.renderScope = null;
            this.root = null;
            this.component = null;
            this.unregisterResolvedTarget();
        });
        component.load();

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
        window.requestAnimationFrame(() => {
            void this.refreshManaged();
        });

        return root;
    }

    destroy(dom: HTMLElement): void {
        if (this.root !== dom) {
            this.root = dom;
        }
        this.destroyed = true;
        this.unregisterResolvedTarget();
        this.component?.unload();
        this.component = null;
        this.renderScope = null;
        this.root = null;
    }

    ignoreEvent(): boolean {
        return true;
    }

    isConnected() {
        return !this.destroyed && this.root?.isConnected === true;
    }

    async refreshManaged() {
        const root = this.root;
        const component = this.component;
        if (!root || !component || this.destroyed || !root.isConnected) return;

        const generation = ++this.refreshInFlightGeneration;
        const previousHeight = Math.round(root.getBoundingClientRect().height);
        if (previousHeight > 0) {
            root.style.minHeight = `${String(previousHeight)}px`;
        }

        try {
            const resolved = await this.loadResolvedModel();
            if (!this.canApplyRefresh(generation, root)) return;

            if (!resolved) {
                this.applyFallback(root);
                return;
            }

            const orientation = getMandalaEmbedOrientation(this.plugin);
            const nextRenderKey = buildMandalaEmbedRenderKey(
                resolved.target,
                orientation,
                this.plugin.getMandalaEmbedRefreshEpoch(),
            );
            if (
                this.lastRenderedModelKey === nextRenderKey &&
                this.resolvedTargetPath === resolved.target.file.path &&
                root.querySelector('.mandala-embed-host')
            ) {
                registerLivePreviewMandalaWidget(
                    this,
                    resolved.target.file.path,
                );
                this.releaseRootMinHeight(root);
                return;
            }

            const nextRenderScope = component.addChild(new Component());

            const { host, header, body } = createMandalaEmbedHostLayout();

            renderMandalaEmbedHeader({
                headerEl: header,
                title: getMandalaEmbedTitle(resolved.target),
                attachOpenTargetClick: (button, listener) =>
                    nextRenderScope.registerDomEvent(button, 'click', listener),
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
                registerMarkdownChild: (child) => nextRenderScope.addChild(child),
                isCanceled: () => !this.canApplyRefresh(generation, root),
            });
            if (!gridEl || !this.canApplyRefresh(generation, root)) {
                component.removeChild(nextRenderScope);
                return;
            }

            nextRenderScope.registerDomEvent(body, 'click', (event) => {
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
            root.classList.add('mandala-embed-3x3');
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
            nextRenderScope.register(() => detachResponsiveSizing());
            this.replaceRenderScope(nextRenderScope);
            this.lastRenderedModelKey = nextRenderKey;
            this.updateResolvedTarget(resolved.target.file.path);
            this.rememberCurrentEstimatedHeight(root);
            this.releaseRootMinHeight(root);
        } catch (error: unknown) {
            logger.error('[mandala-source-embed]', {
                phase: 'widget-render-failed',
                linktext: this.linktext,
                sourcePath: this.sourceFile.path,
                error: formatUnknownError(error),
            });
            if (this.canApplyRefresh(generation, root)) {
                this.applyFallback(root);
            }
        }
    }

    private renderFallback(root: HTMLElement) {
        const code = document.createElement('code');
        code.className = 'mandala-source-embed-widget__fallback';
        code.textContent = this.original;
        root.replaceChildren(code);
    }

    private canApplyRefresh(generation: number, root: HTMLElement) {
        return (
            !this.destroyed &&
            this.root === root &&
            root.isConnected &&
            generation === this.refreshInFlightGeneration
        );
    }

    private replaceRenderScope(nextRenderScope: Component) {
        const previousRenderScope = this.renderScope;
        this.renderScope = nextRenderScope;
        if (!previousRenderScope || !this.component) return;

        this.component.removeChild(previousRenderScope);
    }

    private updateResolvedTarget(targetPath: string) {
        this.resolvedTargetPath = targetPath;
        registerLivePreviewMandalaWidget(this, targetPath);
    }

    private unregisterResolvedTarget() {
        if (!this.resolvedTargetPath) return;

        unregisterLivePreviewMandalaWidget(this);
        this.resolvedTargetPath = null;
    }

    private applyFallback(root: HTMLElement) {
        this.lastRenderedModelKey = null;
        this.unregisterResolvedTarget();
        if (this.renderScope && this.component) {
            this.component.removeChild(this.renderScope);
        }
        this.renderScope = null;
        root.classList.remove('mandala-embed-3x3');
        this.renderFallback(root);
        this.releaseRootMinHeight(root);
    }

    private rememberCurrentEstimatedHeight(root: HTMLElement) {
        const height = Math.round(root.getBoundingClientRect().height);
        if (height <= 0) return;

        this.currentEstimatedHeight = height;
        rememberEstimatedHeightForSourceFile(this.sourceFile, height);
    }

    private releaseRootMinHeight(root: HTMLElement) {
        window.requestAnimationFrame(() => {
            if (!this.canApplyRefresh(this.refreshInFlightGeneration, root)) {
                return;
            }

            root.style.removeProperty('min-height');
            this.rememberCurrentEstimatedHeight(root);
        });
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
