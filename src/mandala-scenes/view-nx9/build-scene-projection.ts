import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type {
    Nx9SceneProjection,
} from 'src/mandala-scenes/shared/scene-projection';

export const buildNx9SceneProjectionProps = ({
    themeSnapshot,
    rowsPerPage,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
}: {
    themeSnapshot: MandalaThemeSnapshot;
    rowsPerPage: number;
    sectionColors: Record<string, string>;
    sectionColorOpacity: number;
    backgroundMode: string;
    showDetailSidebar: boolean;
    whiteThemeMode: boolean;
}) => ({
    themeSnapshot,
    rowsPerPage,
    sectionColors,
    sectionColorOpacity,
    backgroundMode,
    showDetailSidebar,
    whiteThemeMode,
});

export const buildNx9SceneProjection = (
    sceneKey: MandalaSceneKey,
    props: ReturnType<typeof buildNx9SceneProjectionProps>,
): Nx9SceneProjection => ({
    sceneKey,
    rendererKind: 'nx9-layout',
    props,
});
