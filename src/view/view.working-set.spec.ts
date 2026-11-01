import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('src/mandala-scenes/shared/shell/main.svelte', () => ({ default: {} }));
vi.mock('src/main', () => ({ default: class {} }));
vi.mock('obsidian', async (importOriginal) => ({
    ...(await importOriginal<typeof import('obsidian')>()),
    Scope: class {},
}));
import { MandalaView, shouldBlockPartialContentSave } from 'src/view/view';
import {
    MandalaSourceRuntime,
    projectWorkingSetDocumentState,
} from 'src/mandala-document/runtime/source-document-runtime';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import { defaultViewState } from 'src/stores/view/default-view-state';
import { syncThreeByThreeSubgridState } from 'src/mandala-scenes/view-3x3/scene-state';
import { viewReducer } from 'src/stores/view/view-reducer';
import { TextFileView, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';

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
    > & {
        fullHydrated: boolean;
        coolToWorkingSet: () => boolean;
    };
    return { view, runtime, viewState, getState: () => state, set };
};

describe('view working-set transitions', () => {
    afterEach(() => {
        vi.useRealTimers();
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

    it('blocks partial content serialization after a failed source patch', () => {
        expect(
            shouldBlockPartialContentSave('content-only', false, false),
        ).toBe(true);
        expect(shouldBlockPartialContentSave('content-only', false, true)).toBe(
            false,
        );
        expect(shouldBlockPartialContentSave('structural', false, false)).toBe(
            false,
        );
    });

    it('does not write a partial working set when source patching fails', () => {
        const frontmatter =
            '---\nmandala: true\nmandala_day_plan:\n  enabled: true\n  year: 2026\n---\n';
        const body = Array.from(
            { length: 365 },
            (_, index) => `<!--section: ${index + 1}-->\nday ${index + 1}\n`,
        ).join('');
        const runtime = new MandalaSourceRuntime(body);
        const state = projectWorkingSetDocumentState(
            defaultDocumentState(),
            runtime,
            runtime.materialize(['1', '305']),
            frontmatter,
        );
        state.document.content[state.sections.section_id['305']].content =
            'edited';
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
        });

        view.saveDocument({ mode: 'content-only', changedSections: ['305'] });

        expect(patch).toHaveBeenCalledOnce();
        expect(queue).not.toHaveBeenCalled();
        expect(view.data).toBe(frontmatter + body);
        expect(runtime.source).toBe(body);
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
