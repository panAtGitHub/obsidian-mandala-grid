import type {
    NineByNineSceneProjection,
    SceneController,
    SceneRootContext,
} from 'src/mandala-scenes/shared/scene-projection';
import { setActiveCell9x9 } from 'src/mandala-interaction/helpers/set-active-cell-9x9';
import { resolveCanonicalActiveCell9x9 } from 'src/mandala-interaction/helpers/resolve-canonical-active-cell-9x9';

const syncNineByNineSceneState = (context: SceneRootContext) => {
    const section = context.idToSection[context.ui.activeNodeId ?? ''];
    if (!section) {
        if (context.view.mandalaActiveCell9x9) {
            setActiveCell9x9(context.view, null);
        }
        return;
    }

    const cell = context.view.mandalaActiveCell9x9;
    const canonicalCell = resolveCanonicalActiveCell9x9({
        section,
        selectedLayoutId: context.settings.selectedLayoutId,
        customLayouts: context.settings.customLayouts,
    });
    if (!canonicalCell) {
        if (cell) {
            setActiveCell9x9(context.view, null);
        }
        return;
    }

    if (!cell) {
        setActiveCell9x9(context.view, canonicalCell);
        return;
    }

    if (cell.row !== canonicalCell.row || cell.col !== canonicalCell.col) {
        setActiveCell9x9(context.view, canonicalCell);
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
