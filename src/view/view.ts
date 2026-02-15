import {
    BlockSubpathResult,
    HeadingSubpathResult,
    debounce,
    IconName,
    Notice,
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
import { clone } from 'src/helpers/clone';
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
import { getPersistedDocumentFormat } from 'src/obsidian/events/workspace/helpers/get-persisted-document-format';
import { stringifyDocument } from 'src/view/helpers/stringify-document';
import { setDocumentFormat } from 'src/stores/settings/actions/set-document-format';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';
import { DocumentSearch } from 'src/stores/view/subscriptions/effects/document-search/document-search';
import {
    MinimapDomElements,
    MinimapState,
} from 'src/stores/minimap/minimap-state-type';
import { MinimapStoreAction } from 'src/stores/minimap/minimap-store-actions';
import { StyleRulesProcessor } from 'src/stores/view/subscriptions/effects/style-rules/style-rules-processor';
import { AlignBranch } from 'src/stores/view/subscriptions/effects/align-branch/align-branch';
import { lang } from 'src/lang/lang';
import { DebouncedMinimapEffects } from 'src/stores/minimap/subscriptions/effects/debounced-minimap-effects';
import { updateFrontmatter } from 'src/stores/view/subscriptions/actions/document/update-frontmatter';
import { loadFullDocument } from 'src/stores/view/subscriptions/actions/document/load-full-document';
import { refreshActiveViewOfDocument } from 'src/stores/plugin/actions/refresh-active-view-of-document';
import { detectDocumentFormat } from 'src/lib/format-detection/detect-document-format';
import { MandalaGridDocumentFormat } from 'src/stores/settings/settings-type';
import { parseHtmlCommentMarker } from 'src/lib/data-conversion/helpers/html-comment-marker/parse-html-comment-marker';
import { selectCard } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/helpers/select-card';
import {
    MandalaProfileActivation,
    resolveMandalaProfileActivation,
} from 'src/lib/mandala/mandala-profile';
import { logger } from 'src/helpers/logger';

export const MANDALA_VIEW_TYPE = 'mandala-grid';

export type DocumentStore = Store<DocumentState, DocumentStoreAction>;
export type ViewStore = Store<ViewState, ViewStoreAction, MandalaGridDocument>;
export type MinimapStore = Store<MinimapState, MinimapStoreAction>;

export class MandalaView extends TextFileView {
    component: Component;
    documentStore: DocumentStore;
    viewStore: ViewStore;
    minimapStore: MinimapStore | null;
    minimapEffects: DebouncedMinimapEffects;
    container: HTMLElement | null;
    inlineEditor: InlineEditor;
    documentSearch: DocumentSearch;
    rulesProcessor: StyleRulesProcessor;
    alignBranch: AlignBranch;
    id: string;
    zoomFactor: number;
    mandalaMode: '3x3' | '9x9' = '3x3';
    mandalaActiveCell9x9: { row: number; col: number } | null = null;
    dayPlanHotCores: Set<string> = new Set();
    minimapDom: MinimapDomElements | null = null;
    private pendingEphemeralState: unknown = null;
    private readonly onDestroyCallbacks: Set<Unsubscriber> = new Set();
    private activeFilePath: null | string;
    private lastLoadedBody = '';
    private lastLoadedFrontmatter = '';
    private cachedActivation:
        | { frontmatter: string; activation: MandalaProfileActivation }
        | null = null;
    private lastActivationNotice: string | null = null;
    constructor(
        leaf: WorkspaceLeaf,
        public plugin: MandalaGrid,
    ) {
        super(leaf);
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
        this.rulesProcessor = new StyleRulesProcessor(this);
        this.alignBranch = new AlignBranch(this);
        this.minimapEffects = new DebouncedMinimapEffects();
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
        if (this.component) {
            this.component.$destroy();
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

    async onOpen() {}

    async onClose() {
        await this.onUnloadFile();
    }

    setEphemeralState(state: unknown) {
        super.setEphemeralState(state);
        if (!state) return;
        const documentLoaded =
            this.documentStore.getValue().document.columns.length > 0;
        if (!documentLoaded) {
            this.pendingEphemeralState = state;
            return;
        }
        if (typeof (state as { subpath?: string }).subpath === 'string') {
            void this.handleSubpathJump(
                (state as { subpath: string }).subpath,
            );
        } else if (typeof (state as { line?: number }).line === 'number') {
            void this.handleLineJump((state as { line: number }).line);
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

    saveDocument = () => {
        invariant(this.file);
        const state = clone(this.documentStore.getValue());
        const data: string =
            state.file.frontmatter +
            stringifyDocument(state.document, getPersistedDocumentFormat(this));
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
        const format = this.getDocumentFormat(body);
        const emptyStore = documentState.history.items.length === 0;
        const bodyHasChanged = body !== this.lastLoadedBody;
        const frontmatterHasChanged = frontmatter !== this.lastLoadedFrontmatter;

        const isEditing = Boolean(viewState.document.editing.activeNodeId);

        const activeNode = viewState.document.activeNode;
        const activeSection = activeNode
            ? documentState.sections.id_section[activeNode]
            : null;
        const activationStartMs = performance.now();
        const activation = this.getMandalaProfileActivation(frontmatter);
        const activationCostMs = performance.now() - activationStartMs;
        this.dayPlanHotCores = activation.hotCoreSections;
        const nextActiveSection = activation.targetSection ?? activeSection;
        let loadedFromDisk = false;
        if (emptyStore || (bodyHasChanged && !isEditing)) {
            const loadStartMs = performance.now();
            loadFullDocument(
                this,
                body,
                frontmatter,
                format,
                nextActiveSection,
            );
            const loadCostMs = performance.now() - loadStartMs;
            this.lastLoadedBody = body;
            this.lastLoadedFrontmatter = frontmatter;
            if (this.isActive && event !== 'view-mount') {
                new Notice('Document updated externally');
            }
            loadedFromDisk = true;
            logger.debug('[perf][view] loadFullDocument', {
                file: this.file?.path,
                event,
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
            this.focusMandalaSection(activation.targetSection);
        }
        logger.debug('[perf][view] loadDocumentToStore', {
            file: this.file?.path,
            event,
            emptyStore,
            bodyHasChanged,
            frontmatterHasChanged,
            loadedFromDisk,
            kind: activation.kind,
            activationCostMs: Number(activationCostMs.toFixed(2)),
            totalCostMs: Number((performance.now() - startMs).toFixed(2)),
        });
    };

    private getDocumentFormat(body: string) {
        let format: MandalaGridDocumentFormat;
        format = getPersistedDocumentFormat(this, false);
        if (format) {
            return format;
        }

        format =
            detectDocumentFormat(body) ||
            this.plugin.settings.getValue().general.defaultDocumentFormat;

        setDocumentFormat(this.plugin, this.file!.path, format);
        return format;
    }

    private debouncedLoadDocumentToStore = debounce(
        this.loadDocumentToStore,
        250,
    );

    private focusMandalaSection(targetSection: string) {
        const currentNodeId = this.viewStore.getValue().document.activeNode;
        const currentSection = this.documentStore.getValue().sections.id_section[
            currentNodeId
        ];
        if (currentSection === targetSection) return;

        const startMs = performance.now();
        const run = (attempt: number) => {
            const nodeId =
                this.documentStore.getValue().sections.section_id[targetSection];
            if (!nodeId) {
                if (attempt < 20) {
                    window.setTimeout(() => run(attempt + 1), 80);
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

        window.setTimeout(() => run(0), 80);
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

    setMinimapDom(dom: MinimapDomElements) {
        this.minimapDom = dom;
    }

    getMinimapDom() {
        invariant(this.minimapDom);
        return this.minimapDom;
    }

    getMinimapStore() {
        invariant(this.minimapStore);
        return this.minimapStore;
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
        if (!nodeId) return;
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
        if (!nodeId) return;
        this.updateSubgridThemeForNode(nodeId);
        await selectCard(this, nodeId);
    }

    private getNodeIdByLine(line: number): string | null {
        const section = this.getSectionNumberForLine(line);
        if (!section) return null;
        return this.documentStore.getValue().sections.section_id[section] || null;
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
        const { content } = this.documentStore.getValue().document;
        for (const [nodeId, node] of Object.entries(content)) {
            const lines = node.content.split('\n');
            for (const line of lines) {
                const trimmed = line.trimStart();
                const match = /^(#{1,6})\s+(.*)$/.exec(trimmed);
                if (!match) continue;
                const currentLevel = match[1].length;
                if (headingLevel && currentLevel !== headingLevel) continue;
                const text = match[2].replace(/\s*#+\s*$/, '').trim();
                if (this.normalizeHeadingText(text) === normalizedTarget) {
                    return nodeId;
                }
            }
        }
        return null;
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
