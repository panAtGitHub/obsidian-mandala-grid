import {
    resolveWeekPlanContext,
} from 'src/mandala-display/logic/week-plan-context';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { WeekStart } from 'src/mandala-settings/state/settings-type';
import {
    assembleDesktopWeekPlanCells,
    assembleMobileWeekPlanCells,
} from 'src/mandala-scenes/view-7x9/assemble-cell-view-model';
import type {
    WeekSceneProjection,
    WeekSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';

export const buildWeekSceneProjectionProps = ({
    frontmatter,
    anchorDate,
    weekStart,
    compactMode,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
    sectionIdMap,
    documentContent,
    activeNodeId,
    activeCell,
    editingState,
    selectedNodes,
    pinnedSections,
}: {
    frontmatter: string;
    anchorDate: string | null | undefined;
    weekStart: WeekStart;
    compactMode: boolean;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    backgroundMode: string;
    showDetailSidebar: boolean;
    whiteThemeMode: boolean;
    sectionIdMap: Record<string, string | undefined>;
    documentContent: Record<string, { content?: string }>;
    activeNodeId: string | null;
    activeCell: { row: number; col: number } | null;
    editingState: {
        activeNodeId: string | null;
        isInSidebar: boolean;
    };
    selectedNodes: Set<string>;
    pinnedSections: Set<string>;
}): WeekSceneProjectionProps => {
    const rows = resolveWeekPlanContext({
        frontmatter,
        anchorDate,
        weekStart,
    }).rows;

    return {
        rows,
        desktopCells: assembleDesktopWeekPlanCells({
            rows,
            sectionIdMap,
            activeNodeId,
            activeCell,
            compactMode,
            editingState,
            selectedNodes,
            pinnedSections,
            sectionColors,
            sectionColorOpacity,
            backgroundMode,
            showDetailSidebar,
            whiteThemeMode,
        }),
        mobileCells: assembleMobileWeekPlanCells({
            rows,
            sectionIdMap,
            documentContent,
        }),
        compactMode,
        sectionColors,
        sectionColorOpacity,
        backgroundMode,
        showDetailSidebar,
        whiteThemeMode,
    };
};

export const buildWeekSceneProjection = (
    sceneKey: MandalaSceneKey,
    props: WeekSceneProjectionProps,
): WeekSceneProjection => ({
    sceneKey,
    rendererKind: 'week-layout',
    props,
});
