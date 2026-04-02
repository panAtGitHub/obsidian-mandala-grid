import {
    BlockSubpathResult,
    HeadingSubpathResult,
    debounce,
    IconName,
    Notice,
    Platform,
    Scope,
    TFile,
    TextFileView,
    ViewStateResult,
    WorkspaceLeaf,
    resolveSubpath,
    stripHeading,
} from 'obsidian';

import Component from 'src/mandala-scenes/shared/shell/main.svelte';
import MandalaGrid from '../main';
import { documentReducer } from 'src/mandala-document/state/document-reducer';
import { Unsubscriber } from 'svelte/store';
import { OnError, Store } from 'src/shared/store/store';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import {
    DocumentState,
    MandalaGridDocument,
} from 'src/mandala-document/state/document-state-type';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';
import { ViewState } from 'src/stores/view/view-state-type';
import { ViewStoreAction } from 'src/stores/view/view-store-actions';
import { defaultViewState } from 'src/stores/view/default-view-state';
import { viewReducer } from 'src/stores/view/view-reducer';
import { viewSubscriptions } from 'src/stores/view/subscriptions/view-subscriptions';
import { onPluginError } from 'src/shared/store/on-plugin-error';
import { InlineEditor } from 'src/obsidian/helpers/inline-editor/inline-editor';
import { id } from 'src/shared/helpers/id';
import invariant from 'tiny-invariant';
import { customIcons } from 'src/shared/helpers/load-custom-icons';

import { setViewType } from 'src/mandala-settings/state/actions/set-view-type';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';
import { DocumentSearch } from 'src/stores/view/subscriptions/effects/document-search/document-search';
import { AlignBranch } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';
import { lang } from 'src/lang/lang';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';
import { loadFullDocument } from 'src/stores/view/subscriptions/actions/document/load-full-document';
import { refreshActiveViewOfDocument } from 'src/stores/plugin/actions/refresh-active-view-of-document';
import { parseSectionMarker } from 'src/mandala-document/engine/parse-section-marker';
import { selectCard } from 'src/view/helpers/handle-links/helpers/select-card';
import {
    DayPlanTodayNavigation,
    resolveDayPlanTodayNavigation,
    MandalaProfileActivation,
    MandalaSceneKey,
    resolveMandalaProfile,
    resolveMandalaProfileActivation,
    resolveMandalaSceneKey,
} from 'src/mandala-display/logic/mandala-profile';
import { isNonEmptyMandalaContent } from 'src/mandala-display/logic/is-empty-mandala-content';
import { logger } from 'src/shared/helpers/logger';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';
import { prepareSaveSections } from 'src/mandala-document/engine/prepare-save-sections';
import { serializeSections } from 'src/mandala-document/engine/serialize-sections';
import { applySectionPatch } from 'src/mandala-display/logic/apply-section-patch';
import { resolveSubpathJumpNodeId } from 'src/view/helpers/resolve-subpath-jump-node-id';
import { PersistSnapshotQueue } from 'src/view/helpers/persist-snapshot-queue';
import {
    ensureCurrentFileCustomLayoutAvailable,
    resolveInitialMandalaDetailSidebarVisible,
    syncCurrentMandalaDetailSidebarVisibility,
    type MandalaUiStateSnapshot,
} from 'src/mandala-settings/state/current-file/mandala-view-state';
import {
    getCurrentMandalaLayoutId as getCurrentMandalaLayoutIdFromRuntimeState,
    getCurrentNx9RowsPerPage as getCurrentNx9RowsPerPageFromRuntimeState,
    isMandalaDetailSidebarVisible as isMandalaDetailSidebarVisibleFromRuntimeState,
    persistCurrentMandalaLayout as persistCurrentMandalaLayoutFromRuntimeState,
    persistMandalaUiState as persistMandalaUiStateToRuntimeState,
    restoreCachedMandalaUiState as restoreCachedMandalaUiStateFromRuntimeState,
    setCurrentNx9RowsPerPage as setCurrentNx9RowsPerPageFromRuntimeState,
    toggleCurrentMandalaDetailSidebar as toggleCurrentMandalaDetailSidebarFromRuntimeState,
} from 'src/view/helpers/mandala-view-runtime-state';
import { resolveRestoredSubgridTheme } from 'src/mandala-interaction/helpers/resolve-restored-subgrid-theme';
import { MandalaMode } from 'src/mandala-settings/state/settings-type';
import {
    resolveDocumentMandalaLayoutId,
    resolveMandalaLayoutId,
} from 'src/mandala-display/logic/grid-layout';
import { setActiveCellNx9 } from 'src/mandala-scenes/view-nx9/set-active-cell';
import {
    getMandalaActiveCell9x9,
    getMandalaActiveCellNx9,
    getMandalaWeekAnchorDate,
    getMandalaActiveCellWeek7x9,
} from 'src/mandala-scenes/shared/scene-runtime';
import {
    resolveNx9Context,
    resolveNx9CurrentCell,
    resolveNx9PageNavigationTarget,
} from 'src/mandala-scenes/view-nx9/context';
import { resolveCompatibleMandalaMode } from 'src/mandala-interaction/helpers/resolve-compatible-mandala-mode';
import {
    resolveEffectiveMandalaSettings,
    type EffectiveMandalaSettings,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';

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
    private cachedActivation: {
        frontmatter: string;
        activation: MandalaProfileActivation;
    } | null = null;
    private lastActivationNotice: string | null = null;
    private lastSaveBlockedNoticeKey: string | null = null;
    private lastPersistTransitionNoticeKey: string | null = null;
    private pendingSceneSyncTrace: {
        name: string;
        payload: Record<string, unknown>;
        startedAt: number;
    } | null = null;
    private readonly persistSnapshotQueue: PersistSnapshotQueue;
    private readonly persistSnapshotErrorKeys = new Map<string, string>();
    private readonly mandalaUiStateByPath = new Map<
        string,
        MandalaUiStateSnapshot
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
        this.viewStore = new Store<
            ViewState,
            ViewStoreAction,
            MandalaGridDocument
        >(
            defaultViewState(
                this.plugin.settings.getValue().view.mandalaMode,
                resolveInitialMandalaDetailSidebarVisible(this),
            ),
            viewReducer,
            this.onViewStoreError as OnError<ViewStoreAction>,
            this.documentStore.getValue().document,
        );

        this.id = id.view();
        this.documentSearch = new DocumentSearch(this);
        this.alignBranch = new AlignBranch(this);
        this.persistSnapshotQueue = new PersistSnapshotQueue({
            delayMs: 2000,
            persist: (path, data) => this.persistSnapshot(path, data),
            onError: ({ path, error }) => {
                this.handlePersistSnapshotError(path, error);
            },
        });
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

    get mandalaMode(): MandalaMode {
        return this.viewStore.getValue().ui.mandala.mode;
    }

    get mandalaActiveCellWeek7x9() {
        return getMandalaActiveCellWeek7x9(this.viewStore.getValue());
    }

    set mandalaActiveCellWeek7x9(cell: { row: number; col: number } | null) {
        this.viewStore.dispatch({
            type: 'view/mandala/week-active-cell/set',
            payload: { cell },
        });
    }

    get mandalaWeekAnchorDate() {
        return getMandalaWeekAnchorDate(this.viewStore.getValue());
    }

    get mandalaActiveCell9x9() {
        return getMandalaActiveCell9x9(this.viewStore.getValue());
    }

    set mandalaActiveCell9x9(cell: { row: number; col: number } | null) {
        this.viewStore.dispatch({
            type: 'view/mandala/active-cell/set',
            payload: { cell },
        });
    }

    get mandalaActiveCellNx9() {
        return getMandalaActiveCellNx9(this.viewStore.getValue());
    }

    set mandalaActiveCellNx9(
        cell: { row: number; col: number; page?: number } | null,
    ) {
        this.viewStore.dispatch({
            type: 'view/mandala/nx9-active-cell/set',
            payload: { cell },
        });
    }

    getCurrentFilePath() {
        return this.activeFilePath ?? this.file?.path ?? null;
    }

    recordPerfEvent(name: string, payload: Record<string, unknown> = {}) {
        this.plugin.perfRecorder.record(name, payload, {
            filePath: this.getCurrentFilePath(),
            mode: this.mandalaMode,
        });
    }

    recordPerfAfterNextPaint(
        name: string,
        startedAt: number,
        payload: Record<string, unknown> = {},
    ) {
        this.plugin.perfRecorder.recordAfterNextPaint(
            name,
            startedAt,
            payload,
            {
                filePath: this.getCurrentFilePath(),
                mode: this.mandalaMode,
            },
        );
    }

    beginSceneSyncTrace(name: string, payload: Record<string, unknown> = {}) {
        this.pendingSceneSyncTrace = {
            name,
            payload,
            startedAt: performance.now(),
        };
    }

    flushSceneSyncTrace(payload: Record<string, unknown> = {}) {
        if (!this.pendingSceneSyncTrace) return;
        const trace = this.pendingSceneSyncTrace;
        this.pendingSceneSyncTrace = null;
        this.recordPerfEvent(trace.name, {
            ...trace.payload,
            ...payload,
            total_ms: Number((performance.now() - trace.startedAt).toFixed(2)),
        });
    }

    getCurrentMandalaLayoutId(settings = this.plugin.settings.getValue()) {
        return getCurrentMandalaLayoutIdFromRuntimeState(this, settings);
    }

    isMandalaDetailSidebarVisible() {
        return isMandalaDetailSidebarVisibleFromRuntimeState(this);
    }

    toggleCurrentMandalaDetailSidebar() {
        toggleCurrentMandalaDetailSidebarFromRuntimeState(this);
    }

    canUseWeekPlanMode(
        frontmatter = this.documentStore.getValue().file.frontmatter,
    ) {
        const profile = resolveMandalaProfile(frontmatter);
        const effective = this.getEffectiveMandalaSettings();
        return (
            effective.general.weekPlanEnabled &&
            profile?.kind === 'day-plan'
        );
    }

    canUse9x9Mode() {
        return this.getEffectiveMandalaSettings().view.enable9x9View;
    }

    canUseNx9Mode(
        frontmatter = this.documentStore.getValue().file.frontmatter,
    ) {
        return (
            this.getEffectiveMandalaSettings().view.enableNx9View &&
            !Platform.isMobile &&
            this.documentStore.getValue().meta.isMandala &&
            (!resolveMandalaProfile(frontmatter)?.dayPlan ||
                this.canUseWeekPlanMode(frontmatter))
        );
    }

    getMandalaSceneKey(
        frontmatter = this.documentStore.getValue().file.frontmatter,
    ): MandalaSceneKey {
        const effective = this.getEffectiveMandalaSettings();
        return resolveMandalaSceneKey({
            frontmatter,
            viewKind: this.mandalaMode,
            weekPlanEnabled: effective.general.weekPlanEnabled,
        });
    }

    isWeekPlanVariant(
        frontmatter = this.documentStore.getValue().file.frontmatter,
    ) {
        return this.getMandalaSceneKey(frontmatter).variant === 'week-7x9';
    }

    getCurrentNx9RowsPerPage(settings = this.plugin.settings.getValue()) {
        return getCurrentNx9RowsPerPageFromRuntimeState(this, settings);
    }

    setCurrentNx9RowsPerPage(rowsPerPage: number) {
        setCurrentNx9RowsPerPageFromRuntimeState(this, rowsPerPage);
    }

    focusNx9Page(direction: 'prev' | 'next') {
        if (this.mandalaMode !== 'nx9' || this.isWeekPlanVariant()) return;

        const documentState = this.documentStore.getValue();
        const activeNodeId = this.viewStore.getValue().document.activeNode;
        const activeSection =
            documentState.sections.id_section[activeNodeId] ?? null;
        const context = resolveNx9Context({
            sectionIdMap: documentState.sections.section_id,
            documentContent: documentState.document.content,
            rowsPerPage: this.getCurrentNx9RowsPerPage(),
            activeSection,
            activeCell: this.mandalaActiveCellNx9,
            coreSectionMax: this.getEffectiveMandalaSettings().view.coreSectionMax,
        });
        const targetPage =
            direction === 'prev'
                ? context.currentPage - 1
                : context.currentPage + 1;
        if (targetPage < 0 || targetPage >= context.totalPages) return;

        const currentCell = resolveNx9CurrentCell({
            activeCell: this.mandalaActiveCellNx9,
            activeSection,
            context,
        });
        const target = resolveNx9PageNavigationTarget({
            context,
            page: targetPage,
            preferredCol: currentCell.col,
        });
        if (!target) return;

        setActiveCellNx9(this, {
            row: target.row,
            col: target.col,
            page: target.page,
        });
        const section = context.sectionForCell(
            target.row,
            target.col,
            target.page,
        );
        if (!section) return;
        const nextNodeId = documentState.sections.section_id[section];
        if (!nextNodeId || nextNodeId === activeNodeId) return;
        this.viewStore.dispatch({
            type: 'view/set-active-node/mouse-silent',
            payload: { id: nextNodeId },
        });
    }

    setMandalaMode(mode: MandalaMode) {
        if (mode === '9x9' && !this.canUse9x9Mode()) {
            new Notice('9x9 视图已在插件设置中关闭。');
            return false;
        }
        if (
            mode === 'nx9' &&
            !this.getEffectiveMandalaSettings().view.enableNx9View
        ) {
            new Notice('nx9 视图已在插件设置中关闭。');
            return false;
        }
        if (mode === 'nx9' && !this.canUseNx9Mode()) {
            new Notice('Nx9 视图仅支持桌面端的 mandala 文件。');
            return false;
        }
        this.viewStore.dispatch({
            type: 'view/mandala/mode/set',
            payload: { mode },
        });
        this.plugin.settings.dispatch({
            type: 'settings/view/mandala/set-mode',
            payload: { mode },
        });
        return true;
    }

    cycleMandalaMode() {
        const current = this.mandalaMode;
        const next =
            current === '3x3'
                ? this.canUse9x9Mode()
                    ? '9x9'
                    : this.canUseNx9Mode()
                      ? 'nx9'
                      : '3x3'
                : current === '9x9'
                  ? this.canUseNx9Mode()
                      ? 'nx9'
                      : '3x3'
                  : '3x3';
        return this.setMandalaMode(next);
    }

    ensureCompatibleMandalaMode(
        frontmatter = this.documentStore.getValue().file.frontmatter,
    ) {
        const currentMode = this.mandalaMode;
        const nextMode = resolveCompatibleMandalaMode({
            currentMode,
            canUse9x9Mode: this.canUse9x9Mode(),
            canUseNx9Mode: this.canUseNx9Mode(frontmatter),
        });

        if (!nextMode || nextMode === currentMode) {
            return false;
        }

        this.viewStore.dispatch({
            type: 'view/mandala/mode/set',
            payload: { mode: nextMode },
        });
        return true;
    }

    getState(): Record<string, unknown> {
        return {
            ...super.getState(),
            mandalaMode: this.mandalaMode,
            showDetailSidebar: this.isMandalaDetailSidebarVisible(),
        };
    }

    async setState(state: unknown, result: ViewStateResult): Promise<void> {
        const nextModeRaw = this.readMandalaModeFromState(state);
        const nextMode =
            nextModeRaw &&
            (resolveCompatibleMandalaMode({
                currentMode: nextModeRaw,
                canUse9x9Mode: this.canUse9x9Mode(),
                canUseNx9Mode: this.canUseNx9Mode(),
            }) ?? nextModeRaw);
        if (nextMode && nextMode !== this.mandalaMode) {
            this.viewStore.dispatch({
                type: 'view/mandala/mode/set',
                payload: { mode: nextMode },
            });
        }
        const nextShowDetailSidebar =
            this.readMandalaDetailSidebarVisibilityFromState(state);
        if (
            nextShowDetailSidebar !== null &&
            nextShowDetailSidebar !== this.isMandalaDetailSidebarVisible()
        ) {
            this.viewStore.dispatch({
                type: 'view/mandala/detail-sidebar/set',
                payload: {
                    open: nextShowDetailSidebar,
                    persistInDocument: false,
                },
            });
        }
        await super.setState(state, result);
    }

    getViewData(): string {
        return this.data;
    }

    setViewData(data: string, clear = false): void {
        if (!this.activeFilePath && this.file) {
            this.activeFilePath = this.file?.path;
            void this.loadInitialData();
        } else {
            if (!this.isViewOfFile || !this.file) return;

            const previousPath = this.activeFilePath;
            const nextPath = this.file.path;
            const switchedFile = previousPath !== nextPath;
            const changingFile = clear || switchedFile;

            if (changingFile) {
                this.debouncedLoadDocumentToStore.cancel();
                if (this.inlineEditor) {
                    this.inlineEditor.unloadNode();
                }
                if (previousPath) {
                    void this.flushPendingPersistSnapshotsForTransition(
                        switchedFile ? 'switch-file' : 'replace-view-data',
                    );
                    void this.persistMandalaUiState(previousPath);
                }
            }

            this.data = data;

            if (switchedFile) {
                this.activeFilePath = nextPath;
                this.lastLoadedBody = '';
                this.lastLoadedFrontmatter = '';
                this.cachedActivation = null;
                this.lastActivationNotice = null;
                this.loadDocumentToStore();
                return;
            }

            if (clear) {
                this.loadDocumentToStore();
                return;
            }

            this.debouncedLoadDocumentToStore();
        }
    }

    async onUnloadFile(_file?: TFile) {
        this.cancelFocusMandalaSection();
        this.cancelFirstRenderProbe();
        this.debouncedLoadDocumentToStore.cancel();
        if (this.inlineEditor) {
            this.inlineEditor.unloadNode();
        }
        const flushed =
            await this.flushPendingPersistSnapshotsForTransition('close-view');
        if (!flushed) {
            return;
        }
        if (this.component) {
            this.component.$destroy();
        }
        if (this.file?.path) {
            this.persistMandalaUiState(this.file.path);
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
        this.debouncedLoadDocumentToStore.cancel();
        if (this.inlineEditor) {
            this.inlineEditor.unloadNode();
        }
        void this.flushPendingPersistSnapshotsForTransition('clear-view');
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
        if (Platform.isMobile) {
            void import(
                'src/obsidian/helpers/inline-editor/section-native-editor-session'
            ).then(({ ensureSectionSessionMaintenance }) => {
                void ensureSectionSessionMaintenance(this);
            });
        }
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
            void this.handleSubpathJump(
                (state as { subpath: string }).subpath,
            ).finally(() => {
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
        if (!state.meta.mandalaV2.enabled) {
            throw new Error(
                'MandalaGrid V2 document state is required for saveDocument',
            );
        }
        let body = '';
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
                const replacement =
                    state.document.content[nodeId]?.content ?? '';
                return isNonEmptyMandalaContent(replacement);
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
            patchMs += Number((performance.now() - patchStartedMs).toFixed(2));
            if (usedFastPath) {
                body = patchedBody;
                this.lastSaveBlockedNoticeKey = null;
            }
        }

        if (!usedFastPath) {
            const prepareStartedMs = performance.now();
            const prepared = prepareSaveSections(
                state.document,
                state.sections,
                {
                    parentToChildrenSlots:
                        state.meta.mandalaV2.parentToChildrenSlots,
                    subtreeNonEmptyCountBySection:
                        state.meta.mandalaV2.subtreeNonEmptyCountBySection,
                },
            );
            prepareMs = Number(
                (performance.now() - prepareStartedMs).toFixed(2),
            );
            droppedSectionCount = prepared.stats.droppedSectionCount;
            prunedParentCount = prepared.stats.prunedParentCount;
            blockedParentCount = prepared.stats.blockedParentCount;

            if (prepared.blockedReasons.length > 0) {
                const message = prepared.blockedReasons[0];
                const blockedKey = `${this.file.path}:${state.meta.mandalaV2.revision}:${message}`;
                if (this.lastSaveBlockedNoticeKey !== blockedKey) {
                    this.lastSaveBlockedNoticeKey = blockedKey;
                    new Notice(message, 3500);
                }
                logger.error('[mandala-document] save blocked', {
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

        const savePerfPayload = {
            file: this.file.path,
            mode,
            used_fast_path: usedFastPath,
            save_prepare_ms: prepareMs,
            save_patch_ms: patchMs,
            save_serialize_ms: serializeMs,
            save_dropped_sections: droppedSectionCount,
            save_pruned_parents: prunedParentCount,
            save_blocked_count: blockedParentCount,
            save_total_ms: Number(
                (performance.now() - saveStartedMs).toFixed(2),
            ),
        };
        logger.debug('[perf][view] saveDocument', savePerfPayload);
        this.recordPerfEvent('view.save-document', savePerfPayload);
        const data: string = state.file.frontmatter + body;
        if (data !== this.data) {
            if (data.trim().length === 0) {
                throw new Error(lang.error_save_empty_data);
            }
            this.data = data;
            const parsed = extractFrontmatter(data);
            this.lastLoadedBody = parsed.body;
            this.lastLoadedFrontmatter = parsed.frontmatter;
            const persistPath = this.activeFilePath ?? this.file?.path ?? null;
            if (persistPath) {
                this.queuePersistSnapshot(persistPath, data);
            }
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
        const frontmatterHasChanged =
            frontmatter !== this.lastLoadedFrontmatter;

        const isEditing = Boolean(viewState.document.editing.activeNodeId);

        const activationStartMs = performance.now();
        const activation = this.getMandalaProfileActivation(frontmatter);
        const activationCostMs = performance.now() - activationStartMs;
        this.dayPlanHotCores = activation.hotCoreSections;
        const settings = this.plugin.settings.getValue();
        const filePath = this.file?.path ?? '';
        const hydratedSettings = ensureCurrentFileCustomLayoutAvailable(
            this,
            filePath,
            settings,
        );
        syncCurrentMandalaDetailSidebarVisibility(this, hydratedSettings);
        const documentPreferences = hydratedSettings.documents[filePath];
        const persistedMandalaViewState = documentPreferences?.mandalaView;
        const customLayouts = hydratedSettings.view.mandalaGridCustomLayouts;
        const currentSelectedLayoutId = resolveDocumentMandalaLayoutId({
            path: filePath,
            settings: hydratedSettings,
        });
        const globalSelectedLayoutId = resolveMandalaLayoutId(
            hydratedSettings.view.mandalaGridSelectedLayoutId,
            customLayouts,
        );
        const nextSelectedLayoutId = currentSelectedLayoutId;
        if (nextSelectedLayoutId !== globalSelectedLayoutId) {
            this.plugin.settings.dispatch({
                type: 'settings/view/mandala/select-grid-layout',
                payload: {
                    layoutId: nextSelectedLayoutId,
                },
            });
        }
        const sectionsInBody = this.collectSectionIdsFromBody(body);
        const persistedMandalaLastActiveSection =
            this.getExistingSectionFromBody(
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
            loadFullDocument(this, body, frontmatter, nextActiveSection);
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
            const loadFullDocumentPerfPayload = {
                file: this.file?.path,
                event,
                bytes: loadMetrics?.bytes ?? 0,
                sections_count: loadMetrics?.sectionsCount ?? 0,
                parse_ms: loadMetrics?.parseMs ?? 0,
                build_ms: loadMetrics?.buildMs ?? 0,
                loadCostMs: Number(loadCostMs.toFixed(2)),
                nextActiveSection,
            };
            logger.debug(
                '[perf][view] loadFullDocument',
                loadFullDocumentPerfPayload,
            );
            this.recordPerfEvent('document.load-from-disk', {
                event: event ?? null,
                bytes: loadMetrics?.bytes ?? 0,
                sections_count: loadMetrics?.sectionsCount ?? 0,
                parse_ms: loadMetrics?.parseMs ?? 0,
                build_ms: loadMetrics?.buildMs ?? 0,
            });
            this.recordPerfEvent(
                'view.load-full-document',
                loadFullDocumentPerfPayload,
            );
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
            const fallbackSubgridTheme = resolveRestoredSubgridTheme({
                existingSections: sectionsInBody,
                persistedSubgridTheme:
                    persistedMandalaViewState?.subgridTheme ?? null,
                lastActiveSection: nextActiveSection ?? null,
            });
            this.restoreMandalaUiState(filePath, fallbackSubgridTheme);
        }
        if (this.isActive && this.isViewOfFile) {
            this.ensureCompatibleMandalaMode(frontmatter);
        }
        const loadDocumentToStorePerfPayload = {
            file: this.file?.path,
            event,
            bytes:
                this.documentStore.getValue().meta.mandalaV2.loadMetrics
                    ?.bytes ?? 0,
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
        };
        logger.debug(
            '[perf][view] loadDocumentToStore',
            loadDocumentToStorePerfPayload,
        );
        this.recordPerfEvent(
            'view.load-document-to-store',
            loadDocumentToStorePerfPayload,
        );
    };

    private persistMandalaUiState(path: string) {
        persistMandalaUiStateToRuntimeState(
            this,
            path,
            this.mandalaUiStateByPath,
        );
    }

    persistCurrentMandalaLayout(layoutId: string) {
        persistCurrentMandalaLayoutFromRuntimeState(this, layoutId);
    }

    private restoreMandalaUiState(path: string, fallbackSubgridTheme = '1') {
        restoreCachedMandalaUiStateFromRuntimeState(
            this,
            path,
            this.mandalaUiStateByPath,
            fallbackSubgridTheme,
        );
    }

    private collectSectionIdsFromBody(body: string) {
        const sectionIds = new Set<string>();
        for (const line of body.split('\n')) {
            const marker = parseSectionMarker(line);
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

    private queuePersistSnapshot(path: string, data: string) {
        this.persistSnapshotQueue.queue(path, data);
    }

    private async flushAllPendingPersistSnapshots() {
        await this.persistSnapshotQueue.flushAll();
    }

    private async flushPendingPersistSnapshotsForTransition(
        reason:
            | 'switch-file'
            | 'replace-view-data'
            | 'clear-view'
            | 'close-view',
    ) {
        try {
            await this.flushAllPendingPersistSnapshots();
            if (this.lastPersistTransitionNoticeKey?.startsWith(`${reason}:`)) {
                this.lastPersistTransitionNoticeKey = null;
            }
            return true;
        } catch (error) {
            this.handlePersistTransitionError(reason, error);
            return false;
        }
    }

    private async persistSnapshot(path: string, data: string) {
        const abstractFile = this.app.vault.getAbstractFileByPath(path);
        if (!(abstractFile instanceof TFile)) return;
        await this.app.vault.process(abstractFile, () => data);
        this.persistSnapshotErrorKeys.delete(path);
    }

    private handlePersistSnapshotError(path: string, error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const errorKey = `${path}:${message}`;
        if (this.persistSnapshotErrorKeys.get(path) !== errorKey) {
            this.persistSnapshotErrorKeys.set(path, errorKey);
            new Notice(`Failed to save ${path}`);
        }
        logger.error('[mandala-view] persist snapshot failed', {
            file: path,
            error: message,
        });
    }

    private handlePersistTransitionError(
        reason:
            | 'switch-file'
            | 'replace-view-data'
            | 'clear-view'
            | 'close-view',
        error: unknown,
    ) {
        const message = error instanceof Error ? error.message : String(error);
        const noticeKey = `${reason}:${message}`;
        if (this.lastPersistTransitionNoticeKey !== noticeKey) {
            this.lastPersistTransitionNoticeKey = noticeKey;
            const actionLabel =
                reason === 'close-view'
                    ? 'closing the view'
                    : reason === 'clear-view'
                      ? 'clearing the view'
                      : 'switching files';
            new Notice(
                `Pending changes were not fully saved before ${actionLabel}.`,
                3500,
            );
        }
        logger.error('[mandala-view] persist transition failed', {
            reason,
            error: message,
        });
    }

    getDayPlanTodayNavigation(date: Date = new Date()): DayPlanTodayNavigation {
        return resolveDayPlanTodayNavigation(
            this.documentStore.getValue().file.frontmatter,
            date,
        );
    }

    focusDayPlanToday(date: Date = new Date()) {
        const navigation = this.getDayPlanTodayNavigation(date);
        if (!navigation.targetSection) return false;
        this.focusMandalaSection(navigation.targetSection);
        return true;
    }

    private focusMandalaSection(targetSection: string) {
        this.cancelFocusMandalaSection();
        const currentNodeId = this.viewStore.getValue().document.activeNode;
        const currentSection =
            this.documentStore.getValue().sections.id_section[currentNodeId];
        if (currentSection === targetSection) return;

        const requestId = ++this.focusMandalaSectionRequestId;
        const startMs = performance.now();
        const run = (attempt: number) => {
            if (requestId !== this.focusMandalaSectionRequestId) return;
            const nodeId =
                this.documentStore.getValue().sections.section_id[
                    targetSection
                ];
            if (!nodeId) {
                if (attempt < 20) {
                    this.focusMandalaSectionTimer = window.setTimeout(
                        () => run(attempt + 1),
                        80,
                    );
                } else {
                    const timeoutPerfPayload = {
                        file: this.file?.path,
                        targetSection,
                        attempts: attempt + 1,
                        costMs: Number(
                            (performance.now() - startMs).toFixed(2),
                        ),
                    };
                    logger.debug(
                        '[perf][view] focusMandalaSection-timeout',
                        timeoutPerfPayload,
                    );
                    this.recordPerfEvent(
                        'view.focus-section-timeout',
                        timeoutPerfPayload,
                    );
                }
                return;
            }

            this.focusMandalaSectionTimer = null;
            this.viewStore.batch(() => {
                this.viewStore.dispatch({
                    type: 'view/mandala/subgrid/enter',
                    payload: { theme: targetSection },
                });
                this.viewStore.dispatch({
                    type: 'view/set-active-node/focus-section',
                    payload: { id: nodeId },
                });
            });
            const focusPerfPayload = {
                file: this.file?.path,
                targetSection,
                attempts: attempt + 1,
                costMs: Number((performance.now() - startMs).toFixed(2)),
            };
            logger.debug('[perf][view] focusMandalaSection', focusPerfPayload);
            this.recordPerfEvent('view.focus-section', focusPerfPayload);
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
            this.firstRenderProbeRequestId = window.requestAnimationFrame(
                () => {
                    this.firstRenderProbeRequestId = null;
                    const loadMetrics =
                        this.documentStore.getValue().meta.mandalaV2
                            .loadMetrics;
                    const firstRenderPerfPayload = {
                        file: this.file?.path,
                        event,
                        bytes: loadMetrics?.bytes ?? 0,
                        sections_count: loadMetrics?.sectionsCount ?? 0,
                        parse_ms: loadMetrics?.parseMs ?? 0,
                        build_ms: loadMetrics?.buildMs ?? 0,
                        first_render_ms: Number(
                            (performance.now() - loadStartedMs).toFixed(2),
                        ),
                    };
                    logger.debug(
                        '[perf][view] firstRender',
                        firstRenderPerfPayload,
                    );
                    this.recordPerfEvent(
                        'view.first-render',
                        firstRenderPerfPayload,
                    );
                },
            );
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
        const activation = resolveMandalaProfileActivation(
            frontmatter,
            new Date(),
            this.getEffectiveMandalaSettings().general.weekStart,
        );
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
        const state = this.documentStore.getValue();
        const result = resolveSubpath(cache, subpath) as
            | HeadingSubpathResult
            | BlockSubpathResult
            | null;
        if (!result) return;

        const heading =
            result.type === 'heading'
                ? {
                      text: result.current.heading,
                      level: result.current.level,
                  }
                : null;
        const nodeId = resolveSubpathJumpNodeId({
            markdown: this.data,
            document: state.document,
            sections: state.sections,
            line: result.start.line,
            headingText: heading?.text,
            headingLevel: heading?.level,
        });
        if (!nodeId || !this.isNodeAlive(nodeId)) return;
        this.updateSubgridThemeForNode(nodeId);
        await selectCard(this, nodeId);
        if (heading) {
            this.scrollHeadingIntoView(nodeId, heading.text, heading.level);
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
        const theme = parts.length > 1 ? parts.slice(0, -1).join('.') : section;
        this.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme },
        });
    }

    getEffectiveMandalaSettings(
        settings = this.plugin.settings.getValue(),
    ): EffectiveMandalaSettings {
        return resolveEffectiveMandalaSettings(
            settings,
            this.documentStore.getValue().file.frontmatter,
        );
    }

    private getSectionNumberForLine(line: number): string | null {
        const lines = this.data ? this.data.split('\n') : [];
        let current: string | null = null;
        for (let i = 0; i <= line && i < lines.length; i++) {
            const parsed = parseSectionMarker(lines[i]);
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
                        if (headingLevel && currentLevel !== headingLevel)
                            continue;
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
        return stripHeading(text || '')
            .trim()
            .toLowerCase();
    }

    private readMandalaModeFromState(state: unknown): MandalaMode | null {
        if (!state || typeof state !== 'object') {
            return null;
        }
        const maybeMode = (state as { mandalaMode?: unknown }).mandalaMode;
        return maybeMode === '3x3' ||
            maybeMode === '9x9' ||
            maybeMode === 'nx9'
            ? maybeMode
            : null;
    }

    private readMandalaDetailSidebarVisibilityFromState(
        state: unknown,
    ): boolean | null {
        if (!state || typeof state !== 'object') {
            return null;
        }
        const maybeVisibility = (state as { showDetailSidebar?: unknown })
            .showDetailSidebar;
        return typeof maybeVisibility === 'boolean' ? maybeVisibility : null;
    }

    private scrollHeadingIntoView(
        nodeId: string,
        headingText: string,
        headingLevel?: number,
    ) {
        setTimeout(() => {
            const card = this.container?.querySelector<HTMLElement>(
                `#${nodeId}`,
            );
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
                        h.dataset.heading?.toString() || h.textContent || '';
                    return this.normalizeHeadingText(text) === normalizedTarget;
                }) || card;
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
            });
        }, 50);
    }
}
