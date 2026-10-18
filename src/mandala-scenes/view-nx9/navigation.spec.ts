import { describe, expect, it, vi } from 'vitest';
import { tryMandalaNx9Navigation } from 'src/mandala-scenes/view-nx9/navigation';
import {
    MandalaSourceRuntime,
    projectWorkingSetDocumentState,
} from 'src/mandala-document/runtime/source-document-runtime';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import type { MandalaView } from 'src/view/view';
import type { ViewStoreAction } from 'src/stores/view/view-store-actions';

const createHost = () => {
    const source = new MandalaSourceRuntime(
        '<!--section: 1-->root\n<!--section: 1.1-->child\n<!--section: 2-->other\n<!--section: 2.1-->next child',
    );
    let state = projectWorkingSetDocumentState(
        defaultDocumentState(),
        source,
        source.materialize(['1', '1.1']),
        '',
    );
    const document = {
        activeNode: state.sections.section_id['1'],
        selectedNodes: new Set<string>(),
    };
    const materializeNx9Page = vi.fn(() => {
        state = projectWorkingSetDocumentState(
            state,
            source,
            source.materialize(['2', '2.1']),
            '',
        );
    });
    const view = {
        mandalaMode: 'nx9',
        mandalaActiveCellNx9: { page: 0, row: 0, col: 0 },
        documentStore: { getValue: () => state },
        viewStore: {
            getValue: () => ({ document }),
            dispatch: vi.fn((action: ViewStoreAction) => {
                if (action.type === 'view/set-active-node/nx9-nav')
                    document.activeNode = action.payload.id;
            }),
        },
        getCurrentNx9RowsPerPage: () => 1,
        getEffectiveMandalaSettings: () => ({
            view: { coreSectionMax: 'unlimited' },
        }),
        getSectionLookup: () => source,
        materializeNx9Page,
        recordPerfAfterNextPaint: vi.fn(),
    } as unknown as MandalaView;
    return { view, source, materializeNx9Page, document };
};

describe('nx9 navigation working sets', () => {
    it('moves within the current page without reprojecting the document', () => {
        const { view, materializeNx9Page, source, document } = createHost();
        expect(tryMandalaNx9Navigation(view, 'right')).toBe(true);
        expect(materializeNx9Page).not.toHaveBeenCalled();
        expect(document.activeNode).toBe(source.getNodeId('1.1'));
    });
    it('materializes a new page before activating its node', () => {
        const { view, materializeNx9Page, source, document } = createHost();
        expect(tryMandalaNx9Navigation(view, 'down')).toBe(true);
        expect(materializeNx9Page).toHaveBeenCalledWith(1);
        expect(document.activeNode).toBe(source.getNodeId('2'));
        expect(view.mandalaActiveCellNx9).toEqual({ page: 1, row: 0, col: 0 });
    });
});
