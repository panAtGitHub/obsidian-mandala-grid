import { sectionAtCell9x9 } from 'src/view/helpers/mandala/mandala-grid';
import { resolveWeekPlanContext } from 'src/view/helpers/mandala/week-plan-context';

type CustomLayout = {
    id: string;
    name: string;
    pattern: string;
};

export type ResolveCellPreviewNodeIdArgs = {
    mode: '3x3' | '9x9' | 'week-7x9';
    activeNodeId: string;
    activeNodeSection: string | null;
    activeCell9x9: { row: number; col: number } | null;
    activeCellWeek7x9: { row: number; col: number } | null;
    sectionIdMap: Record<string, string>;
    selectedLayoutId: string;
    customLayouts: CustomLayout[];
    frontmatter: string;
    weekAnchorDate: string | null;
    weekStart: 'monday' | 'sunday';
};

export const resolveCellPreviewNodeId = (
    args: ResolveCellPreviewNodeIdArgs,
) => {
    const {
        mode,
        activeNodeId,
        activeNodeSection,
        activeCell9x9,
        activeCellWeek7x9,
        sectionIdMap,
        selectedLayoutId,
        customLayouts,
        frontmatter,
        weekAnchorDate,
        weekStart,
    } = args;

    if (mode === '3x3') {
        return activeNodeId || null;
    }

    if (mode === '9x9' && activeCell9x9) {
        const baseTheme = activeNodeSection?.split('.')[0] ?? '1';
        const section = sectionAtCell9x9(
            activeCell9x9.row,
            activeCell9x9.col,
            selectedLayoutId,
            baseTheme,
            customLayouts,
        );
        const nodeId = section ? sectionIdMap[section] : null;
        return nodeId || activeNodeId || null;
    }

    if (mode === 'week-7x9' && activeCellWeek7x9) {
        const weekContext = resolveWeekPlanContext({
            frontmatter,
            anchorDate: weekAnchorDate,
            weekStart,
        });
        const section = weekContext.sectionForCell(
            activeCellWeek7x9.row,
            activeCellWeek7x9.col,
        );
        const nodeId = section ? sectionIdMap[section] : null;
        return nodeId || activeNodeId || null;
    }

    return activeNodeId || null;
};
