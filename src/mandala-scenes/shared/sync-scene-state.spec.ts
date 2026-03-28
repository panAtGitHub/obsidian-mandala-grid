import { describe, expect, it } from 'vitest';
import { createSceneStateSynchronizer } from 'src/mandala-scenes/shared/sync-scene-state';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';

type ActiveCell9x9 = { row: number; col: number } | null;
type ActiveCellNx9 = { row: number; col: number; page?: number } | null;
type ActiveCellWeek = { row: number; col: number } | null;

const createDocumentState = () =>
    ({
        file: { frontmatter: 'mandala: true\n' },
        meta: { isMandala: true },
        sections: {
            section_id: {},
        },
        document: {
            content: '',
        },
        history: [],
        pinnedNodes: [],
    }) as unknown as DocumentState;

const createView = () => {
    let activeCell9x9: ActiveCell9x9 = { row: 0, col: 0 };
    let activeCellNx9: ActiveCellNx9 = { row: 1, col: 1, page: 0 };
    let activeCellWeek: ActiveCellWeek = { row: 2, col: 2 };

    return {
        plugin: {
            settings: {
                getValue: () => ({
                    general: { weekPlanEnabled: true },
                }),
            },
        },
        viewStore: {
            dispatch: ({ type, payload }: { type: string; payload: { cell?: ActiveCellWeek } }) => {
                if (type === 'view/mandala/week-active-cell/set') {
                    activeCellWeek = payload.cell ?? null;
                    activeCellNx9 = payload.cell
                        ? {
                              row: payload.cell.row,
                              col: payload.cell.col,
                              page: 0,
                          }
                        : null;
                }
            },
        },
        ensureCompatibleMandalaMode: () => undefined,
        get mandalaActiveCell9x9() {
            return activeCell9x9;
        },
        set mandalaActiveCell9x9(cell: ActiveCell9x9) {
            activeCell9x9 = cell;
        },
        get mandalaActiveCellNx9() {
            return activeCellNx9;
        },
        set mandalaActiveCellNx9(cell: ActiveCellNx9) {
            activeCellNx9 = cell;
        },
        get mandalaActiveCellWeek7x9() {
            return activeCellWeek;
        },
    };
};

describe('sync-scene-state', () => {
    it('does not clear unrelated scene caches while projecting current scene state', () => {
        const view = createView();
        const syncSceneState = createSceneStateSynchronizer();
        const baseArgs = {
            view: view as never,
            sceneKey: {
                viewKind: '3x3',
                variant: 'default',
            } as const,
            dayPlanEnabled: false,
            subgridTheme: '1',
            sectionToNodeId: {},
            idToSection: {},
            activeNodeId: null,
            documentState: createDocumentState(),
            selectedLayoutId: 'default',
            customLayouts: [],
            nx9RowsPerPage: null,
            weekAnchorDate: null,
            weekStart: 'monday' as const,
        };

        syncSceneState(baseArgs);

        expect(view.mandalaActiveCell9x9).toEqual({ row: 0, col: 0 });
        expect(view.mandalaActiveCellNx9).toEqual({ row: 1, col: 1, page: 0 });
        expect(view.mandalaActiveCellWeek7x9).toEqual({ row: 2, col: 2 });
    });
});
