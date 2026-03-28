import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type {
    Nx9SceneProjection,
    SceneCardInteractionSnapshot,
    SceneDisplaySnapshot,
    SceneDocumentSnapshot,
} from 'src/mandala-scenes/shared/scene-projection';

export const buildNx9SceneProjectionProps = ({
    documentSnapshot,
    themeSnapshot,
    rowsPerPage,
    displaySnapshot,
    interactionSnapshot,
    activeSection,
    activeCoreSection,
    activeCell,
}: {
    documentSnapshot: SceneDocumentSnapshot;
    themeSnapshot: MandalaThemeSnapshot;
    rowsPerPage: number;
    displaySnapshot: SceneDisplaySnapshot;
    interactionSnapshot: SceneCardInteractionSnapshot;
    activeSection: string | null;
    activeCoreSection: string | null;
    activeCell: { row: number; col: number; page?: number } | null;
}) => ({
    documentSnapshot,
    themeSnapshot,
    rowsPerPage,
    displaySnapshot,
    interactionSnapshot,
    activeSection,
    activeCoreSection,
    activeCell,
});

export const buildNx9SceneProjection = (
    sceneKey: MandalaSceneKey,
    props: ReturnType<typeof buildNx9SceneProjectionProps>,
): Nx9SceneProjection => ({
    sceneKey,
    rendererKind: 'nx9-layout',
    props,
});
