import {
    posOfSection9x9,
    sectionAtCell9x9,
} from 'src/mandala-display/logic/mandala-grid';
import { getSectionCore } from 'src/mandala-display/logic/mandala-topology';
import type {
    NineByNineSceneProjection,
    SceneController,
    SceneRootContext,
} from 'src/mandala-scenes/shared/scene-projection';
import { setActiveCell9x9 } from 'src/mandala-interaction/helpers/set-active-cell-9x9';

const getBaseTheme = (section: string | undefined) =>
    getSectionCore(section) ?? '1';

const syncNineByNineSceneState = (context: SceneRootContext) => {
    const section = context.idToSection[context.ui.activeNodeId ?? ''];
    const baseTheme = getBaseTheme(section);
    if (!section) {
        if (context.view.mandalaActiveCell9x9) {
            setActiveCell9x9(context.view, null);
        }
        return;
    }

    const cell = context.view.mandalaActiveCell9x9;
    const pos = posOfSection9x9(
        section,
        context.settings.selectedLayoutId,
        baseTheme,
        context.settings.customLayouts,
    );
    if (!cell) {
        return;
    }

    const mapped = sectionAtCell9x9(
        cell.row,
        cell.col,
        context.settings.selectedLayoutId,
        baseTheme,
        context.settings.customLayouts,
    );
    if (!mapped || mapped !== section) {
        setActiveCell9x9(context.view, pos ?? null);
    }
};

export const createNineByNineController = (): SceneController => {
    let cachedProjection: NineByNineSceneProjection | null = null;
    let cachedSceneKeyId = '';

    return {
        resolveProjection: (context) => {
            syncNineByNineSceneState(context);

            const nextSceneKeyId = `${context.sceneKey.viewKind}:${context.sceneKey.variant}`;
            if (cachedProjection && cachedSceneKeyId === nextSceneKeyId) {
                return cachedProjection;
            }

            cachedProjection = {
                sceneKey: context.sceneKey,
                rendererKind: '9x9-layout',
                props: {},
            };
            cachedSceneKeyId = nextSceneKeyId;
            return cachedProjection;
        },
    };
};
