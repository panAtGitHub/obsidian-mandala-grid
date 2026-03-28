import { describe, expect, it } from 'vitest';
import { assembleDesktopWeekPlanCells } from 'src/mandala-scenes/view-7x9/assemble-cell-view-model';
import type { WeekPlanRow } from 'src/mandala-display/logic/day-plan';

const rows: WeekPlanRow[] = [
    {
        date: '2026-03-23',
        coreSection: '42',
        inPlanYear: true,
    },
    {
        date: '2026-03-24',
        coreSection: '43',
        inPlanYear: true,
    },
    {
        date: '2026-03-25',
        coreSection: '44',
        inPlanYear: true,
    },
    {
        date: '2026-03-26',
        coreSection: '45',
        inPlanYear: true,
    },
    {
        date: '2026-03-27',
        coreSection: '46',
        inPlanYear: true,
    },
    {
        date: '2026-03-28',
        coreSection: '47',
        inPlanYear: true,
    },
    {
        date: '2026-03-29',
        coreSection: '48',
        inPlanYear: true,
    },
];

describe('assemble-desktop-week-plan-cells', () => {
    it('builds desktop cells through shared card scene output', () => {
        const cells = assembleDesktopWeekPlanCells({
            rows,
            sectionIdMap: {
                '42': 'node-42',
                '42.1': 'node-42.1',
            },
            activeNodeId: 'node-42',
            activeCell: { row: 0, col: 0 },
            compactMode: false,
            editingState: {
                activeNodeId: 'node-42',
                isInSidebar: false,
            },
            selectedNodes: new Set(['node-42']),
            pinnedSections: new Set(['42']),
            sectionColors: { '42': '#111111' },
            sectionColorOpacity: 60,
            backgroundMode: 'custom',
            showDetailSidebar: false,
            whiteThemeMode: false,
        });

        expect(cells[0]).toMatchObject({
            key: '0:0',
            section: '42',
            nodeId: 'node-42',
            row: 0,
            col: 0,
            isActiveCell: true,
            isActiveNode: false,
            cardUiState: {
                active: true,
                editing: true,
                selected: true,
                pinned: true,
            },
        });
        expect(cells[0]?.cardViewModel?.nodeId).toBe('node-42');
        expect(cells[1]).toMatchObject({
            key: '0:1',
            section: '42.1',
            nodeId: 'node-42.1',
            row: 0,
            col: 1,
            isCenterColumn: false,
        });
    });
});
