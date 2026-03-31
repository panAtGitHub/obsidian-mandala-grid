import { Platform } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import {
    resolveSceneCompatibilityActions,
    type ResolveSceneCompatibilityActionsArgs,
} from 'src/mandala-scenes/shared/scene-compatibility-logic';

export const ensureSceneCompatibility = (
    view: MandalaView,
    args: Omit<ResolveSceneCompatibilityActionsArgs, 'weekPlanEnabled' | 'isMobile'>,
) => {
    const effective = view.getEffectiveMandalaSettings();
    const actions = resolveSceneCompatibilityActions({
        ...args,
        weekPlanEnabled: effective.general.weekPlanEnabled,
        isMobile: Platform.isMobile,
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
