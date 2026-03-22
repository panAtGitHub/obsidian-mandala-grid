import { resolveNx9Context } from 'src/mandala-scenes/view-nx9/context';
import { sectionAtCell9x9 } from 'src/view/helpers/mandala/mandala-grid';
import { resolveWeekPlanContext } from 'src/mandala-display/logic/week-plan-context';
import type { Content } from 'src/mandala-document/state/document-state-type';

type CustomLayout = {
    id: string;
    name: string;
    pattern: string;
};

export type ResolveCellPreviewNodeIdArgs = {
    mode: '3x3' | '9x9' | 'nx9' | 'week-7x9';
    activeNodeId: string;
    activeNodeSection: string | null;
    activeCell9x9: { row: number; col: number } | null;
    activeCellNx9: { row: number; col: number; page?: number } | null;
    activeCellWeek7x9: { row: number; col: number } | null;
    sectionIdMap: Record<string, string | undefined>;
    documentContent: Content;
    nx9RowsPerPage: number;
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
        activeCellNx9,
        activeCellWeek7x9,
        sectionIdMap,
        documentContent,
        nx9RowsPerPage,
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

    if (mode === 'nx9' && activeCellNx9) {
        const context = resolveNx9Context({
            sectionIdMap,
            documentContent,
            rowsPerPage: nx9RowsPerPage,
            activeSection: activeNodeSection,
            activeCell: activeCellNx9,
        });
        const section = context.sectionForCell(
            activeCellNx9.row,
            activeCellNx9.col,
            activeCellNx9.page,
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
