import { describe, expect, it } from 'vitest';
import {
    buildNx9PageRows,
    collectNx9CoreSections,
    getNx9TotalPages,
    posOfSectionNx9,
    resolveNx9Context,
    resolveNx9PageNavigationTarget,
    sectionAtCellNx9,
} from 'src/view/helpers/mandala/nx9-context';

describe('nx9-context', () => {
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

    it('builds paged rows and pads the last page', () => {
        const coreSections = [
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
        ];

        expect(getNx9TotalPages(coreSections, 3)).toBe(4);
        expect(
            buildNx9PageRows({
                coreSections,
                rowsPerPage: 3,
                page: 0,
            }),
        ).toEqual(['1', '2', '3']);
        expect(
            buildNx9PageRows({
                coreSections,
                rowsPerPage: 3,
                page: 3,
            }),
        ).toEqual(['10', null, null]);
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

    it('uses fixed child columns 1 through 8', () => {
        expect(sectionAtCellNx9(1, 8, ['1', '2', '3'])).toBe('2.8');
    });

    it('derives the current page from the active section', () => {
        const context = resolveNx9Context({
            sectionIdMap: {
                '1': 'node-1',
                '2': 'node-2',
                '3': 'node-3',
                '4': 'node-4',
                '5': 'node-5',
            },
            rowsPerPage: 2,
            activeSection: '5.6',
        });

        expect(context.currentPage).toBe(2);
        expect(context.pageRows).toEqual(['5', null]);
        expect(context.posForSection('5.6')).toEqual({
            page: 2,
            row: 0,
            col: 6,
        });
    });

    it('preserves the preferred column on page navigation when possible', () => {
        const sectionIdMap = {
            '1': 'node-1',
            '2': 'node-2',
            '3': 'node-3',
            '4': 'node-4',
            '4.4': 'node-4-4',
            '5': 'node-5',
            '6': 'node-6',
        };
        const context = resolveNx9Context({
            sectionIdMap,
            rowsPerPage: 3,
            activeSection: '2.4',
        });

        expect(
            resolveNx9PageNavigationTarget({
                context,
                page: 1,
                preferredCol: 4,
                sectionIdMap,
            }),
        ).toEqual({
            page: 1,
            row: 0,
            col: 4,
        });
    });

    it('falls back to the first populated cell when the preferred column is empty', () => {
        const sectionIdMap = {
            '1': 'node-1',
            '2': 'node-2',
            '3': 'node-3',
            '4': 'node-4',
            '5': 'node-5',
            '5.2': 'node-5-2',
            '6': 'node-6',
        };
        const context = resolveNx9Context({
            sectionIdMap,
            rowsPerPage: 3,
            activeSection: '2.4',
        });

        expect(
            resolveNx9PageNavigationTarget({
                context,
                page: 1,
                preferredCol: 4,
                sectionIdMap,
            }),
        ).toEqual({
            page: 1,
            row: 0,
            col: 0,
        });
    });
});
