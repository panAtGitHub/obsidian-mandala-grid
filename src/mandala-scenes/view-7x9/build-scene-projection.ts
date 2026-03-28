import {
    resolveWeekPlanContext,
} from 'src/mandala-display/logic/week-plan-context';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { WeekStart } from 'src/mandala-settings/state/settings-type';
import {
    assembleDesktopWeekPlanCells,
    assembleMobileWeekPlanCells,
    type WeekPlanDesktopCellViewModel,
    type WeekPlanMobileCellViewModel,
} from 'src/mandala-scenes/view-7x9/assemble-cell-view-model';
import type {
    SceneDisplaySnapshot,
    WeekSceneProjection,
    WeekSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';

export const buildWeekSceneProjectionProps = ({
    frontmatter,
    anchorDate,
    weekStart,
    compactMode,
    displaySnapshot,
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
    displaySnapshot: SceneDisplaySnapshot;
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
        layoutKind: 'week',
        output: {
            desktopDescriptors: assembleDesktopWeekPlanCells({
                rows,
                sectionIdMap,
                activeNodeId,
                activeCell,
                compactMode,
                editingState,
                selectedNodes,
                pinnedSections,
                sectionColors: displaySnapshot.sectionColors,
                sectionColorOpacity: displaySnapshot.sectionColorOpacity,
                backgroundMode: displaySnapshot.backgroundMode,
                showDetailSidebar: displaySnapshot.showDetailSidebar,
                whiteThemeMode: displaySnapshot.whiteThemeMode,
            }),
            mobileDescriptors: assembleMobileWeekPlanCells({
                rows,
                sectionIdMap,
                documentContent,
                activeNodeId,
                activeCell,
            }),
        },
        layoutMeta: {
            rows,
            compactMode,
            displaySnapshot,
        },
    };
};

export const buildWeekSceneProjection = (
    sceneKey: MandalaSceneKey,
    props:
        | WeekSceneProjectionProps
        | {
              rows: WeekSceneProjectionProps['layoutMeta']['rows'];
              desktopCells: WeekPlanDesktopCellViewModel[];
              mobileCells: WeekPlanMobileCellViewModel[];
              compactMode: boolean;
              displaySnapshot: SceneDisplaySnapshot;
          },
): WeekSceneProjection => {
    const normalizedProps: WeekSceneProjectionProps =
        'output' in props && 'layoutMeta' in props
            ? props
            : {
                  layoutKind: 'week',
                  output: {
                      desktopDescriptors: props.desktopCells,
                      mobileDescriptors: props.mobileCells,
                  },
                  layoutMeta: {
                      rows: props.rows,
                      compactMode: props.compactMode,
                      displaySnapshot: props.displaySnapshot,
                  } satisfies WeekSceneProjectionProps['layoutMeta'],
              };

    return {
        sceneKey,
        rendererKind: 'card-scene',
        props: normalizedProps,
    };
};
