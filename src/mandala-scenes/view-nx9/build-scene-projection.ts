import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { ResolvedGridStyle } from 'src/mandala-scenes/shared/grid-style';
import type {
    Nx9SceneProjection,
    SceneCardInteractionSnapshot,
    SceneDisplaySnapshot,
    SceneDocumentSnapshot,
} from 'src/mandala-scenes/shared/scene-projection';

export const buildNx9SceneProjectionProps = ({
    documentSnapshot,
    themeSnapshot,
    gridStyle,
    rowsPerPage,
    displaySnapshot,
    interactionSnapshot,
    activeSection,
    activeCoreSection,
    activeCell,
}: {
    documentSnapshot: SceneDocumentSnapshot;
    themeSnapshot: MandalaThemeSnapshot;
    gridStyle: ResolvedGridStyle;
    rowsPerPage: number;
    displaySnapshot: SceneDisplaySnapshot;
    interactionSnapshot: SceneCardInteractionSnapshot;
    activeSection: string | null;
    activeCoreSection: string | null;
    activeCell: { row: number; col: number; page?: number } | null;
}): Nx9SceneProjection['props'] => ({
    layoutKind: 'nx9',
    output: {},
    layoutMeta: {
        documentSnapshot,
        themeSnapshot,
        gridStyle,
        rowsPerPage,
        displaySnapshot,
        interactionSnapshot,
        activeSection,
        activeCoreSection,
        activeCell,
    },
});

export const buildNx9SceneProjection = (
    sceneKey: MandalaSceneKey,
    props:
        | ReturnType<typeof buildNx9SceneProjectionProps>
        | {
              documentSnapshot: SceneDocumentSnapshot;
              themeSnapshot: MandalaThemeSnapshot;
              gridStyle: ResolvedGridStyle;
              rowsPerPage: number;
              displaySnapshot: SceneDisplaySnapshot;
              interactionSnapshot: SceneCardInteractionSnapshot;
              activeSection: string | null;
              activeCoreSection: string | null;
              activeCell: { row: number; col: number; page?: number } | null;
          },
): Nx9SceneProjection => {
    const normalizedProps: Nx9SceneProjection['props'] =
        'output' in props && 'layoutMeta' in props
            ? props
            : {
                  layoutKind: 'nx9' as const,
                  output: {},
                  layoutMeta: {
                      documentSnapshot: props.documentSnapshot,
                      themeSnapshot: props.themeSnapshot,
                      gridStyle: props.gridStyle,
                      rowsPerPage: props.rowsPerPage,
                      displaySnapshot: props.displaySnapshot,
                      interactionSnapshot: props.interactionSnapshot,
                      activeSection: props.activeSection,
                      activeCoreSection: props.activeCoreSection,
                      activeCell: props.activeCell,
                  },
              };

    return {
        sceneKey,
        rendererKind: 'card-scene',
        props: normalizedProps,
    };
};
