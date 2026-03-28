import type { Nx9PageContext } from 'src/mandala-scenes/view-nx9/context';
import { describe, expect, it, vi } from 'vitest';
import { createNx9PageRuntime } from 'src/mandala-scenes/view-nx9/page-runtime';

const context: Nx9PageContext = {
    currentPage: 0,
    rowsPerPage: 5,
    totalPages: 1,
    coreSections: ['1'],
    effectiveCoreSections: ['1'],
    pageRows: [{ kind: 'real-core-row', coreSection: '1' }],
    sectionForCell: (row: number, col: number) =>
        row === 0 ? (col === 0 ? '1' : `1.${col}`) : null,
    posForSection: () => ({ row: 0, col: 0, page: 0 }),
    isGhostCreateCell: () => false,
    isSelectableCell: () => true,
};

describe('nx9-page-runtime', () => {
    it('reuses cached page frame and page index for the same inputs', () => {
        const runtime = createNx9PageRuntime();
        const sectionIdMap = { '1': 'node-1', '1.1': 'node-1-1' };
        const pageFrame = runtime.resolvePageFrame({
            context,
            sectionIdMap,
        });
        const pageIndex = runtime.resolvePageIndex({ pageFrame });

        expect(
            runtime.resolvePageFrame({
                context,
                sectionIdMap,
            }),
        ).toBe(pageFrame);
        expect(runtime.resolvePageIndex({ pageFrame })).toBe(pageIndex);
    });

    it('patches active state instead of rebuilding all rows when only active focus changes', () => {
        const recordPerfEvent = vi.fn();
        const runtime = createNx9PageRuntime({ recordPerfEvent });
        const pageFrame = runtime.resolvePageFrame({
            context,
            sectionIdMap: { '1': 'node-1', '1.1': 'node-1-1' },
        });
        const pageIndex = runtime.resolvePageIndex({ pageFrame });
        const staticRows = runtime.resolveStaticRows({
            context,
            pageFrame,
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 0,
                backgroundMode: 'none',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
            hydratedNodeIds: new Set(['node-1', 'node-1-1']),
        });

        runtime.resolveRuntimeRows({
            staticRows,
            pageIndex,
            context,
            interactionSnapshot: {
                activeNodeId: 'node-1',
                editingState: { activeNodeId: null, isInSidebar: false },
                selectedNodes: new Set(),
                selectedStamp: '',
                pinnedSections: new Set(),
                pinnedStamp: '',
            },
            activeCell: { row: 0, col: 0, page: 0 },
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 0,
                backgroundMode: 'none',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
        });

        runtime.resolveRuntimeRows({
            staticRows,
            pageIndex,
            context,
            interactionSnapshot: {
                activeNodeId: 'node-1-1',
                editingState: { activeNodeId: null, isInSidebar: false },
                selectedNodes: new Set(),
                selectedStamp: '',
                pinnedSections: new Set(),
                pinnedStamp: '',
            },
            activeCell: { row: 0, col: 1, page: 0 },
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 0,
                backgroundMode: 'none',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
        });

        expect(
            recordPerfEvent.mock.calls.some(
                ([eventName]) => eventName === 'trace.nx9.patch-active-state',
            ),
        ).toBe(true);
    });
});
