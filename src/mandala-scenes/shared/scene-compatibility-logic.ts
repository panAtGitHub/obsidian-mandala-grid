import {
    resolveMandalaProfile,
    type MandalaSceneKey,
} from 'src/mandala-display/logic/mandala-profile';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';

export type ResolveSceneCompatibilityActionsArgs = {
    sceneKey: MandalaSceneKey;
    dayPlanEnabled: boolean;
    subgridTheme: string | null | undefined;
    sectionToNodeId: Record<string, string | undefined>;
    documentState: DocumentState;
    weekPlanEnabled: boolean;
    isMobile: boolean;
};

export type SceneCompatibilityActions = {
    shouldEnterDefaultSubgrid: boolean;
    shouldEnsureCompatibleMode: boolean;
};

export const resolveSceneCompatibilityActions = ({
    sceneKey,
    dayPlanEnabled,
    subgridTheme,
    sectionToNodeId,
    documentState,
    weekPlanEnabled,
    isMobile,
}: ResolveSceneCompatibilityActionsArgs): SceneCompatibilityActions => {
    const profile = resolveMandalaProfile(documentState.file.frontmatter);
    const canUseWeekVariant =
        dayPlanEnabled && weekPlanEnabled && profile?.kind === 'day-plan';
    const canUseNx9Mode =
        !isMobile &&
        documentState.meta.isMandala &&
        (!profile?.dayPlan || canUseWeekVariant);

    const shouldEnterDefaultSubgrid =
        !subgridTheme ||
        (sceneKey.viewKind === '3x3' &&
            !!subgridTheme &&
            subgridTheme !== '1' &&
            !sectionToNodeId[subgridTheme]);

    const shouldEnsureCompatibleMode =
        (sceneKey.viewKind === 'nx9' &&
            sceneKey.variant === 'week-7x9' &&
            !canUseWeekVariant) ||
        (sceneKey.viewKind === 'nx9' && !canUseNx9Mode);

    return {
        shouldEnterDefaultSubgrid,
        shouldEnsureCompatibleMode,
    };
};
