import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('src/mandala-scenes/shared/shell/main.svelte', () => ({ default: {} }));
vi.mock('src/main', () => ({ default: class {} }));
vi.mock('obsidian', async (importOriginal) => ({
    ...(await importOriginal<typeof import('obsidian')>()),
    Scope: class {},
}));
import { MandalaView } from 'src/view/view';
import {
    MandalaSourceRuntime,
    projectWorkingSetDocumentState,
} from 'src/mandala-document/runtime/source-document-runtime';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import { defaultViewState } from 'src/stores/view/default-view-state';
import { syncThreeByThreeSubgridState } from 'src/mandala-scenes/view-3x3/scene-state';
import { viewReducer } from 'src/stores/view/view-reducer';
import { TFile, TextFileView, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import type { StructuralMutation } from 'src/mandala-document/runtime/reconcile-structural-mutation';
import type { SectionContentEdit } from 'src/mandala-document/runtime/patch-section-contents';
import { get } from 'svelte/store';
import { DocumentPersistence } from 'src/view/helpers/document-persistence';
import { PersistSnapshotQueue } from 'src/view/helpers/persist-snapshot-queue';
import { Store } from 'src/shared/store/store';
import { documentReducer } from 'src/mandala-document/state/document-reducer';
import type { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';

const createHost = () => {
    const runtime = new MandalaSourceRuntime(
        '<!--section: 1-->root\n<!--section: 1.1-->child\n<!--section: 2-->other',
    );
    let state = projectWorkingSetDocumentState(
        defaultDocumentState(),
        runtime,
        runtime.materialize(['1', '1.1', '2']),
        '',
    );
    const viewState = defaultViewState('3x3', false);
    viewState.document.activeNode = state.sections.section_id['1'];
    viewState.ui.mandala.subgridTheme = '1';
    const set = vi.fn((next: typeof state) => {
        state = next;
    });
    const view = Object.assign(Object.create(MandalaView.prototype), {
        sourceRuntime: runtime,
        fullHydrated: false,
        data: runtime.source,
        file: {},
        documentStore: { getValue: () => state, set, dispatch: vi.fn() },
        workingSetCooldown: { schedule: vi.fn(), cancel: vi.fn() },
        viewStore: {
            getValue: () => viewState,
            setContext: vi.fn(),
            batch: (callback: () => void) => callback(),
            dispatch: vi.fn((action: Parameters<typeof viewReducer>[1]) =>
                viewReducer(viewState, action, state.document),
            ),
        },
        getEffectiveMandalaSettings: () => ({ view: { subgridMaxDepth: 2 } }),
        focusMandalaSectionRequestId: 0,
        focusMandalaSectionTimer: null,
        recordPerfEvent: vi.fn(),
    }) as Pick<
        MandalaView,
        | 'ensureFullHydrated'
        | 'documentStore'
        | 'materializeWorkingSet'
        | 'materializeSubgridForExit'
        | 'isWorkingSetProjection'
        | 'focusDayPlanToday'
        | 'getDayPlanTodayNavigation'
        | 'getSectionLookup'
        | 'materializeSections'
    > & {
        fullHydrated: boolean;
        coolToWorkingSet: () => boolean;
        joinDocumentViews: () => void;
        leaveDocumentViews: () => void;
        data: string;
    };
    return { view, runtime, viewState, getState: () => state, set };
};

describe('view working-set transitions', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps edit drafts out of flush and publishes only a confirmed write', async () => {
        const file = Object.assign(new TFile(), { path: 'note.md' });
        let disk = '<!--section: 1-->original\n<!--section: 2-->other';
        const process = vi.fn(
            async (_file: TFile, transform: (data: string) => string) => {
                disk = transform(disk);
                return disk;
            },
        );
        Object.assign(TextFileView.prototype, {
            app: {
                scope: {},
                vault: {
                    getAbstractFileByPath: () => file,
                    process,
                },
            },
        });
        const view = new MandalaView(new WorkspaceLeaf(), {
            settings: { getValue: DEFAULT_SETTINGS },
        } as never);
        const state = defaultDocumentState();
        state.sections.section_id['1'] = 'node';
        state.sections.id_section.node = '1';
        const dispatch = vi.fn();
        Object.assign(view, {
            file,
            inlineEditor: { nodeId: 'node', getContent: () => 'unfinished' },
            documentStore: { getValue: () => state, dispatch },
        });
        view.editSession.startSession('node', false, 'original');
        view.editSession.updateBuffer('draft');
        await view.flushPendingSaves();
        expect(process).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
        disk = disk.replace('other', 'external change in another section');
        await expect(view.editSession.requestSave()).resolves.toBe(true);
        expect(disk).toBe(
            '<!--section: 1-->\ndraft\n<!--section: 2-->external change in another section',
        );
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'document/update-node-content',
                payload: { nodeId: 'node', content: 'draft' },
                context: {
                    alreadyPersisted: true,
                    isInSidebar: false,
                    suppressRefocus: true,
                },
            }),
        );
        disk = disk.replace('draft', 'conflicting change');
        view.editSession.updateBuffer('another draft');
        dispatch.mockClear();
        await expect(view.editSession.requestSave()).resolves.toBe(false);
        expect(get(view.editSession.stateStore)).toMatchObject({
            dirty: true,
            bufferContent: 'another draft',
        });
        expect(disk).toContain('conflicting change');
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('writes a recovery copy when persisting a pending snapshot fails', async () => {
        const file = new TFile();
        const write = vi.fn(async (_path: string, _content: string) => {});
        Object.assign(TextFileView.prototype, {
            app: {
                scope: {},
                vault: {
                    getAbstractFileByPath: () => file,
                    process: async () => {
                        throw new Error('write failed');
                    },
                    adapter: { write },
                },
            },
        });
        const view = new MandalaView(new WorkspaceLeaf(), {
            settings: { getValue: DEFAULT_SETTINGS },
        } as never);
        const internal = view as unknown as {
            persistence: DocumentPersistence;
        };
        internal.persistence.queue.queueSections('note.md', [
            { sectionId: '1', before: 'original', after: 'unsaved draft' },
        ]);
        await expect(view.flushPendingSaves()).rejects.toThrow('write failed');
        expect(write.mock.calls[0][0]).toMatch(/^mandala-unsaved-.*\.json$/);
        expect(JSON.parse(write.mock.calls[0][1])).toMatchObject({
            file: 'note.md',
            edits: [
                { sectionId: '1', before: 'original', after: 'unsaved draft' },
            ],
        });
    });

    it('merges edits to different sections and rejects conflicting edits', async () => {
        const file = new TFile();
        const first = '<!--section: 1-->first\n<!--section: 2-->two';
        let disk = first;
        const view = Object.assign(
            Object.create(DocumentPersistence.prototype),
            {
                app: {
                    vault: {
                        getAbstractFileByPath: () => file,
                        process: async (
                            _file: TFile,
                            update: (current: string) => string,
                        ) => {
                            disk = update(disk);
                        },
                    },
                },
                persistSnapshotErrorKeys: new Map(),
            },
        ) as {
            persistSectionEdits: (
                path: string,
                edits: SectionContentEdit[],
            ) => Promise<void>;
        };
        await view.persistSectionEdits('a.md', [
            { sectionId: '2', before: 'two', after: 'second' },
        ]);
        expect(disk).toContain('first');
        expect(disk).toContain('second');
        const before = disk;
        await expect(
            view.persistSectionEdits('a.md', [
                { sectionId: '1', before: 'one', after: 'other' },
            ]),
        ).rejects.toThrow();
        expect(disk).toBe(before);
    });

    it('rejects a content save that would silently split text into a new section', async () => {
        const file = new TFile();
        const original = '<!--section: 1-->original';
        let disk = original;
        const view = Object.assign(
            Object.create(DocumentPersistence.prototype),
            {
                app: {
                    vault: {
                        getAbstractFileByPath: () => file,
                        process: async (
                            _file: TFile,
                            update: (current: string) => string,
                        ) => {
                            disk = update(disk);
                        },
                    },
                },
                persistSnapshotErrorKeys: new Map(),
            },
        ) as {
            persistSectionEdits: (
                path: string,
                edits: SectionContentEdit[],
            ) => Promise<void>;
        };
        await expect(
            view.persistSectionEdits('a.md', [
                {
                    sectionId: '1',
                    before: 'original',
                    after: 'edited\n<!--section: 1.1-->new text',
                },
            ]),
        ).rejects.toThrow();
        expect(disk).toBe(original);
    });

    it('persists two independent view queues against the latest markdown', async () => {
        const file = new TFile();
        const original = '<!--section: 1-->one\n<!--section: 2-->two';
        let disk = original;
        const makeView = () =>
            Object.assign(Object.create(DocumentPersistence.prototype), {
                app: {
                    vault: {
                        getAbstractFileByPath: () => file,
                        process: async (
                            _file: TFile,
                            update: (current: string) => string,
                        ) => {
                            disk = update(disk);
                        },
                    },
                },
                persistSnapshotErrorKeys: new Map(),
            }) as {
                persistSectionEdits: (
                    path: string,
                    edits: SectionContentEdit[],
                ) => Promise<void>;
            };
        const firstView = makeView();
        const secondView = makeView();
        const queue1 = new PersistSnapshotQueue({
            delayMs: 2000,
            persistStructure: async () => {},
            persistSections: (path, edits) =>
                firstView.persistSectionEdits(path, edits),
        });
        const queue2 = new PersistSnapshotQueue({
            delayMs: 2000,
            persistStructure: async () => {},
            persistSections: (path, edits) =>
                secondView.persistSectionEdits(path, edits),
        });
        queue1.queueSections('a.md', [
            { sectionId: '1', before: 'one', after: 'first' },
        ]);
        queue2.queueSections('a.md', [
            { sectionId: '2', before: 'two', after: 'second' },
        ]);
        await queue1.flush('a.md');
        await queue2.flush('a.md');
        expect(disk).toContain('first');
        expect(disk).toContain('second');
    });

    it('shares saves, preserves conflicts, and releases the writer when its pane closes', async () => {
        const original =
            '<!--section: 1-->one\n<!--section: 2-->two\n<!--section: 3-->three';
        let disk = original;
        const file = Object.assign(new TFile(), { path: 'note.md' });
        const write = vi.fn(async (_path: string, _content: string) => {});
        const process = vi.fn(
            async (_file: TFile, update: (current: string) => string) => {
                disk = update(disk);
                return disk;
            },
        );
        const vault = {
            getAbstractFileByPath: () => file,
            process,
            adapter: { write },
        };
        Object.assign(TextFileView.prototype, { app: { scope: {}, vault } });
        const runtime = new MandalaSourceRuntime(original);
        const state = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['1', '2', '3']),
            '',
        );
        const store = new Store(state, documentReducer, (error) => {
            throw error;
        });
        const makeView = () => {
            const view = new MandalaView(new WorkspaceLeaf(), {
                settings: { getValue: DEFAULT_SETTINGS },
                app: { workspace: { getLeavesOfType: () => [] } },
                store: { dispatch: vi.fn() },
            } as never);
            Object.assign(view, {
                file,
                data: original,
                documentStore: store,
                sourceRuntime: new MandalaSourceRuntime(original),
                fullHydrated: true,
                container: {},
                contentEl: { empty: vi.fn() },
                debouncedLoadDocumentToStore: { cancel: vi.fn() },
                persistMandalaUiState: vi.fn(),
                workingSetCooldown: { schedule: vi.fn(), cancel: vi.fn() },
                recordPerfEvent: vi.fn(),
            });
            const unsubscribe = store.subscribe(
                (document, action?: DocumentStoreAction) => {
                    if (action?.type === 'document/mandala/ensure-children') {
                        view.saveDocument({
                            mode: 'structural',
                            structuralMutation:
                                document.meta.mandalaV2
                                    .lastStructuralMutation ?? undefined,
                        });
                    } else if (
                        action?.type === 'document/update-node-content'
                    ) {
                        const section =
                            document.sections.id_section[action.payload.nodeId];
                        view.saveDocument({
                            mode: 'content-only',
                            changedSections: [section],
                            recoveryEdits: [action.payload],
                            alreadyPersisted: action.context.alreadyPersisted,
                        });
                    }
                },
            );
            const internals = view as unknown as {
                joinDocumentViews(): void;
                onDestroyCallbacks: Set<() => void>;
            };
            internals.joinDocumentViews();
            internals.onDestroyCallbacks.add(unsubscribe);
            return view;
        };
        const first = makeView();
        const second = makeView();
        const secondPerf = vi.spyOn(second, 'recordPerfEvent');
        store.dispatch({
            type: 'document/mandala/ensure-children',
            payload: { parentNodeId: state.sections.section_id['1'] },
        });
        store.dispatch({
            type: 'document/update-node-content',
            payload: {
                nodeId: store.getValue().sections.section_id['1.1'],
                content: 'Generated title',
            },
            context: { isInSidebar: false },
        });
        await second.flushPendingSaves();
        await first.flushPendingSaves();
        expect(disk).toContain('Generated title');
        expect(process).toHaveBeenCalledTimes(2);
        expect(write).not.toHaveBeenCalled();
        expect(secondPerf).not.toHaveBeenCalledWith(
            'view.save-document',
            expect.anything(),
        );

        first.editSession.startSession(
            state.sections.section_id['1'],
            false,
            'one',
        );
        second.editSession.startSession(
            state.sections.section_id['2'],
            false,
            'two',
        );
        first.editSession.updateBuffer('first edit');
        second.editSession.updateBuffer('second edit');
        await first.editSession.requestSave();
        await second.editSession.requestSave();
        await first.flushPendingSaves();
        await second.flushPendingSaves();
        expect(disk).toContain('first edit');
        expect(disk).toContain('second edit');
        expect(disk).toContain('<!--section: 3-->three');

        const node = state.sections.section_id['3'];
        first.editSession.startSession(node, false, 'three');
        second.editSession.startSession(node, false, 'three');
        first.editSession.updateBuffer('first on three');
        second.editSession.updateBuffer('second on three');
        await first.editSession.requestSave();
        await second.editSession.requestSave();
        await first.flushPendingSaves();
        await second.flushPendingSaves();
        expect(disk).toContain('first on three');
        expect(disk).not.toContain('second on three');
        expect(get(second.editSession.stateStore).dirty).toBe(true);

        process.mockRejectedValueOnce(new Error('temporary disk error'));
        store.dispatch({
            type: 'document/update-node-content',
            payload: {
                nodeId: state.sections.section_id['1'],
                content: 'save queued before close',
            },
            context: { isInSidebar: false },
        });
        await first.onUnloadFile();
        expect(first.documentStore).not.toBe(store);
        expect(second.documentStore).toBe(store);
        store.dispatch({
            type: 'document/update-node-content',
            payload: {
                nodeId: state.sections.section_id['2'],
                content: 'save from remaining pane',
            },
            context: { isInSidebar: false },
        });
        await second.flushPendingSaves();
        expect(disk).toContain('save queued before close');
        expect(disk).toContain('save from remaining pane');
    });

    it('applies an explicit structural addition to the latest file', async () => {
        const file = new TFile();
        const intended =
            '<!--section: 1-->one\n<!--section: 1.1-->child\n<!--section: 2-->two';
        let disk = '<!--section: 1-->one\n<!--section: 2-->external';
        const mutation: StructuralMutation = {
            actionType: 'test',
            addedSections: ['1.1'],
            removedSections: [],
            changedSections: [],
            beforeContentBySection: { '1': 'one', '2': 'two' },
        };
        const view = Object.assign(
            Object.create(DocumentPersistence.prototype),
            {
                app: {
                    vault: {
                        getAbstractFileByPath: () => file,
                        process: async (
                            _file: TFile,
                            update: (current: string) => string,
                        ) => {
                            disk = update(disk);
                        },
                    },
                },
                persistSnapshotErrorKeys: new Map(),
            },
        ) as {
            persistSnapshot: (
                path: string,
                data: string,
                mutation: StructuralMutation,
            ) => Promise<void>;
        };
        await view.persistSnapshot('a.md', intended, mutation);
        expect(disk).toContain('child');
        expect(disk).toContain('external');
    });

    it('focuses today before the previous grid can evict its working set', async () => {
        vi.useFakeTimers();
        const host = createHost();
        vi.spyOn(host.view, 'getDayPlanTodayNavigation').mockReturnValue({
            isDayPlan: true,
            targetSection: '2',
            canNavigate: true,
        });
        const setState = host.set.getMockImplementation()!;
        host.set.mockImplementation((state) => {
            setState(state);
            void Promise.resolve().then(() => {
                syncThreeByThreeSubgridState({
                    view: host.view as unknown as MandalaView,
                    mode: '3x3',
                    subgridTheme: host.viewState.ui.mandala.subgridTheme,
                    documentState: host.getState(),
                    sectionToNodeId: host.getState().sections.section_id,
                    sectionLookup: host.view.getSectionLookup(),
                    allowSubgridExpansion: false,
                });
            });
        });

        expect(host.view.focusDayPlanToday()).toBe(true);
        await vi.runAllTimersAsync();

        expect(host.viewState.ui.mandala.subgridTheme).toBe('2');
        expect(host.viewState.document.activeNode).toBe(
            host.runtime.getNodeId('2'),
        );
    });

    it('returns to the today grid even when its node is already active', async () => {
        vi.useFakeTimers();
        const host = createHost();
        host.viewState.ui.mandala.subgridTheme = '2';
        vi.spyOn(host.view, 'getDayPlanTodayNavigation').mockReturnValue({
            isDayPlan: true,
            targetSection: '1',
            canNavigate: true,
        });

        host.view.focusDayPlanToday();
        await vi.runAllTimersAsync();

        expect(host.viewState.ui.mandala.subgridTheme).toBe('1');
    });

    it('does not notify or bump revisions when the requested working set is unchanged', () => {
        const host = createHost();
        host.view.materializeWorkingSet('1');
        const first = host.getState();
        host.set.mockClear();
        host.view.materializeWorkingSet('1');
        expect(host.getState()).toBe(first);
        expect(host.set).not.toHaveBeenCalled();
    });

    it('keeps the full shared document for two dates without replacing live edits or node IDs', () => {
        const first = createHost();
        const second = createHost();
        const shared = new Store(first.getState(), documentReducer);
        const set = vi.spyOn(shared, 'set');
        first.view.documentStore = second.view.documentStore = shared;
        const source =
            '<!--section: 1-->root\n<!--section: 1.1-->child\n<!--section: 2-->other\n<!--section: 2.1-->other child';
        first.runtime.replaceSourceFromExternal(source);
        first.view.data = source;
        first.view.joinDocumentViews();
        first.view.materializeWorkingSet('1');
        const editedNode = shared.getValue().sections.section_id['1.1'];
        shared.dispatch({
            type: 'document/update-node-content',
            payload: { nodeId: editedNode, content: 'unsaved edit' },
            context: { isInSidebar: false },
        });
        first.viewState.document.editing.activeNodeId = editedNode;

        second.view.joinDocumentViews();
        const full = shared.getValue();
        expect(Object.keys(full.sections.section_id)).toHaveLength(4);
        expect(full.sections.section_id['1.1']).toBe(editedNode);
        expect(full.document.content[editedNode].content).toBe('unsaved edit');
        expect(first.viewState.document.editing.activeNodeId).toBe(editedNode);
        expect(set).toHaveBeenCalledTimes(2);
        set.mockClear();
        for (const [host, theme] of [
            [first, '1'],
            [second, '2'],
        ] as const) {
            syncThreeByThreeSubgridState({
                view: host.view as unknown as MandalaView,
                mode: '3x3',
                subgridTheme: theme,
                documentState: full,
                sectionToNodeId: full.sections.section_id,
                sectionLookup: host.view.getSectionLookup(),
                allowSubgridExpansion: false,
            });
            expect(host.view.materializeSections([theme])).toBe(false);
            expect(host.view.coolToWorkingSet()).toBe(true);
            expect(host.view.isWorkingSetProjection).toBe(false);
        }
        expect(set).not.toHaveBeenCalled();

        second.view.leaveDocumentViews();
        first.viewState.document.editing.activeNodeId = '';
        full.document.content[editedNode].content = 'child';
        expect(first.view.coolToWorkingSet()).toBe(true);
        expect(first.view.isWorkingSetProjection).toBe(true);
    });
    it('refreshes the same working set after an external content change', () => {
        const host = createHost();
        host.view.materializeWorkingSet('1');
        host.runtime.replaceSourceFromExternal(
            '<!--section: 1-->external\n<!--section: 1.1-->child\n<!--section: 2-->other',
        );
        host.view.materializeWorkingSet('1');
        expect(
            host.getState().document.content[host.runtime.getNodeId('1') ?? '']
                .content,
        ).toBe('external');
    });
    it('blocks structural saves from another view after the shared store is projected', () => {
        const host = createHost();
        host.runtime.replaceSourceFromExternal(
            '<!--section: 1-->root\n<!--section: 2-->other\n<!--section: 3-->unloaded',
        );
        host.view.materializeWorkingSet('1');
        const queue = vi.fn();
        Object.assign(TextFileView.prototype, { app: { scope: {} } });
        const other = new MandalaView(new WorkspaceLeaf(), {
            settings: { getValue: DEFAULT_SETTINGS },
        } as never);
        Object.assign(other, {
            file: { path: 'shared.md' },
            data: host.runtime.source,
            sourceRuntime: new MandalaSourceRuntime(host.runtime.source),
            fullHydrated: true,
            documentStore: host.view.documentStore,
            queuePersistSnapshot: queue,
            queueSectionEdits: queue,
        });

        other.saveDocument({ mode: 'structural' });
        expect(queue).not.toHaveBeenCalled();
        expect(other.data).toBe(host.runtime.source);
    });

    it('does not replace an unloaded section with empty content in another view', () => {
        const host = createHost();
        host.runtime.replaceSourceFromExternal(
            '<!--section: 1-->root\n<!--section: 2-->important content',
        );
        host.view.materializeWorkingSet('1');
        const queue = vi.fn();
        Object.assign(TextFileView.prototype, { app: { scope: {} } });
        const other = new MandalaView(new WorkspaceLeaf(), {
            settings: { getValue: DEFAULT_SETTINGS },
        } as never);
        Object.assign(other, {
            file: { path: 'shared.md' },
            data: host.runtime.source,
            sourceRuntime: new MandalaSourceRuntime(host.runtime.source),
            fullHydrated: false,
            documentStore: host.view.documentStore,
            queuePersistSnapshot: queue,
            queueSectionEdits: queue,
        });

        other.saveDocument({ mode: 'content-only', changedSections: ['2'] });
        expect(queue).not.toHaveBeenCalled();
        expect(other.data).toBe(host.runtime.source);
    });
    it('defers cooling while editing and preserves selected and pinned nodes afterward', () => {
        const host = createHost();
        const other = host.getState().sections.section_id['2'];
        host.getState().pinnedNodes.Ids = [other];
        host.viewState.document.selectedNodes.add(other);
        host.view.fullHydrated = true;
        host.viewState.document.editing.activeNodeId = other;
        expect(host.view.coolToWorkingSet()).toBe(false);
        expect(host.view.isWorkingSetProjection).toBe(false);
        host.viewState.document.editing.activeNodeId = '';
        expect(host.view.coolToWorkingSet()).toBe(true);
        expect(host.view.isWorkingSetProjection).toBe(true);
        expect(host.getState().sections.section_id['2']).toBe(other);
        expect(host.viewState.document.selectedNodes.has(other)).toBe(true);
    });
    it('loads descendants before considering pruning and keeps the previous root addressable', () => {
        const host = createHost();
        host.runtime.replaceSourceFromExternal(
            '<!--section: 1-->root\n<!--section: 2-->other\n<!--section: 2.1-->\n<!--section: 2.1.1-->nested content',
        );
        host.view.materializeSubgridForExit('2');
        expect(host.getState().sections.section_id['1']).toBeTruthy();
        expect(
            host.getState().meta.mandalaV2.subtreeNonEmptyCountBySection['2.1'],
        ).toBe(1);
    });
    it('marks hydration before notifying subscribers so they cannot shrink the incoming state', () => {
        const host = createHost();
        vi.spyOn(host.view.documentStore, 'dispatch').mockImplementation(() => {
            expect(host.view.isWorkingSetProjection).toBe(false);
        });
        expect(host.view.ensureFullHydrated('test')).toBe(true);
        expect(host.view.ensureFullHydrated('reentrant')).toBe(false);
    });

    it('hydrates a shared projection even when this view was previously full', () => {
        const host = createHost();
        host.view.materializeWorkingSet('1');
        host.view.fullHydrated = true;
        expect(host.view.ensureFullHydrated('shared')).toBe(true);
        expect(host.view.ensureFullHydrated('shared')).toBe(false);
    });

    it('does not hydrate over a shared edit that differs from this view', () => {
        const host = createHost();
        host.view.materializeWorkingSet('1');
        host.view.fullHydrated = true;
        host.getState().document.content[host.runtime.getNodeId('1')!].content =
            'other view edit';
        expect(host.view.ensureFullHydrated('shared')).toBe(false);
        expect(
            host.getState().document.content[host.runtime.getNodeId('1')!]
                .content,
        ).toBe('other view edit');
    });
    it('does not drop unsaved structural or content changes during cooling', () => {
        const host = createHost();
        host.view.fullHydrated = true;
        host.getState().document.content[
            host.runtime.getNodeId('1') ?? ''
        ].content = 'unsaved';
        host.view.coolToWorkingSet();
        expect(host.view.isWorkingSetProjection).toBe(false);
        expect(
            host.getState().document.content[host.runtime.getNodeId('1') ?? '']
                .content,
        ).toBe('unsaved');
    });

    it.each([
        {
            name: 'day plan',
            frontmatter:
                '---\nmandala: true\nmandala_day_plan:\n  enabled: true\n  year: 2026\n---\n',
            count: 365,
            editedSection: '305',
        },
        {
            name: 'ordinary mandala',
            frontmatter: '---\nmandala: true\n---\n',
            count: 10,
            editedSection: '5',
        },
    ])(
        'does not write a partial $name when source patching fails',
        ({ frontmatter, count, editedSection }) => {
            const body = Array.from(
                { length: count },
                (_, index) =>
                    `<!--section: ${index + 1}-->\ncontent ${index + 1}\n`,
            ).join('');
            const runtime = new MandalaSourceRuntime(body);
            const state = projectWorkingSetDocumentState(
                defaultDocumentState(),
                runtime,
                runtime.materialize(['1', editedSection]),
                frontmatter,
            );
            state.document.content[
                state.sections.section_id[editedSection]
            ].content = 'edited';
            const patch = vi
                .spyOn(runtime, 'replaceSectionContents')
                .mockReturnValue(null);
            const queue = vi.fn();
            Object.assign(TextFileView.prototype, { app: { scope: {} } });
            const view = new MandalaView(new WorkspaceLeaf(), {
                settings: { getValue: DEFAULT_SETTINGS },
            } as never);
            Object.assign(view, {
                file: { path: 'day-plan.md' },
                data: frontmatter + body,
                sourceRuntime: runtime,
                fullHydrated: false,
                documentStore: { getValue: () => state },
                queuePersistSnapshot: queue,
                queueSectionEdits: queue,
            });

            view.saveDocument({
                mode: 'content-only',
                changedSections: [editedSection],
            });

            expect(patch).toHaveBeenCalledOnce();
            expect(queue).not.toHaveBeenCalled();
            expect(view.data).toBe(frontmatter + body);
            expect(runtime.source).toBe(body);
        },
    );

    it('blocks structural day-plan saves when a shared store is only partially loaded', () => {
        const frontmatter =
            '---\nmandala: true\nmandala_day_plan:\n  enabled: true\n  year: 2026\n---\n';
        const body = Array.from(
            { length: 365 },
            (_, index) => `<!--section: ${index + 1}-->\ncontent\n`,
        ).join('');
        const runtime = new MandalaSourceRuntime(body);
        const state = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['1', '3']),
            frontmatter,
        );
        const queue = vi.fn();
        Object.assign(TextFileView.prototype, { app: { scope: {} } });
        const view = new MandalaView(new WorkspaceLeaf(), {
            settings: { getValue: DEFAULT_SETTINGS },
        } as never);
        Object.assign(view, {
            file: { path: 'day-plan.md' },
            data: frontmatter + body,
            sourceRuntime: runtime,
            fullHydrated: true,
            documentStore: { getValue: () => state },
            queuePersistSnapshot: queue,
            queueSectionEdits: queue,
        });

        view.saveDocument({ mode: 'structural' });

        expect(queue).not.toHaveBeenCalled();
        expect(view.data).toBe(frontmatter + body);
        expect(runtime.source).toBe(body);
    });

    it('backs up the edit instead of rebuilding the file when a section patch fails', async () => {
        const body = '<!--section: 1-->one\n<!--section: 2-->two';
        const runtime = new MandalaSourceRuntime(body);
        const state = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['1', '2']),
            '',
        );
        state.document.content[state.sections.section_id['1']].content =
            'edited';
        vi.spyOn(runtime, 'replaceSectionContents').mockReturnValue(null);
        const queue = vi.fn();
        const write = vi.fn(async (_path: string, _content: string) => {});
        Object.assign(TextFileView.prototype, {
            app: { scope: {}, vault: { adapter: { write } } },
        });
        const view = new MandalaView(new WorkspaceLeaf(), {
            settings: { getValue: DEFAULT_SETTINGS },
        } as never);
        Object.assign(view, {
            file: { path: 'note.md' },
            data: body,
            sourceRuntime: runtime,
            fullHydrated: true,
            documentStore: { getValue: () => state },
            queuePersistSnapshot: queue,
            queueSectionEdits: queue,
        });
        view.saveDocument({ mode: 'content-only', changedSections: ['1'] });
        expect(queue).not.toHaveBeenCalled();
        expect(view.data).toBe(body);
        await vi.waitFor(() => expect(write).toHaveBeenCalledOnce());
        expect(JSON.parse(write.mock.calls[0][1])).toMatchObject({
            file: 'note.md',
            sections: { '1': 'edited', '2': 'two' },
        });
    });

    it('reports failed recovery writes during view transitions', async () => {
        const body = '<!--section: 1-->one';
        const runtime = new MandalaSourceRuntime(body);
        const state = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['1']),
            '',
        );
        state.document.content[state.sections.section_id['1']].content =
            'edited';
        vi.spyOn(runtime, 'replaceSectionContents').mockReturnValue(null);
        Object.assign(TextFileView.prototype, {
            app: {
                scope: {},
                vault: {
                    adapter: {
                        write: async () => {
                            throw new Error('disk full');
                        },
                    },
                },
            },
        });
        const view = new MandalaView(new WorkspaceLeaf(), {
            settings: { getValue: DEFAULT_SETTINGS },
        } as never);
        Object.assign(view, {
            file: { path: 'note.md' },
            data: body,
            sourceRuntime: runtime,
            fullHydrated: true,
            documentStore: { getValue: () => state },
        });
        view.saveDocument({ mode: 'content-only', changedSections: ['1'] });
        await expect(view.flushPendingSaves()).rejects.toThrow('无法备份');
    });

    it('retries a failed recovery copy without losing its contents', async () => {
        const body = '<!--section: 1-->one';
        const runtime = new MandalaSourceRuntime(body);
        const state = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['1']),
            '',
        );
        state.document.content[state.sections.section_id['1']].content =
            'edited';
        vi.spyOn(runtime, 'replaceSectionContents').mockReturnValue(null);
        const write = vi
            .fn<[_path: string, _data: string], Promise<void>>()
            .mockRejectedValueOnce(new Error('disk busy'))
            .mockResolvedValue(undefined);
        Object.assign(TextFileView.prototype, {
            app: { scope: {}, vault: { adapter: { write } } },
        });
        const view = new MandalaView(new WorkspaceLeaf(), {
            settings: { getValue: DEFAULT_SETTINGS },
        } as never);
        Object.assign(view, {
            file: { path: 'note.md' },
            data: body,
            sourceRuntime: runtime,
            fullHydrated: true,
            documentStore: { getValue: () => state },
        });
        view.saveDocument({ mode: 'content-only', changedSections: ['1'] });
        await view.flushPendingSaves();
        expect(write).toHaveBeenCalledTimes(2);
        expect(write.mock.calls[1]).toEqual(write.mock.calls[0]);
    });

    it('patches an emptied section without dropping another section', () => {
        const body = '<!--section: 1-->one\n<!--section: 2-->two';
        const runtime = new MandalaSourceRuntime(body);
        const state = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['1', '2']),
            '',
        );
        state.document.content[state.sections.section_id['1']].content = '';
        const queue = vi.fn();
        Object.assign(TextFileView.prototype, { app: { scope: {} } });
        const view = new MandalaView(new WorkspaceLeaf(), {
            settings: { getValue: DEFAULT_SETTINGS },
        } as never);
        Object.assign(view, {
            file: { path: 'note.md' },
            data: body,
            sourceRuntime: runtime,
            fullHydrated: true,
            documentStore: { getValue: () => state },
            queuePersistSnapshot: queue,
            queueSectionEdits: queue,
            workingSetCooldown: { schedule: vi.fn() },
            recordPerfEvent: vi.fn(),
        });
        view.saveDocument({ mode: 'content-only', changedSections: ['1'] });
        expect(view.data).toBe('<!--section: 1-->\n<!--section: 2-->two');
        expect(queue).toHaveBeenCalledOnce();
    });

    it('does not make a missing day-plan target navigable', () => {
        const host = createHost();
        host.getState().file.frontmatter = `---
mandala: true
mandala_plan:
  enabled: true
  year: 2026
---
`;

        const navigation = MandalaView.prototype.getDayPlanTodayNavigation.call(
            host.view as never,
            new Date('2026-01-03T08:00:00'),
        );

        expect(navigation).toEqual({
            isDayPlan: true,
            targetSection: '3',
            canNavigate: false,
        });
    });
});
