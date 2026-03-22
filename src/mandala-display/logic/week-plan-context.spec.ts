import { describe, expect, it } from 'vitest';
import {
    buildWeekPlanBaseCells,
    getDefaultWeekAnchorDate,
    resolveWeekPlanContext,
    resolveWeekPlanCurrentCell,
} from 'src/mandala-display/logic/week-plan-context';

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

describe('week-plan-context', () => {
    it('uses today when anchor date is missing', () => {
        expect(
            getDefaultWeekAnchorDate(new Date('2026-03-18T08:00:00.000Z')),
        ).toBe('2026-03-18');

        const context = resolveWeekPlanContext({
            frontmatter,
            anchorDate: null,
            weekStart: 'monday',
            today: new Date('2026-03-18T08:00:00.000Z'),
        });

        expect(context.anchorDate).toBe('2026-03-18');
        expect(context.rows[0]?.date).toBe('2026-03-16');
    });

    it('maps week rows and section positions consistently', () => {
        const context = resolveWeekPlanContext({
            frontmatter,
            anchorDate: '2026-03-18',
            weekStart: 'monday',
        });

        expect(context.sectionForCell(0, 0)).toBe('75');
        expect(context.sectionForCell(0, 4)).toBe('75.4');
        expect(context.posForSection('75.4')).toEqual({ row: 0, col: 4 });
    });

    it('keeps cross-year rows as placeholders', () => {
        const context = resolveWeekPlanContext({
            frontmatter,
            anchorDate: '2026-12-31',
            weekStart: 'monday',
        });

        expect(context.rows[5]?.inPlanYear).toBe(false);
        expect(context.sectionForCell(5, 0)).toBeNull();
    });

    it('resolves current cell from active cell or section', () => {
        const context = resolveWeekPlanContext({
            frontmatter,
            anchorDate: '2026-03-18',
            weekStart: 'monday',
        });

        expect(
            resolveWeekPlanCurrentCell({
                activeCell: { row: 2, col: 1 },
                activeSection: '75.4',
                rows: context.rows,
            }),
        ).toEqual({ row: 2, col: 1 });

        expect(
            resolveWeekPlanCurrentCell({
                activeCell: null,
                activeSection: '75.4',
                rows: context.rows,
            }),
        ).toEqual({ row: 0, col: 4 });
    });

    it('builds base cells with placeholder state and node ids', () => {
        const context = resolveWeekPlanContext({
            frontmatter,
            anchorDate: '2026-03-18',
            weekStart: 'monday',
        });
        const cells = buildWeekPlanBaseCells({
            rows: context.rows,
            sectionIdMap: {
                '75': 'node-75',
                '75.1': 'node-75-1',
            },
        });

        expect(cells).toHaveLength(63);
        expect(cells[0]).toMatchObject({
            row: 0,
            col: 0,
            section: '75',
            nodeId: 'node-75',
            isPlaceholder: false,
            isCenterColumn: true,
        });
        expect(cells[1]).toMatchObject({
            row: 0,
            col: 1,
            section: '75.1',
            nodeId: 'node-75-1',
            isCenterColumn: false,
        });
    });
});
