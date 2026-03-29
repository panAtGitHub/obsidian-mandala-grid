import type {
    Nx9WeekSceneProjection,
    SceneController,
    SceneRootContext,
} from 'src/mandala-scenes/shared/scene-projection';
import { buildNx9WeekSceneProjection } from 'src/mandala-scenes/view-nx9-week-7x9/build-scene-projection';
import { createNx9WeekRuntime } from 'src/mandala-scenes/view-nx9-week-7x9/runtime';
import { setActiveCellNx9Week7x9 } from 'src/mandala-scenes/view-nx9-week-7x9/set-active-cell';

const syncWeekSceneState = (context: SceneRootContext) => {
    const anchorDate = context.weekContext.anchorDate;
    if (!context.ui.weekAnchorDate) {
        context.view.viewStore.dispatch({
            type: 'view/mandala/week-anchor-date/set',
            payload: { date: anchorDate },
        });
    }

    const section = context.idToSection[context.ui.activeNodeId ?? ''];
    const pos = context.weekContext.posForSection(section);
    const cell =
        context.view.mandalaActiveCellNx9?.page === 0
            ? context.view.mandalaActiveCellNx9
            : null;

    if (!section) {
        if (cell) {
            setActiveCellNx9Week7x9(context.view, null);
        }
        return;
    }

    if (cell) {
        const mapped = context.weekContext.sectionForCell(cell.row, cell.col);
        if (!mapped || mapped !== section) {
            setActiveCellNx9Week7x9(
                context.view,
                pos
                    ? {
                          row: pos.row,
                          col: pos.col,
                          page: 0,
                      }
                    : null,
            );
        }
        return;
    }

    if (pos) {
        setActiveCellNx9Week7x9(context.view, {
            row: pos.row,
            col: pos.col,
            page: 0,
        });
    }
};

export const createNx9WeekController = (): SceneController => {
    const runtime = createNx9WeekRuntime();
    let cachedProjection: Nx9WeekSceneProjection | null = null;
    let cachedDescriptors: Nx9WeekSceneProjection['props']['output']['descriptors'] | null =
        null;
    let cachedThemeSnapshot: SceneRootContext['sceneThemeSnapshot'] | null = null;
    let cachedDisplaySnapshot: SceneRootContext['displaySnapshot'] | null = null;
    let cachedGridStyle: SceneRootContext['gridStyles']['week'] | null = null;
    let cachedSceneKeyId = '';

    return {
        resolveProjection: (context) => {
            syncWeekSceneState(context);

            const descriptors = runtime.resolveCells({
                weekContext: context.weekContext,
                sectionIdMap: context.documentState.sections.section_id,
                gridStyle: context.gridStyles.week,
                displaySnapshot: context.displaySnapshot,
                interactionSnapshot: context.interactionSnapshot,
                activeCell: context.ui.nx9ActiveCell,
            });
            const nextSceneKeyId = `${context.sceneKey.viewKind}:${context.sceneKey.variant}`;

            if (
                cachedProjection &&
                cachedSceneKeyId === nextSceneKeyId &&
                cachedDescriptors === descriptors &&
                cachedThemeSnapshot === context.sceneThemeSnapshot &&
                cachedDisplaySnapshot === context.displaySnapshot &&
                cachedGridStyle === context.gridStyles.week
            ) {
                return cachedProjection;
            }

            cachedProjection = buildNx9WeekSceneProjection(context.sceneKey, {
                layoutKind: 'nx9-week-7x9',
                output: {
                    descriptors,
                },
                layoutMeta: {
                    displaySnapshot: context.displaySnapshot,
                    gridStyle: context.gridStyles.week,
                    themeSnapshot: context.sceneThemeSnapshot,
                },
            });
            cachedSceneKeyId = nextSceneKeyId;
            cachedDescriptors = descriptors;
            cachedThemeSnapshot = context.sceneThemeSnapshot;
            cachedDisplaySnapshot = context.displaySnapshot;
            cachedGridStyle = context.gridStyles.week;
            return cachedProjection;
        },
    };
};
