import { Platform } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import {
    resolveSceneCompatibilityActions,
    type ResolveSceneCompatibilityActionsArgs,
} from 'src/mandala-scenes/shared/scene-compatibility-logic';
import { resolveThreeByThreeMaxDepth } from 'src/mandala-scenes/view-3x3/subgrid-depth';

export const ensureSceneCompatibility = (
    view: MandalaView,
    args: Omit<
        ResolveSceneCompatibilityActionsArgs,
        'weekPlanEnabled' | 'isMobile' | 'threeByThreeMaxDepth'
    >,
) => {
    const effective = view.getEffectiveMandalaSettings();
    const actions = resolveSceneCompatibilityActions({
        ...args,
        weekPlanEnabled: effective.general.weekPlanEnabled,
        isMobile: Platform.isMobile,
        threeByThreeMaxDepth: resolveThreeByThreeMaxDepth(view),
    });

    if (actions.shouldEnterDefaultSubgrid) {
        view.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: '1' },
        });
    }

    if (actions.shouldEnsureCompatibleMode) {
        view.ensureCompatibleMandalaMode(args.documentState.file.frontmatter);
    }
};
