import { describe, expect, it, vi } from 'vitest';
vi.mock('src/mandala-scenes/shared/shell/main.svelte', () => ({ default: {} }));
vi.mock('src/main', () => ({ default: class {} }));
import { MandalaView } from 'src/view/view';
import {
    MandalaSourceRuntime,
    projectWorkingSetDocumentState,
} from 'src/mandala-document/runtime/source-document-runtime';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import { defaultViewState } from 'src/stores/view/default-view-state';

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
        viewStore: { getValue: () => viewState, setContext: vi.fn() },
        recordPerfEvent: vi.fn(),
    }) as Pick<
        MandalaView,
        | 'ensureFullHydrated'
        | 'documentStore'
        | 'materializeWorkingSet'
        | 'materializeSubgridForExit'
        | 'isWorkingSetProjection'
    > & {
        fullHydrated: boolean;
        coolToWorkingSet: () => boolean;
    };
    return { view, runtime, viewState, getState: () => state, set };
};

describe('view working-set transitions', () => {
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
});
