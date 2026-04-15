import type { Nx9PageContext } from 'src/mandala-scenes/view-nx9/context';
import { describe, expect, it, vi } from 'vitest';
import { createNx9PageRuntime } from 'src/mandala-scenes/view-nx9/page-runtime';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';

const nx9GridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
});

const createContext = (page: number): Nx9PageContext => ({
    currentPage: page,
    rowsPerPage: 5,
    totalPages: 2,
    coreSections: ['1', '2'],
    effectiveCoreSections: ['1', '2'],
    pageRows: [{ kind: 'real-core-row', coreSection: page === 0 ? '1' : '2' }],
    sectionForCell: (row: number, col: number, requestedPage = page) =>
        row === 0
            ? col === 0
                ? `${requestedPage + 1}`
                : `${requestedPage + 1}.${col}`
            : null,
    posForSection: (_section: string | null | undefined) => ({
        row: 0,
        col: 0,
        page,
    }),
    isAddressableCell: () => true,
    isGhostCreateCell: () => false,
    isSelectableCell: () => true,
});

describe('nx9-page-runtime', () => {
    it('reuses cached page frame and page index for the same inputs', () => {
        const runtime = createNx9PageRuntime();
        const sectionIdMap = { '1': 'node-1', '1.1': 'node-1-1' };
        const context = createContext(0);
        const pageFrame = runtime.resolvePageFrame({
            page: 0,
            context,
            sectionIdMap,
        });
        const pageIndex = runtime.resolvePageIndex({ page: 0, pageFrame });

        expect(
            runtime.resolvePageFrame({
                page: 0,
                context,
                sectionIdMap,
            }),
        ).toBe(pageFrame);
        expect(runtime.resolvePageIndex({ page: 0, pageFrame })).toBe(pageIndex);
    });

    it('patches active state instead of rebuilding all rows when only active focus changes', () => {
        const recordPerfEvent = vi.fn();
        const runtime = createNx9PageRuntime({ recordPerfEvent });
        const context = createContext(0);
        const pageFrame = runtime.resolvePageFrame({
            page: 0,
            context,
            sectionIdMap: { '1': 'node-1', '1.1': 'node-1-1' },
        });
        const pageIndex = runtime.resolvePageIndex({ page: 0, pageFrame });
        const staticRows = runtime.resolveStaticRows({
            page: 0,
            context,
            pageFrame,
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 0,
                backgroundMode: 'none',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
            gridStyle: nx9GridStyle,
            hydratedNodeIds: new Set(['node-1', 'node-1-1']),
        });

        runtime.resolveRuntimeRows({
            page: 0,
            staticRows,
            pageIndex,
            context,
            interactionSnapshot: {
                activeNodeId: 'node-1',
                editingState: { activeNodeId: null, isInSidebar: false },
                selectedNodes: new Set(),
                showDetailSidebar: false,
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
            draftProjection: null,
        });

        runtime.resolveRuntimeRows({
            page: 0,
            staticRows,
            pageIndex,
            context,
            interactionSnapshot: {
                activeNodeId: 'node-1-1',
                editingState: { activeNodeId: null, isInSidebar: false },
                selectedNodes: new Set(),
                showDetailSidebar: false,
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
            draftProjection: null,
        });

        expect(
            recordPerfEvent.mock.calls.some(
                ([eventName]) => eventName === 'trace.nx9.patch-active-state',
            ),
        ).toBe(true);
    });

    it('prewarms adjacent pages and reuses cached rows when a neighbor becomes current', () => {
        const runtime = createNx9PageRuntime();
        const page0Context = createContext(0);
        const page1Context = createContext(1);
        const sectionIdMap = {
            '1': 'node-1',
            '1.1': 'node-1-1',
            '2': 'node-2',
            '2.1': 'node-2-1',
        };
        const displaySnapshot = {
            sectionColors: {},
            sectionColorOpacity: 0,
            backgroundMode: 'none' as const,
            showDetailSidebar: false,
            whiteThemeMode: false,
        };
        const interactionSnapshot = {
            activeNodeId: 'node-1',
            editingState: { activeNodeId: null, isInSidebar: false },
            selectedNodes: new Set<string>(),
            showDetailSidebar: false,
            selectedStamp: '',
            pinnedSections: new Set<string>(),
            pinnedStamp: '',
        };

        runtime.prewarmPages({
            pages: [
                {
                    page: 0,
                    context: page0Context,
                    sectionIdMap,
                    hydratedNodeIds: new Set(['node-1', 'node-1-1']),
                },
                {
                    page: 1,
                    context: page1Context,
                    sectionIdMap,
                    hydratedNodeIds: new Set(['node-2', 'node-2-1']),
                },
            ],
            displaySnapshot,
            gridStyle: nx9GridStyle,
            interactionSnapshot,
            activeCell: { row: 0, col: 0, page: 0 },
            draftProjection: null,
        });

        const page1Frame = runtime.resolvePageFrame({
            page: 1,
            context: page1Context,
            sectionIdMap,
        });
        const page1Index = runtime.resolvePageIndex({
            page: 1,
            pageFrame: page1Frame,
        });
        const page1StaticRows = runtime.resolveStaticRows({
            page: 1,
            context: page1Context,
            pageFrame: page1Frame,
            displaySnapshot,
            gridStyle: nx9GridStyle,
            hydratedNodeIds: new Set(['node-2', 'node-2-1']),
        });
        const firstRows = runtime.resolveRuntimeRows({
            page: 1,
            staticRows: page1StaticRows,
            pageIndex: page1Index,
            context: page1Context,
            interactionSnapshot,
            activeCell: { row: 0, col: 0, page: 0 },
            displaySnapshot,
            draftProjection: null,
        });
        const secondRows = runtime.resolveRuntimeRows({
            page: 1,
            staticRows: page1StaticRows,
            pageIndex: page1Index,
            context: page1Context,
            interactionSnapshot,
            activeCell: { row: 0, col: 0, page: 0 },
            displaySnapshot,
            draftProjection: null,
        });

        expect(secondRows).toBe(firstRows);
    });

    it('evicts pages outside the active hot window during prewarm', () => {
        const runtime = createNx9PageRuntime();
        const page0Context = createContext(0);
        const page1Context = createContext(1);
        const sectionIdMap = {
            '1': 'node-1',
            '1.1': 'node-1-1',
            '2': 'node-2',
            '2.1': 'node-2-1',
        };
        const displaySnapshot = {
            sectionColors: {},
            sectionColorOpacity: 0,
            backgroundMode: 'none' as const,
            showDetailSidebar: false,
            whiteThemeMode: false,
        };
        const interactionSnapshot = {
            activeNodeId: 'node-1',
            editingState: { activeNodeId: null, isInSidebar: false },
            selectedNodes: new Set<string>(),
            showDetailSidebar: false,
            selectedStamp: '',
            pinnedSections: new Set<string>(),
            pinnedStamp: '',
        };
        const originalPage0Frame = runtime.resolvePageFrame({
            page: 0,
            context: page0Context,
            sectionIdMap,
        });

        runtime.prewarmPages({
            pages: [
                {
                    page: 0,
                    context: page0Context,
                    sectionIdMap,
                    hydratedNodeIds: new Set(['node-1', 'node-1-1']),
                },
                {
                    page: 1,
                    context: page1Context,
                    sectionIdMap,
                    hydratedNodeIds: new Set(['node-2', 'node-2-1']),
                },
            ],
            displaySnapshot,
            gridStyle: nx9GridStyle,
            interactionSnapshot,
            activeCell: { row: 0, col: 0, page: 0 },
            draftProjection: null,
        });

        runtime.prewarmPages({
            pages: [
                {
                    page: 1,
                    context: page1Context,
                    sectionIdMap,
                    hydratedNodeIds: new Set(['node-2', 'node-2-1']),
                },
            ],
            displaySnapshot,
            gridStyle: nx9GridStyle,
            interactionSnapshot,
            activeCell: { row: 0, col: 0, page: 1 },
            draftProjection: null,
        });

        const rebuiltPage0Frame = runtime.resolvePageFrame({
            page: 0,
            context: page0Context,
            sectionIdMap,
        });

        expect(rebuiltPage0Frame).not.toBe(originalPage0Frame);
    });

    it('patches draft content without triggering full ui apply', () => {
        const recordPerfEvent = vi.fn();
        const runtime = createNx9PageRuntime({ recordPerfEvent });
        const context = createContext(0);
        const pageFrame = runtime.resolvePageFrame({
            page: 0,
            context,
            sectionIdMap: { '1': 'node-1', '1.1': 'node-1-1' },
        });
        const pageIndex = runtime.resolvePageIndex({ page: 0, pageFrame });
        const staticRows = runtime.resolveStaticRows({
            page: 0,
            context,
            pageFrame,
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 0,
                backgroundMode: 'none',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
            gridStyle: nx9GridStyle,
            hydratedNodeIds: new Set(['node-1', 'node-1-1']),
        });
        const interactionSnapshot = {
            activeNodeId: 'node-1',
            editingState: { activeNodeId: null, isInSidebar: false },
            selectedNodes: new Set<string>(),
            showDetailSidebar: false,
            selectedStamp: '',
            pinnedSections: new Set<string>(),
            pinnedStamp: '',
        };
        const displaySnapshot = {
            sectionColors: {},
            sectionColorOpacity: 0,
            backgroundMode: 'none' as const,
            showDetailSidebar: false,
            whiteThemeMode: false,
        };

        const previousRows = runtime.resolveRuntimeRows({
            page: 0,
            staticRows,
            pageIndex,
            context,
            interactionSnapshot,
            activeCell: { row: 0, col: 0, page: 0 },
            displaySnapshot,
            draftProjection: null,
        });
        const fullApplyCount = recordPerfEvent.mock.calls.filter(
            ([eventName]) => eventName === 'trace.nx9.apply-ui-full',
        ).length;

        const nextRows = runtime.resolveRuntimeRows({
            page: 0,
            staticRows,
            pageIndex,
            context,
            interactionSnapshot,
            activeCell: { row: 0, col: 0, page: 0 },
            displaySnapshot,
            draftProjection: {
                nodeId: 'node-1',
                content: 'draft content',
                revision: 1,
            },
        });

        const previousRow = previousRows[0] as Array<{
            cardViewModel: { contentOverride?: string };
        }>;
        const nextRow = nextRows[0] as Array<{
            cardViewModel: { contentOverride?: string };
        }>;

        expect(nextRows).not.toBe(previousRows);
        expect(nextRow).not.toBe(previousRow);
        expect(nextRow[0]).not.toBe(previousRow[0]);
        expect(nextRow[1]).toBe(previousRow[1]);
        expect(nextRow[0].cardViewModel.contentOverride).toBe('draft content');
        expect(
            recordPerfEvent.mock.calls.some(
                ([eventName]) => eventName === 'trace.nx9.patch-draft-state',
            ),
        ).toBe(true);
        expect(
            recordPerfEvent.mock.calls.filter(
                ([eventName]) => eventName === 'trace.nx9.apply-ui-full',
            ).length,
        ).toBe(fullApplyCount);
    });

    it('keeps runtime rows reference when draft node is outside current page', () => {
        const runtime = createNx9PageRuntime();
        const context = createContext(1);
        const pageFrame = runtime.resolvePageFrame({
            page: 1,
            context,
            sectionIdMap: { '2': 'node-2', '2.1': 'node-2-1' },
        });
        const pageIndex = runtime.resolvePageIndex({ page: 1, pageFrame });
        const staticRows = runtime.resolveStaticRows({
            page: 1,
            context,
            pageFrame,
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 0,
                backgroundMode: 'none',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
            gridStyle: nx9GridStyle,
            hydratedNodeIds: new Set(['node-2', 'node-2-1']),
        });
        const interactionSnapshot = {
            activeNodeId: 'node-2',
            editingState: { activeNodeId: null, isInSidebar: false },
            selectedNodes: new Set<string>(),
            showDetailSidebar: false,
            selectedStamp: '',
            pinnedSections: new Set<string>(),
            pinnedStamp: '',
        };
        const displaySnapshot = {
            sectionColors: {},
            sectionColorOpacity: 0,
            backgroundMode: 'none' as const,
            showDetailSidebar: false,
            whiteThemeMode: false,
        };

        const previousRows = runtime.resolveRuntimeRows({
            page: 1,
            staticRows,
            pageIndex,
            context,
            interactionSnapshot,
            activeCell: { row: 0, col: 0, page: 1 },
            displaySnapshot,
            draftProjection: null,
        });
        const nextRows = runtime.resolveRuntimeRows({
            page: 1,
            staticRows,
            pageIndex,
            context,
            interactionSnapshot,
            activeCell: { row: 0, col: 0, page: 1 },
            displaySnapshot,
            draftProjection: {
                nodeId: 'node-1',
                content: 'off-page draft',
                revision: 1,
            },
        });

        expect(nextRows).toBe(previousRows);
    });
});
