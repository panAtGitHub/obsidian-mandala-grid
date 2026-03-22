import { describe, expect, it } from 'vitest';
import { resolveCellPreviewNodeId } from 'src/mandala-interaction/helpers/resolve-cell-preview-node-id';

const frontmatter = `---
mandala: true
mandala_plan:
  enabled: true
  year: 2026
  daily_only_3x3: false
  slots:
    "1": one
    "2": two
    "3": three
    "4": four
    "5": five
    "6": six
    "7": seven
    "8": eight
---
`;

describe('resolve-cell-preview-node-id', () => {
    it('uses the active node in 3x3 mode', () => {
        expect(
            resolveCellPreviewNodeId({
                mode: '3x3',
                activeNodeId: 'node-1',
                activeNodeSection: '1',
                activeCell9x9: null,
                activeCellNx9: null,
                activeCellWeek7x9: null,
                sectionIdMap: {},
                documentContent: {},
                nx9RowsPerPage: 3,
                selectedLayoutId: 'builtin:left-to-right',
                customLayouts: [],
                frontmatter: '',
                weekAnchorDate: null,
                weekStart: 'monday',
            }),
        ).toBe('node-1');
    });

    it('prefers the active 9x9 cell and falls back to the active node', () => {
        expect(
            resolveCellPreviewNodeId({
                mode: '9x9',
                activeNodeId: 'fallback-node',
                activeNodeSection: '2.4',
                activeCell9x9: { row: 0, col: 0 },
                activeCellNx9: null,
                activeCellWeek7x9: null,
                sectionIdMap: {
                    '2.1.1': 'cell-node',
                },
                documentContent: {},
                nx9RowsPerPage: 3,
                selectedLayoutId: 'builtin:left-to-right',
                customLayouts: [],
                frontmatter: '',
                weekAnchorDate: null,
                weekStart: 'monday',
            }),
        ).toBe('cell-node');

        expect(
            resolveCellPreviewNodeId({
                mode: '9x9',
                activeNodeId: 'fallback-node',
                activeNodeSection: '2.4',
                activeCell9x9: { row: 0, col: 0 },
                activeCellNx9: null,
                activeCellWeek7x9: null,
                sectionIdMap: {},
                documentContent: {},
                nx9RowsPerPage: 3,
                selectedLayoutId: 'builtin:left-to-right',
                customLayouts: [],
                frontmatter: '',
                weekAnchorDate: null,
                weekStart: 'monday',
            }),
        ).toBe('fallback-node');
    });

    it('prefers the active nx9 cell and falls back to the active node', () => {
        expect(
            resolveCellPreviewNodeId({
                mode: 'nx9',
                activeNodeId: 'fallback-node',
                activeNodeSection: '4.5',
                activeCell9x9: null,
                activeCellNx9: { row: 0, col: 3 },
                activeCellWeek7x9: null,
                sectionIdMap: {
                    '4': 'core-node',
                    '4.3': 'nx9-cell-node',
                },
                documentContent: {
                    'core-node': { content: 'filled' },
                    'nx9-cell-node': { content: 'filled' },
                },
                nx9RowsPerPage: 3,
                selectedLayoutId: 'builtin:left-to-right',
                customLayouts: [],
                frontmatter: '',
                weekAnchorDate: null,
                weekStart: 'monday',
            }),
        ).toBe('nx9-cell-node');

        expect(
            resolveCellPreviewNodeId({
                mode: 'nx9',
                activeNodeId: 'fallback-node',
                activeNodeSection: '4.5',
                activeCell9x9: null,
                activeCellNx9: { row: 0, col: 3 },
                activeCellWeek7x9: null,
                sectionIdMap: {
                    '4': 'core-node',
                },
                documentContent: {
                    'core-node': { content: 'filled' },
                },
                nx9RowsPerPage: 3,
                selectedLayoutId: 'builtin:left-to-right',
                customLayouts: [],
                frontmatter: '',
                weekAnchorDate: null,
                weekStart: 'monday',
            }),
        ).toBe('fallback-node');
    });

    it('prefers the active week cell and falls back to the active node', () => {
        expect(
            resolveCellPreviewNodeId({
                mode: 'week-7x9',
                activeNodeId: 'fallback-node',
                activeNodeSection: '75.4',
                activeCell9x9: null,
                activeCellNx9: null,
                activeCellWeek7x9: { row: 0, col: 4 },
                sectionIdMap: {
                    '75.4': 'week-cell-node',
                },
                documentContent: {},
                nx9RowsPerPage: 3,
                selectedLayoutId: 'builtin:left-to-right',
                customLayouts: [],
                frontmatter,
                weekAnchorDate: '2026-03-18',
                weekStart: 'monday',
            }),
        ).toBe('week-cell-node');

        expect(
            resolveCellPreviewNodeId({
                mode: 'week-7x9',
                activeNodeId: 'fallback-node',
                activeNodeSection: '75.4',
                activeCell9x9: null,
                activeCellNx9: null,
                activeCellWeek7x9: { row: 6, col: 0 },
                sectionIdMap: {},
                documentContent: {},
                nx9RowsPerPage: 3,
                selectedLayoutId: 'builtin:left-to-right',
                customLayouts: [],
                frontmatter,
                weekAnchorDate: '2026-03-18',
                weekStart: 'monday',
            }),
        ).toBe('fallback-node');
    });
});
