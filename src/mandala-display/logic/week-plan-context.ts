import {
    mapWeekPlanRows,
    parseDayPlanFrontmatter,
    posOfSectionWeek7x9,
    sectionAtCellWeek7x9,
    type WeekPlanRow,
} from 'src/mandala-display/logic/day-plan';
import type { WeekStart } from 'src/mandala-settings/state/settings-type';

export type WeekPlanCellPosition = { row: number; col: number };
export type WeekPlanBaseCell = {
    row: number;
    col: number;
    section: string | null;
    nodeId: string | null;
    isPlaceholder: boolean;
    isCenterColumn: boolean;
    emptyLabel: string | null;
};

export type WeekPlanContext = {
    dayPlan: ReturnType<typeof parseDayPlanFrontmatter>;
    anchorDate: string;
    rows: WeekPlanRow[];
    sectionForCell: (row: number, col: number) => string | null;
    posForSection: (
        section: string | null | undefined,
    ) => WeekPlanCellPosition | null;
};

export const getDefaultWeekAnchorDate = (today: Date = new Date()) =>
    today.toISOString().slice(0, 10);

export const resolveWeekPlanContext = ({
    frontmatter,
    anchorDate,
    weekStart,
    today,
}: {
    frontmatter: string;
    anchorDate: string | null | undefined;
    weekStart: WeekStart;
    today?: Date;
}): WeekPlanContext => {
    const dayPlan = parseDayPlanFrontmatter(frontmatter);
    const resolvedAnchorDate = anchorDate ?? getDefaultWeekAnchorDate(today);
    const rows = dayPlan
        ? mapWeekPlanRows(dayPlan.year, resolvedAnchorDate, weekStart)
        : [];

    return {
        dayPlan,
        anchorDate: resolvedAnchorDate,
        rows,
        sectionForCell: (row, col) => sectionAtCellWeek7x9(row, col, rows),
        posForSection: (section) =>
            section ? posOfSectionWeek7x9(section, rows) : null,
    };
};

export const resolveWeekPlanCurrentCell = ({
    activeCell,
    activeSection,
    rows,
}: {
    activeCell: WeekPlanCellPosition | null | undefined;
    activeSection: string | null | undefined;
    rows: WeekPlanRow[];
}): WeekPlanCellPosition => {
    if (activeCell) return activeCell;
    if (activeSection) {
        const pos = posOfSectionWeek7x9(activeSection, rows);
        if (pos) return pos;
    }
    return { row: 0, col: 0 };
};

export const buildWeekPlanBaseCells = ({
    rows,
    sectionIdMap,
}: {
    rows: WeekPlanRow[];
    sectionIdMap: Record<string, string | undefined>;
}): WeekPlanBaseCell[] => {
    const cells: WeekPlanBaseCell[] = [];
    for (let row = 0; row < 7; row += 1) {
        const rowModel = rows[row] ?? {
            date: '',
            coreSection: null,
            inPlanYear: false,
        };
        for (let col = 0; col < 9; col += 1) {
            const section = sectionAtCellWeek7x9(row, col, rows);
            const nodeId = section ? sectionIdMap[section] ?? null : null;
            cells.push({
                row,
                col,
                section,
                nodeId,
                isPlaceholder: !rowModel.inPlanYear,
                isCenterColumn: col === 0,
                emptyLabel: !rowModel.inPlanYear ? '超出本年' : null,
            });
        }
    }
    return cells;
};
