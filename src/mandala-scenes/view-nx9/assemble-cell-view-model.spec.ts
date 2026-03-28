import { describe, expect, it } from 'vitest';
import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';
import {
    applyNx9PageInteractionState,
    assembleNx9PageFrame,
    buildNx9StaticCardCellDescriptors,
    buildNx9PageIndex,
    buildNx9PageStaticRows,
    patchNx9ActiveInteractionState,
    type Nx9InteractionSnapshot,
    type Nx9PageFrameRowViewModel,
    type Nx9RealCellViewModel,
} from 'src/mandala-scenes/view-nx9/assemble-cell-view-model';
import { resolveNx9Context } from 'src/mandala-scenes/view-nx9/context';

const createFixture = () => {
    const sectionIdMap = {
        '1': 'node-1',
        '1.1': 'node-1-1',
        '1.2': 'node-1-2',
        '2': 'node-2',
        '2.1': 'node-2-1',
    };
    const context = resolveNx9Context({
        sectionIdMap,
        documentContent: {
            'node-1': { content: 'row 1 center' },
            'node-1-1': { content: 'row 1 child 1' },
            'node-1-2': { content: 'row 1 child 2' },
            'node-2': { content: 'row 2 center' },
            'node-2-1': { content: 'row 2 child 1' },
        },
        rowsPerPage: 2,
        activeSection: '1',
    });
    const pageFrame = assembleNx9PageFrame({
        context,
        documentState: {
            sections: {
                section_id: sectionIdMap,
            },
        },
    });
    const staticRows = buildNx9PageStaticRows({
        context,
        pageFrame,
        displaySnapshot: {
            sectionColors: {},
            sectionColorOpacity: 100,
            backgroundMode: 'none',
            showDetailSidebar: false,
            whiteThemeMode: false,
        },
        hydratedNodeIds: new Set([
            'node-1',
            'node-1-1',
            'node-1-2',
            'node-2',
            'node-2-1',
        ]),
    });
    const pageIndex = buildNx9PageIndex(pageFrame);

    return {
        context,
        staticRows,
        pageIndex,
    };
};

const buildInteraction = ({
    activeNodeId,
    activeCell,
}: {
    activeNodeId: string | null;
    activeCell: { row: number; col: number; page: number } | null;
}): Nx9InteractionSnapshot => ({
    activeNodeId,
    activeCell,
    activeCellKey: activeCell
        ? `${activeCell.page}:${activeCell.row}:${activeCell.col}`
        : null,
    editingNodeId: null,
    editingInSidebar: false,
    selectedStamp: '',
    pinnedStamp: '',
    showDetailSidebar: false,
});

describe('nx9/assemble-cell-view-model', () => {
    it('patches only the touched row on same-row active movement', () => {
        const { context, staticRows, pageIndex } = createFixture();
        const rows = applyNx9PageInteractionState({
            context,
            staticRows,
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 100,
                backgroundMode: 'none',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
            interactionSnapshot: {
                activeNodeId: 'node-1',
                editingState: { activeNodeId: null, isInSidebar: false },
                selectedNodes: new Set(),
                selectedStamp: '',
                pinnedSections: new Set(),
                pinnedStamp: '',
            },
            activeCell: { row: 0, col: 0, page: 0 },
        });

        const previousRow0 = rows[0] as Nx9RealCellViewModel[];
        const previousRow1 = rows[1] as Nx9RealCellViewModel[];

        const patched = patchNx9ActiveInteractionState({
            rows,
            staticRows,
            pageIndex,
            context,
            previousInteraction: buildInteraction({
                activeNodeId: 'node-1',
                activeCell: { row: 0, col: 0, page: 0 },
            }),
            nextInteraction: buildInteraction({
                activeNodeId: 'node-1-1',
                activeCell: { row: 0, col: 1, page: 0 },
            }),
        });

        const nextRows = patched.rows;
        const nextRow0 = nextRows[0] as Nx9RealCellViewModel[];
        const nextRow1 = nextRows[1] as Nx9RealCellViewModel[];

        expect(patched.changedRowCount).toBe(1);
        expect(patched.changedCellCount).toBe(2);
        expect(nextRow0).not.toBe(previousRow0);
        expect(nextRow1).toBe(previousRow1);
        expect(nextRow0[0]).not.toBe(previousRow0[0]);
        expect(nextRow0[1]).not.toBe(previousRow0[1]);
        expect(nextRow0[2]).toBe(previousRow0[2]);
        expect(nextRow0[0].cardViewModel).toBe(previousRow0[0].cardViewModel);
        expect(nextRow0[1].cardViewModel).toBe(previousRow0[1].cardViewModel);
    });

    it('patches both touched rows on cross-row active movement', () => {
        const { context, staticRows, pageIndex } = createFixture();
        const rows = applyNx9PageInteractionState({
            context,
            staticRows,
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 100,
                backgroundMode: 'none',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
            interactionSnapshot: {
                activeNodeId: 'node-1',
                editingState: { activeNodeId: null, isInSidebar: false },
                selectedNodes: new Set(),
                selectedStamp: '',
                pinnedSections: new Set(),
                pinnedStamp: '',
            },
            activeCell: { row: 0, col: 0, page: 0 },
        });

        const previousRow0 = rows[0] as Nx9RealCellViewModel[];
        const previousRow1 = rows[1] as Nx9RealCellViewModel[];

        const patched = patchNx9ActiveInteractionState({
            rows,
            staticRows,
            pageIndex,
            context,
            previousInteraction: buildInteraction({
                activeNodeId: 'node-1',
                activeCell: { row: 0, col: 0, page: 0 },
            }),
            nextInteraction: buildInteraction({
                activeNodeId: 'node-2',
                activeCell: { row: 1, col: 0, page: 0 },
            }),
        });

        const nextRows = patched.rows;

        expect(patched.changedRowCount).toBe(2);
        expect(patched.changedCellCount).toBe(2);
        expect(nextRows[0]).not.toBe(previousRow0);
        expect(nextRows[1]).not.toBe(previousRow1);
    });

    it('applies selection state in the full interaction pass', () => {
        const { context, staticRows } = createFixture();
        const rows = applyNx9PageInteractionState({
            context,
            staticRows,
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 100,
                backgroundMode: 'none',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
            interactionSnapshot: {
                activeNodeId: 'node-1',
                editingState: { activeNodeId: null, isInSidebar: false },
                selectedNodes: new Set(['node-1-1']),
                selectedStamp: '',
                pinnedSections: new Set(['2']),
                pinnedStamp: '',
            },
            activeCell: { row: 0, col: 0, page: 0 },
        });
        const firstRow = rows[0] as Nx9RealCellViewModel[];
        const secondRow = rows[1] as Nx9RealCellViewModel[];

        expect(firstRow[1].cardUiState.selected).toBe(true);
        expect(firstRow[0].cardUiState.selected).toBe(false);
        expect(secondRow[0].cardUiState.pinned).toBe(true);
    });

    it('builds reusable static card descriptors for a real nx9 row', () => {
        const { context } = createFixture();
        const pageFrame = assembleNx9PageFrame({
            context,
            documentState: {
                sections: {
                    section_id: {
                        '1': 'node-1',
                        '1.1': 'node-1-1',
                        '1.2': 'node-1-2',
                        '2': 'node-2',
                        '2.1': 'node-2-1',
                    },
                },
            },
        });
        const realRow = pageFrame[0] as Extract<Nx9PageFrameRowViewModel, unknown[]>;
        const descriptors = buildNx9StaticCardCellDescriptors({
            row: realRow,
            backgroundMode: 'none',
            sectionColors: { '1.1': 'red' },
            sectionColorOpacity: 100,
            displayPolicy: createDefaultCellDisplayPolicy(),
            hydratedNodeIds: new Set(['node-1', 'node-1-1']),
        });

        expect(descriptors[0]).toMatchObject({
            seed: {
                frame: {
                    section: '1',
                    nodeId: 'node-1',
                },
                descriptor: {
                    contentEnabled: true,
                },
            },
        });
        expect(descriptors[1]).toMatchObject({
            seed: {
                frame: {
                    section: '1.1',
                    nodeId: 'node-1-1',
                },
                descriptor: {
                    metaAccentColor: 'red',
                    contentEnabled: true,
                },
            },
        });
        expect(descriptors[2]).toMatchObject({
            seed: {
                descriptor: {
                    contentEnabled: false,
                },
            },
        });
    });
});
