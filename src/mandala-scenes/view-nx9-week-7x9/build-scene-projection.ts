import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import {
    resolveWeekPlanContext,
} from 'src/mandala-display/logic/week-plan-context';
import type { WeekStart } from 'src/mandala-settings/state/settings-type';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';
import {
    assembleNx9WeekCells,
} from 'src/mandala-scenes/view-nx9-week-7x9/assemble-cell-view-model';
import type {
    Nx9WeekSceneProjection,
    Nx9WeekSceneProjectionProps,
    SceneDisplaySnapshot,
} from 'src/mandala-scenes/shared/scene-projection';

export const buildNx9WeekSceneProjectionProps = ({
    frontmatter,
    anchorDate,
    weekStart,
    compactMode,
    themeSnapshot,
    displaySnapshot,
    sectionIdMap,
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
    themeSnapshot: MandalaThemeSnapshot;
    displaySnapshot: SceneDisplaySnapshot;
    sectionIdMap: Record<string, string | undefined>;
    activeNodeId: string | null;
    activeCell: { row: number; col: number; page?: number } | null;
    editingState: {
        activeNodeId: string | null;
        isInSidebar: boolean;
    };
    selectedNodes: Set<string>;
    pinnedSections: Set<string>;
}): Nx9WeekSceneProjectionProps => {
    const rows = resolveWeekPlanContext({
        frontmatter,
        anchorDate,
        weekStart,
    }).rows;
    const gridStyle = resolveCardGridStyle({
        whiteThemeMode: displaySnapshot.whiteThemeMode,
        compactMode,
        selectionStyle: 'cell-outline',
    });

    return {
        layoutKind: 'nx9-week-7x9',
        output: {
            descriptors: assembleNx9WeekCells({
                rows,
                sectionIdMap,
                activeNodeId,
                activeCell,
                editingState,
                selectedNodes,
                pinnedSections,
                gridStyle,
                sectionColors: displaySnapshot.sectionColors,
                sectionColorOpacity: displaySnapshot.sectionColorOpacity,
                backgroundMode: displaySnapshot.backgroundMode,
                showDetailSidebar: displaySnapshot.showDetailSidebar,
                whiteThemeMode: displaySnapshot.whiteThemeMode,
            }),
        },
        layoutMeta: {
            displaySnapshot,
            gridStyle,
            themeSnapshot,
        },
    };
};

export const buildNx9WeekSceneProjection = (
    sceneKey: MandalaSceneKey,
    props: Nx9WeekSceneProjectionProps,
): Nx9WeekSceneProjection => ({
    sceneKey,
    rendererKind: 'card-scene',
    props,
});
