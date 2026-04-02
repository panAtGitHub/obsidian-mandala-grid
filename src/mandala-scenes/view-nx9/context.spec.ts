import { describe, expect, it } from 'vitest';
import {
    buildNx9PageRows,
    buildNx9Rows,
    collectEffectiveNx9CoreSections,
    collectNx9CoreSections,
    getNx9TotalPages,
    posOfSectionNx9,
    resolveNx9Context,
    resolveNx9CurrentCell,
    resolveNx9PageNavigationTarget,
    sectionAtCellNx9,
} from 'src/mandala-scenes/view-nx9/context';

describe('nx9/context', () => {
    it('collects actual top-level core sections in numeric order', () => {
        expect(
            collectNx9CoreSections({
                '10': 'node-10',
                '2': 'node-2',
                '1': 'node-1',
                '2.1': 'node-2-1',
                '11': undefined,
            }),
        ).toEqual(['1', '2', '10']);
    });

    it('ignores trailing empty core sections when resolving effective rows', () => {
        expect(
            collectEffectiveNx9CoreSections({
                sectionIdMap: {
                    '1': 'node-1',
                    '2': 'node-2',
                    '3': 'node-3',
                    '3.1': 'node-3-1',
                },
                documentContent: {
                    'node-1': { content: 'filled' },
                    'node-2': { content: 'filled' },
                    'node-3': { content: '' },
                    'node-3-1': { content: '' },
                },
            }),
        ).toEqual(['1', '2']);
    });

    it('builds real rows plus a single ghost row and pads the last page', () => {
        const rows = buildNx9Rows(['1', '2', '3', '4']);

        expect(getNx9TotalPages(rows.length, 2)).toBe(3);
        expect(
            buildNx9PageRows({
                rows,
                rowsPerPage: 2,
                page: 2,
            }),
        ).toEqual([
            { kind: 'ghost-next-core-row', nextCoreSection: '5' },
            { kind: 'padding-row' },
        ]);
    });

    it('hides ghost next-core row when core range reaches max', () => {
        const rows = buildNx9Rows(['1', '2', '3', '4'], 4);
        expect(rows).toEqual([
            { kind: 'real-core-row', coreSection: '1' },
            { kind: 'real-core-row', coreSection: '2' },
            { kind: 'real-core-row', coreSection: '3' },
            { kind: 'real-core-row', coreSection: '4' },
        ]);
    });

    it('maps sections by depth to nx9 positions', () => {
        const coreSections = ['1', '2', '3', '4', '5'];

        expect(posOfSectionNx9('4', coreSections, 3)).toEqual({
            page: 1,
            row: 0,
            col: 0,
        });
        expect(posOfSectionNx9('4.2', coreSections, 3)).toEqual({
            page: 1,
            row: 0,
            col: 2,
        });
        expect(posOfSectionNx9('4.2.7', coreSections, 3)).toEqual({
            page: 1,
            row: 0,
            col: 0,
        });
    });

    it('treats empty child slots on real rows as addressable and selectable cells', () => {
        const context = resolveNx9Context({
            sectionIdMap: {
                '1': 'node-1',
                '2': 'node-2',
            },
            documentContent: {
                'node-1': { content: 'filled' },
                'node-2': { content: 'filled' },
            },
            rowsPerPage: 2,
            activeSection: '2',
        });

        expect(sectionAtCellNx9(1, 8, context.pageRows)).toBe('2.8');
        expect(context.isAddressableCell(1, 8, 0)).toBe(true);
        expect(context.isSelectableCell(1, 8, 0)).toBe(true);
        expect(context.sectionForCell(0, 1, 1)).toBeNull();
        expect(context.isGhostCreateCell(0, 0, 1)).toBe(true);
        expect(context.isSelectableCell(0, 1, 1)).toBe(false);
    });

    it('preserves a ghost-only page when the active cell carries page state', () => {
        const context = resolveNx9Context({
            sectionIdMap: {
                '1': 'node-1',
                '2': 'node-2',
            },
            documentContent: {
                'node-1': { content: 'filled' },
                'node-2': { content: 'filled' },
            },
            rowsPerPage: 2,
            activeSection: '2',
            activeCell: { row: 0, col: 0, page: 1 },
        });

        expect(context.currentPage).toBe(1);
        expect(context.pageRows[0]).toEqual({
            kind: 'ghost-next-core-row',
            nextCoreSection: '3',
        });
    });

    it('sends the ghost row to a new page when the current page is full', () => {
        const context = resolveNx9Context({
            sectionIdMap: {
                '1': 'node-1',
                '2': 'node-2',
                '3': 'node-3',
                '4': 'node-4',
            },
            documentContent: {
                'node-1': { content: 'filled' },
                'node-2': { content: 'filled' },
                'node-3': { content: 'filled' },
                'node-4': { content: 'filled' },
            },
            rowsPerPage: 2,
            activeSection: '4',
            activeCell: { row: 0, col: 0, page: 2 },
        });

        expect(context.totalPages).toBe(3);
        expect(context.pageRows[0]).toEqual({
            kind: 'ghost-next-core-row',
            nextCoreSection: '5',
        });
    });

    it('falls back to the ghost create cell when changing into a ghost-only page', () => {
        const sectionIdMap = {
            '1': 'node-1',
            '2': 'node-2',
        };
        const context = resolveNx9Context({
            sectionIdMap,
            documentContent: {
                'node-1': { content: 'filled' },
                'node-2': { content: 'filled' },
            },
            rowsPerPage: 2,
            activeSection: '2',
        });

        expect(
            resolveNx9PageNavigationTarget({
                context,
                page: 1,
                preferredCol: 4,
            }),
        ).toEqual({
            page: 1,
            row: 0,
            col: 0,
        });
    });

    it('keeps a virtual child cell as the current cell when it is selectable', () => {
        const context = resolveNx9Context({
            sectionIdMap: {
                '1': 'node-1',
                '6': 'node-6',
            },
            documentContent: {
                'node-1': { content: 'filled' },
                'node-6': { content: 'filled' },
            },
            rowsPerPage: 6,
            activeSection: '6',
            activeCell: { row: 1, col: 3, page: 0 },
        });

        expect(
            resolveNx9CurrentCell({
                activeCell: { row: 1, col: 3, page: 0 },
                activeSection: '6',
                context,
            }),
        ).toEqual({
            page: 0,
            row: 1,
            col: 3,
        });
    });

    it('prefers empty child slots when changing to a page with real rows', () => {
        const context = resolveNx9Context({
            sectionIdMap: {
                '1': 'node-1',
                '2': 'node-2',
                '3': 'node-3',
                '4': 'node-4',
            },
            documentContent: {
                'node-1': { content: 'filled' },
                'node-2': { content: 'filled' },
                'node-3': { content: 'filled' },
                'node-4': { content: 'filled' },
            },
            rowsPerPage: 2,
            activeSection: '2',
        });

        expect(
            resolveNx9PageNavigationTarget({
                context,
                page: 1,
                preferredCol: 4,
            }),
        ).toEqual({
            page: 1,
            row: 0,
            col: 4,
        });
    });
});
