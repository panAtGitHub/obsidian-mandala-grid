import {
    BlockSubpathResult,
    HeadingSubpathResult,
    debounce,
    IconName,
    Notice,
    Scope,
    TextFileView,
    WorkspaceLeaf,
    resolveSubpath,
    stripHeading,
} from 'obsidian';

import Component from './components/container/main.svelte';
import MandalaGrid from '../main';
import { documentReducer } from 'src/stores/document/document-reducer';
import { Unsubscriber } from 'svelte/store';
import { OnError, Store } from 'src/lib/store/store';
import { defaultDocumentState } from 'src/stores/document/default-document-state';
import {
    DocumentState,
    MandalaGridDocument,
} from 'src/stores/document/document-state-type';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { ViewState } from 'src/stores/view/view-state-type';
import { ViewStoreAction } from 'src/stores/view/view-store-actions';
import { defaultViewState } from 'src/stores/view/default-view-state';
import { viewReducer } from 'src/stores/view/view-reducer';
import { viewSubscriptions } from 'src/stores/view/subscriptions/view-subscriptions';
import { onPluginError } from 'src/lib/store/on-plugin-error';
import { InlineEditor } from 'src/obsidian/helpers/inline-editor/inline-editor';
import { id } from 'src/helpers/id';
import invariant from 'tiny-invariant';
import { customIcons } from 'src/helpers/load-custom-icons';

import { setViewType } from 'src/stores/settings/actions/set-view-type';
import { stringifyDocument } from 'src/view/helpers/stringify-document';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';
import { DocumentSearch } from 'src/stores/view/subscriptions/effects/document-search/document-search';
import { AlignBranch } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';
import { lang } from 'src/lang/lang';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';
import { loadFullDocument } from 'src/stores/view/subscriptions/actions/document/load-full-document';
import { refreshActiveViewOfDocument } from 'src/stores/plugin/actions/refresh-active-view-of-document';
import { parseHtmlCommentMarker } from 'src/lib/data-conversion/helpers/html-comment-marker/parse-html-comment-marker';
import { selectCard } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/helpers/select-card';
import {
    MandalaProfileActivation,
    resolveMandalaProfileActivation,
} from 'src/lib/mandala/mandala-profile';
import { logger } from 'src/helpers/logger';
import { findNodeColumn } from 'src/lib/tree-utils/find/find-node-column';
import { prepareSaveSections, serializeSections } from 'src/mandala-v2';
import { applySectionPatch } from 'src/view/helpers/mandala/apply-section-patch';

export const MANDALA_VIEW_TYPE = 'mandala-grid';

export type DocumentStore = Store<DocumentState, DocumentStoreAction>;
export type ViewStore = Store<ViewState, ViewStoreAction, MandalaGridDocument>;
export type SaveDocumentMode = 'content-only' | 'structural';
export type SaveDocumentOptions = {
    mode?: SaveDocumentMode;
    changedSections?: string[];
};

export class MandalaView extends TextFileView {
    component: Component;
    documentStore: DocumentStore;
    viewStore: ViewStore;
    container: HTMLElement | null;
    inlineEditor: InlineEditor;
    documentSearch: DocumentSearch;
    alignBranch: AlignBranch;
    id: string;
    zoomFactor: number;
    mandalaMode: '3x3' | '9x9' = '3x3';
    mandalaActiveCell9x9: { row: number; col: number } | null = null;
    dayPlanHotCores: Set<string> = new Set();
    private pendingEphemeralState: unknown = null;
    private hasPendingExplicitJump = false;
    private focusMandalaSectionRequestId = 0;
    private focusMandalaSectionTimer: number | null = null;
    private firstRenderProbeRequestId: number | null = null;
    private readonly onDestroyCallbacks: Set<Unsubscriber> = new Set();
    private activeFilePath: null | string;
    private lastLoadedBody = '';
    private lastLoadedFrontmatter = '';
    private cachedActivation:
        | { frontmatter: string; activation: MandalaProfileActivation }
        | null = null;
    private lastActivationNotice: string | null = null;
    private lastSaveBlockedNoticeKey: string | null = null;
    private readonly mandalaUiStateByPath = new Map<
        string,
        {
            subgridTheme: string;
            activeCell9x9: { row: number; col: number } | null;
        }
    >();
    constructor(
        leaf: WorkspaceLeaf,
        public plugin: MandalaGrid,
    ) {
        super(leaf);
        this.scope = new Scope(this.app.scope);
        this.documentStore = new Store(
            defaultDocumentState(),
            documentReducer,
            this.onViewStoreError as OnError<DocumentStoreAction>,
        );
        this.viewStore = new Store<ViewState, ViewStoreAction, MandalaGridDocument>(
            defaultViewState(),
            viewReducer,
            this.onViewStoreError as OnError<ViewStoreAction>,
            this.documentStore.getValue().document,
        );

        this.id = id.view();
        this.documentSearch = new DocumentSearch(this);
        this.alignBranch = new AlignBranch(this);
    }

    get isActive() {
        return (
            this === this.plugin.app.workspace.getActiveViewOfType(MandalaView)
        );
    }

    get isViewOfFile() {
        const path = this.file?.path;
        return path
            ? this.id === this.plugin.store.getValue().documents[path]?.viewId
            : false;
    }

    getViewData(): string {
        return this.data;
    }

    setViewData(data: string): void {
        if (!this.activeFilePath && this.file) {
            this.activeFilePath = this.file?.path;
            void this.loadInitialData();
        } else {
            this.data = data;
            if (!this.isViewOfFile || !this.file) return;

            const nextPath = this.file.path;
                const switchedFile = this.activeFilePath !== nextPath;
                if (switchedFile) {
                    if (this.activeFilePath) {
                        void this.persistMandalaUiState(this.activeFilePath);
                    }
                    this.activeFilePath = nextPath;
                    this.lastLoadedBody = '';
                    this.lastLoadedFrontmatter = '';
                this.cachedActivation = null;
                this.lastActivationNotice = null;
                this.loadDocumentToStore();
                return;
            }

            this.debouncedLoadDocumentToStore();
        }
    }

    async onUnloadFile() {
        this.cancelFocusMandalaSection();
        this.cancelFirstRenderProbe();
        if (this.component) {
            this.component.$destroy();
        }
        if (this.file?.path) {
            await this.persistMandalaUiState(this.file.path);
        }
        this.activeFilePath = null;
        this.lastLoadedBody = '';
        this.lastLoadedFrontmatter = '';
        this.cachedActivation = null;
        this.lastActivationNotice = null;
        this.contentEl.empty();
        this.documentStore = new Store(
            defaultDocumentState(),
            documentReducer,
            this.onViewStoreError as OnError<DocumentStoreAction>,
        );
        if (this.inlineEditor) await this.inlineEditor.unloadFile();
        for (const s of this.onDestroyCallbacks) {
            s();
        }
        refreshActiveViewOfDocument(this);
    }

    clear(): void {
        this.data = '';
    }

    getViewType() {
        return MANDALA_VIEW_TYPE;
    }

    getIcon(): IconName {
        return customIcons.mandalaGrid.name;
    }

    getDisplayText() {
        return this.file ? this.file.basename : '';
    }

    async onOpen() {
        await super.onOpen();
    }

    async onClose() {
        await this.onUnloadFile();
    }

    setEphemeralState(state: unknown) {
        super.setEphemeralState(state);
        if (!state) return;
        if (this.isExplicitJumpState(state)) {
            this.hasPendingExplicitJump = true;
            this.cancelFocusMandalaSection();
        }
        const documentLoaded =
            this.documentStore.getValue().document.columns.length > 0;
        if (!documentLoaded) {
            this.pendingEphemeralState = state;
            return;
        }
        if (typeof (state as { subpath?: string }).subpath === 'string') {
            void this.handleSubpathJump((state as { subpath: string }).subpath)
                .finally(() => {
                    this.hasPendingExplicitJump = false;
                });
        } else if (typeof (state as { line?: number }).line === 'number') {
            void this.handleLineJump((state as { line: number }).line).finally(
                () => {
                    this.hasPendingExplicitJump = false;
                },
            );
        }
    }

    onViewStoreError: OnError<DocumentStoreAction | ViewStoreAction> = (
        error,
        location,
        action,
    ) => {
        if (action && action.type === 'document/file/load-from-disk') {
            if (this.file) {
                this.plugin.store.dispatch({
                    type: 'plugin/documents/unregister-document-store',
                    payload: { path: this.file.path },
                });
                setViewType(this.plugin, this.file.path, 'markdown');
                toggleObsidianViewType(
                    this.plugin,
                    this.plugin.app.workspace.getLeaf(),
                    'markdown',
                );
            }
        }
        onPluginError(error, location, action);
    };

    saveDocument = (options: SaveDocumentOptions = {}) => {
        invariant(this.file);
        const state = this.documentStore.getValue();
        const saveStartedMs = performance.now();
        const mode = options.mode ?? 'structural';
        const changedSections = Array.from(
            new Set(
                (options.changedSections ?? []).filter(
                    (section): section is string => typeof section === 'string',
                ),
            ),
        );
        let body = '';
        if (state.meta.mandalaV2.enabled) {
            let usedFastPath = false;
            let prepareMs = 0;
            let patchMs = 0;
            let serializeMs = 0;
            let droppedSectionCount = 0;
            let prunedParentCount = 0;
            let blockedParentCount = 0;

            const canTryEarlyPatch =
                mode === 'content-only' &&
                changedSections.length > 0 &&
                changedSections.every((sectionId) => {
                    const nodeId = state.sections.section_id[sectionId];
                    if (!nodeId) return false;
                    const replacement = state.document.content[nodeId]?.content ?? '';
                    return replacement.length > 0;
                });

            if (canTryEarlyPatch) {
                const patchStartedMs = performance.now();
                const currentBody = extractFrontmatter(this.data).body;
                let patchedBody = currentBody;
                usedFastPath = true;
                for (const sectionId of changedSections) {
                    const nodeId = state.sections.section_id[sectionId];
                    if (!nodeId) {
                        usedFastPath = false;
                        break;
                    }
                    const replacement = state.document.content[nodeId]?.content ?? '';
                    const patchResult = applySectionPatch(
                        patchedBody,
                        sectionId,
                        replacement,
                    );
                    if (!patchResult) {
                        usedFastPath = false;
                        break;
                    }
                    patchedBody = patchResult.markdown;
                }
                patchMs += Number((performance.now() - patchStartedMs).toFixed(2));
                if (usedFastPath) {
                    body = patchedBody;
                    this.lastSaveBlockedNoticeKey = null;
                }
            }

            if (!usedFastPath) {
                const prepareStartedMs = performance.now();
                const prepared = prepareSaveSections(state.document, state.sections, {
                    parentToChildrenSlots:
                        state.meta.mandalaV2.parentToChildrenSlots,
                    subtreeNonEmptyCountBySection:
                        state.meta.mandalaV2.subtreeNonEmptyCountBySection,
                });
                prepareMs = Number(
                    (performance.now() - prepareStartedMs).toFixed(2),
                );
                droppedSectionCount = prepared.stats.droppedSectionCount;
                prunedParentCount = prepared.stats.prunedParentCount;
                blockedParentCount = prepared.stats.blockedParentCount;

                if (prepared.blockedReasons.length > 0) {
                    const message = prepared.blockedReasons[0];
                    const blockedKey =
                        `${this.file.path}:${state.meta.mandalaV2.revision}:${message}`;
                    if (this.lastSaveBlockedNoticeKey !== blockedKey) {
                        this.lastSaveBlockedNoticeKey = blockedKey;
                        new Notice(message, 3500);
                    }
                    logger.error('[mandala-v2] save blocked', {
                        file: this.file.path,
                        reason: message,
                        blocked_parents: prepared.stats.blockedParentCount,
                    });
                    return;
                }
                this.lastSaveBlockedNoticeKey = null;

                if (
                    mode === 'content-only' &&
                    changedSections.length > 0 &&
                    prepared.stats.droppedSectionCount === 0
                ) {
                    const patchStartedMs = performance.now();
                    const currentBody = extractFrontmatter(this.data).body;
                    let patchedBody = currentBody;
                    usedFastPath = true;
                    for (const sectionId of changedSections) {
                        const nodeId = state.sections.section_id[sectionId];
                        if (!nodeId) {
                            usedFastPath = false;
                            break;
                        }
                        const replacement =
                            state.document.content[nodeId]?.content ?? '';
                        const patchResult = applySectionPatch(
                            patchedBody,
                            sectionId,
                            replacement,
                        );
                        if (!patchResult) {
                            usedFastPath = false;
                            break;
                        }
                        patchedBody = patchResult.markdown;
                    }
                    patchMs += Number(
                        (performance.now() - patchStartedMs).toFixed(2),
                    );
                    if (usedFastPath) {
                        body = patchedBody;
                    }
                }

                if (!usedFastPath) {
                    const serializeStartedMs = performance.now();
                    body = serializeSections(prepared.sections);
                    serializeMs = Number(
                        (performance.now() - serializeStartedMs).toFixed(2),
                    );
                }
            }

            logger.debug('[perf][view] saveDocument', {
                file: this.file.path,
                mode,
                used_fast_path: usedFastPath,
                save_prepare_ms: prepareMs,
                save_patch_ms: patchMs,
                save_serialize_ms: serializeMs,
                save_dropped_sections: droppedSectionCount,
                save_pruned_parents: prunedParentCount,
                save_blocked_count: blockedParentCount,
                save_total_ms: Number((performance.now() - saveStartedMs).toFixed(2)),
            });
        } else {
            body = stringifyDocument(state.document);
        }
        const data: string = state.file.frontmatter + body;
        if (data !== this.data) {
            if (data.trim().length === 0) {
                throw new Error(lang.error_save_empty_data);
            }
            this.data = data;
            const parsed = extractFrontmatter(data);
            this.lastLoadedBody = parsed.body;
            this.lastLoadedFrontmatter = parsed.frontmatter;
            this.requestSave();
        }
    };

    private loadInitialData = async () => {
        invariant(this.file);

        const pluginState = this.plugin.store.getValue();
        const fileHasAStore = pluginState.documents[this.file.path];
        if (fileHasAStore) {
            this.useExistingStore();
        } else {
            this.createStore();
        }
        this.loadDocumentToStore('view-mount');
        if (!this.inlineEditor) {
            this.inlineEditor = new InlineEditor(this);
            await this.inlineEditor.onload();
        }
        await this.inlineEditor.loadFile(this.file);
        this.component = new Component({
            target: this.contentEl,
            props: {
                plugin: this.plugin,
                view: this,
            },
        });

        invariant(this.container);
        this.onDestroyCallbacks.add(viewSubscriptions(this));
        this.consumePendingEphemeralState();
    };

    private createStore = () => {
        invariant(this.file);

        this.plugin.store.dispatch({
            type: 'plugin/documents/register-new-document-store',
            payload: {
                path: this.file.path,
                documentStore: this.documentStore,
                viewId: this.id,
            },
        });
    };

    private useExistingStore = () => {
        if (!this.file) return;
        this.documentStore =
            this.plugin.store.getValue().documents[
                this.file.path
            ].documentStore;
    };

    private loadDocumentToStore = (event?: 'view-mount') => {
        const startMs = performance.now();
        const { body, frontmatter } = extractFrontmatter(this.data);

        const documentState = this.documentStore.getValue();
        const viewState = this.viewStore.getValue();
        const emptyStore = documentState.document.columns.length === 0;
        const bodyHasChanged = body !== this.lastLoadedBody;
        const frontmatterHasChanged = frontmatter !== this.lastLoadedFrontmatter;

        const isEditing = Boolean(viewState.document.editing.activeNodeId);

        const activationStartMs = performance.now();
        const activation = this.getMandalaProfileActivation(frontmatter);
        const activationCostMs = performance.now() - activationStartMs;
        this.dayPlanHotCores = activation.hotCoreSections;
        const settings = this.plugin.settings.getValue();
        const filePath = this.file?.path ?? '';
        const documentPreferences = settings.documents[filePath];
        const persistedMandalaViewState = documentPreferences?.mandalaView;
        const currentGridOrientation = settings.view.mandalaGridOrientation;
        const nextGridOrientation =
            persistedMandalaViewState?.gridOrientation ??
            currentGridOrientation;
        if (nextGridOrientation !== currentGridOrientation) {
            this.plugin.settings.dispatch({
                type: 'settings/view/mandala/set-grid-orientation',
                payload: {
                    orientation: nextGridOrientation,
                },
            });
        }
        const sectionsInBody = this.collectSectionIdsFromBody(body);
        const persistedMandalaLastActiveSection = this.getExistingSectionFromBody(
            sectionsInBody,
            persistedMandalaViewState?.lastActiveSection ?? null,
        );
        const persistedActiveSection = this.getExistingSectionFromBody(
            sectionsInBody,
            documentPreferences?.activeSection ?? null,
        );
        const nextActiveSection =
            activation.targetSection ??
            persistedMandalaLastActiveSection ??
            persistedActiveSection;
        let loadedFromDisk = false;
        if (emptyStore || (bodyHasChanged && !isEditing)) {
            const loadStartMs = performance.now();
            loadFullDocument(
                this,
                body,
                frontmatter,
                nextActiveSection,
            );
            const loadCostMs = performance.now() - loadStartMs;
            const loadMetrics =
                this.documentStore.getValue().meta.mandalaV2.loadMetrics;
            this.lastLoadedBody = body;
            this.lastLoadedFrontmatter = frontmatter;
            if (this.isActive && event !== 'view-mount') {
                new Notice('Document updated externally');
            }
            loadedFromDisk = true;
            this.scheduleFirstRenderProbe(startMs, event);
            logger.debug('[perf][view] loadFullDocument', {
                file: this.file?.path,
                event,
                bytes: loadMetrics?.bytes ?? 0,
                sections_count: loadMetrics?.sectionsCount ?? 0,
                parse_ms: loadMetrics?.parseMs ?? 0,
                build_ms: loadMetrics?.buildMs ?? 0,
                loadCostMs: Number(loadCostMs.toFixed(2)),
                nextActiveSection,
            });
        } else if (frontmatterHasChanged) {
            updateFrontmatter(this, frontmatter);
            this.lastLoadedFrontmatter = frontmatter;
        }

        if (activation.notice) {
            if (this.lastActivationNotice !== activation.notice) {
                new Notice(activation.notice);
                this.lastActivationNotice = activation.notice;
            }
        } else {
            this.lastActivationNotice = null;
        }
        if (activation.targetSection) {
            if (!this.shouldSkipAutoFocusToday()) {
                this.focusMandalaSection(activation.targetSection);
            }
        } else {
            this.restoreMandalaUiState(filePath);
        }
        logger.debug('[perf][view] loadDocumentToStore', {
            file: this.file?.path,
            event,
            bytes: this.documentStore.getValue().meta.mandalaV2.loadMetrics?.bytes ?? 0,
            sections_count:
                this.documentStore.getValue().meta.mandalaV2.loadMetrics
                    ?.sectionsCount ?? 0,
            parse_ms:
                this.documentStore.getValue().meta.mandalaV2.loadMetrics
                    ?.parseMs ?? 0,
            build_ms:
                this.documentStore.getValue().meta.mandalaV2.loadMetrics
                    ?.buildMs ?? 0,
            emptyStore,
            bodyHasChanged,
            frontmatterHasChanged,
            loadedFromDisk,
            kind: activation.kind,
            activationCostMs: Number(activationCostMs.toFixed(2)),
            switch_total_ms: Number((performance.now() - startMs).toFixed(2)),
        });
    };

    private async persistMandalaUiState(path: string) {
        const viewState = this.viewStore.getValue();
        this.mandalaUiStateByPath.set(path, {
            subgridTheme: viewState.ui.mandala.subgridTheme ?? '1',
            activeCell9x9: viewState.ui.mandala.activeCell9x9,
        });

        const documentState = this.documentStore.getValue();
        if (!documentState.meta.isMandala) return;
        const activeNodeId = viewState.document.activeNode;
        const lastActiveSection =
            documentState.sections.id_section[activeNodeId] ?? null;
        const gridOrientation =
            this.plugin.settings.getValue().view.mandalaGridOrientation;
        const currentMandalaViewState =
            this.plugin.settings.getValue().documents[path]?.mandalaView;
        if (
            currentMandalaViewState?.gridOrientation === gridOrientation &&
            (currentMandalaViewState?.lastActiveSection ?? null) ===
                lastActiveSection
        ) {
            return;
        }
        this.plugin.settings.dispatch({
            type: 'settings/documents/persist-mandala-view-state',
            payload: {
                path,
                gridOrientation,
                lastActiveSection,
            },
        });
    }

    private restoreMandalaUiState(path: string) {
        const nextState = this.mandalaUiStateByPath.get(path);
        const subgridTheme = nextState?.subgridTheme ?? '1';
        const activeCell9x9 = nextState?.activeCell9x9 ?? null;

        this.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: subgridTheme },
        });
        this.viewStore.dispatch({
            type: 'view/mandala/active-cell/set',
            payload: { cell: activeCell9x9 },
        });
        this.viewStore.dispatch({
            type: 'view/mandala/swap/cancel',
        });
        this.mandalaActiveCell9x9 = activeCell9x9;
    }

    private collectSectionIdsFromBody(body: string) {
        const sectionIds = new Set<string>();
        for (const line of body.split('\n')) {
            const marker = parseHtmlCommentMarker(line);
            if (!marker) continue;
            sectionIds.add(marker[2]);
        }
        return sectionIds;
    }

    private getExistingSectionFromBody(
        existingSections: Set<string>,
        section: string | null,
    ) {
        if (!section) return null;
        if (existingSections.size === 0) return section;
        return existingSections.has(section) ? section : null;
    }

    private debouncedLoadDocumentToStore = debounce(
        this.loadDocumentToStore,
        250,
    );

    private focusMandalaSection(targetSection: string) {
        this.cancelFocusMandalaSection();
        const currentNodeId = this.viewStore.getValue().document.activeNode;
        const currentSection = this.documentStore.getValue().sections.id_section[
            currentNodeId
        ];
        if (currentSection === targetSection) return;

        const requestId = ++this.focusMandalaSectionRequestId;
        const startMs = performance.now();
        const run = (attempt: number) => {
            if (requestId !== this.focusMandalaSectionRequestId) return;
            const nodeId =
                this.documentStore.getValue().sections.section_id[targetSection];
            if (!nodeId) {
                if (attempt < 20) {
                    this.focusMandalaSectionTimer = window.setTimeout(
                        () => run(attempt + 1),
                        80,
                    );
                } else {
                    logger.debug('[perf][view] focusMandalaSection-timeout', {
                        file: this.file?.path,
                        targetSection,
                        attempts: attempt + 1,
                        costMs: Number((performance.now() - startMs).toFixed(2)),
                    });
                }
                return;
            }

            this.focusMandalaSectionTimer = null;
            this.viewStore.dispatch({
                type: 'view/mandala/subgrid/enter',
                payload: { theme: targetSection },
            });
            this.viewStore.dispatch({
                type: 'view/set-active-node/mouse-silent',
                payload: { id: nodeId },
            });
            logger.debug('[perf][view] focusMandalaSection', {
                file: this.file?.path,
                targetSection,
                attempts: attempt + 1,
                costMs: Number((performance.now() - startMs).toFixed(2)),
            });
        };

        this.focusMandalaSectionTimer = window.setTimeout(() => run(0), 80);
    }

    private shouldSkipAutoFocusToday() {
        return (
            this.hasPendingExplicitJump ||
            this.isExplicitJumpState(this.pendingEphemeralState)
        );
    }

    private isExplicitJumpState(state: unknown): boolean {
        if (!state || typeof state !== 'object') return false;
        const maybeState = state as { subpath?: unknown; line?: unknown };
        return (
            typeof maybeState.subpath === 'string' ||
            typeof maybeState.line === 'number'
        );
    }

    private cancelFocusMandalaSection() {
        this.focusMandalaSectionRequestId += 1;
        if (this.focusMandalaSectionTimer !== null) {
            window.clearTimeout(this.focusMandalaSectionTimer);
            this.focusMandalaSectionTimer = null;
        }
    }

    private scheduleFirstRenderProbe(
        loadStartedMs: number,
        event?: 'view-mount',
    ) {
        this.cancelFirstRenderProbe();
        this.firstRenderProbeRequestId = window.requestAnimationFrame(() => {
            this.firstRenderProbeRequestId = window.requestAnimationFrame(() => {
                this.firstRenderProbeRequestId = null;
                const loadMetrics =
                    this.documentStore.getValue().meta.mandalaV2.loadMetrics;
                logger.debug('[perf][view] firstRender', {
                    file: this.file?.path,
                    event,
                    bytes: loadMetrics?.bytes ?? 0,
                    sections_count: loadMetrics?.sectionsCount ?? 0,
                    parse_ms: loadMetrics?.parseMs ?? 0,
                    build_ms: loadMetrics?.buildMs ?? 0,
                    first_render_ms: Number(
                        (performance.now() - loadStartedMs).toFixed(2),
                    ),
                });
            });
        });
    }

    private cancelFirstRenderProbe() {
        if (this.firstRenderProbeRequestId !== null) {
            window.cancelAnimationFrame(this.firstRenderProbeRequestId);
            this.firstRenderProbeRequestId = null;
        }
    }

    private getMandalaProfileActivation(frontmatter: string) {
        if (
            this.cachedActivation &&
            this.cachedActivation.frontmatter === frontmatter
        ) {
            return this.cachedActivation.activation;
        }
        const activation = resolveMandalaProfileActivation(frontmatter);
        this.cachedActivation = { frontmatter, activation };
        return activation;
    }

    private consumePendingEphemeralState() {
        if (!this.pendingEphemeralState) return;
        const pending = this.pendingEphemeralState;
        this.pendingEphemeralState = null;
        void this.setEphemeralState(pending);
    }

    private async handleSubpathJump(subpath: string) {
        if (!this.file) return;
        const cache = this.app.metadataCache.getFileCache(this.file);
        if (!cache) return;
        const result = resolveSubpath(
            cache,
            subpath,
        ) as HeadingSubpathResult | BlockSubpathResult | null;
        if (!result) return;

        const heading =
            result.type === 'heading'
                ? {
                    text: result.current.heading,
                    level: result.current.level,
                }
                : null;
        const nodeId =
            (heading &&
                this.findNodeByHeading(heading.text, heading.level)) ||
            this.getNodeIdByLine(result.start.line);
        if (!nodeId || !this.isNodeAlive(nodeId)) return;
        this.updateSubgridThemeForNode(nodeId);
        await selectCard(this, nodeId);
        if (heading) {
            this.scrollHeadingIntoView(
                nodeId,
                heading.text,
                heading.level,
            );
        }
    }

    private async handleLineJump(line: number) {
        const nodeId = this.getNodeIdByLine(line);
        if (!nodeId || !this.isNodeAlive(nodeId)) return;
        this.updateSubgridThemeForNode(nodeId);
        await selectCard(this, nodeId);
    }

    private getNodeIdByLine(line: number): string | null {
        const section = this.getSectionNumberForLine(line);
        if (!section) return null;
        const nodeId =
            this.documentStore.getValue().sections.section_id[section] || null;
        if (!nodeId || !this.isNodeAlive(nodeId)) return null;
        return nodeId;
    }

    private updateSubgridThemeForNode(nodeId: string) {
        if (this.mandalaMode !== '3x3') return;
        const section =
            this.documentStore.getValue().sections.id_section[nodeId];
        if (!section) return;
        const parts = section.split('.');
        const theme =
            parts.length > 1 ? parts.slice(0, -1).join('.') : section;
        this.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme },
        });
    }

    private getSectionNumberForLine(line: number): string | null {
        const lines = this.data ? this.data.split('\n') : [];
        let current: string | null = null;
        for (let i = 0; i <= line && i < lines.length; i++) {
            const parsed = parseHtmlCommentMarker(lines[i]);
            if (parsed) current = parsed[2];
        }
        return current;
    }

    private findNodeByHeading(
        headingText: string,
        headingLevel?: number,
    ): string | null {
        const normalizedTarget = this.normalizeHeadingText(headingText);
        const { columns, content } = this.documentStore.getValue().document;
        for (const column of columns) {
            for (const group of column.groups) {
                for (const nodeId of group.nodes) {
                    const node = content[nodeId];
                    if (!node) continue;
                    const lines = node.content.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trimStart();
                        const match = /^(#{1,6})\s+(.*)$/.exec(trimmed);
                        if (!match) continue;
                        const currentLevel = match[1].length;
                        if (headingLevel && currentLevel !== headingLevel) continue;
                        const text = match[2].replace(/\s*#+\s*$/, '').trim();
                        if (
                            this.normalizeHeadingText(text) === normalizedTarget
                        ) {
                            return nodeId;
                        }
                    }
                }
            }
        }
        return null;
    }

    private isNodeAlive(nodeId: string) {
        const columns = this.documentStore.getValue().document.columns;
        return findNodeColumn(columns, nodeId) >= 0;
    }

    private normalizeHeadingText(text: string) {
        return stripHeading(text || '').trim().toLowerCase();
    }

    private scrollHeadingIntoView(
        nodeId: string,
        headingText: string,
        headingLevel?: number,
    ) {
        setTimeout(() => {
            const card = this.container?.querySelector<HTMLElement>(`#${nodeId}`);
            if (!card) return;
            const headingElements = Array.from(
                card.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'),
            );
            const normalizedTarget = this.normalizeHeadingText(headingText);
            const target =
                headingElements.find((h) => {
                    const level = Number(h.tagName.slice(1));
                    if (headingLevel && headingLevel !== level) return false;
                    const text =
                        h.dataset.heading?.toString() ||
                        h.textContent ||
                        '';
                    return (
                        this.normalizeHeadingText(text) === normalizedTarget
                    );
                }) || card;
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
            });
        }, 50);
    }
}
