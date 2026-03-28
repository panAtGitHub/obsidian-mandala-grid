import { parseDayPlanFrontmatter } from 'src/mandala-display/logic/day-plan';
import { resolveDayPlanTodayNavigation } from 'src/mandala-display/logic/mandala-profile';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import { syncThreeByThreeSubgridState } from 'src/mandala-scenes/view-3x3/scene-state';
import type { MandalaView } from 'src/view/view';

export const resolveThreeByThreeDayPlanTodayTargetSection = (
    frontmatter: string,
) => resolveDayPlanTodayNavigation(frontmatter).targetSection;

export const syncThreeByThreeDayPlanSceneState = ({
    view,
    mode,
    subgridTheme,
    documentState,
    sectionToNodeId,
}: {
    view: MandalaView;
    mode: string;
    subgridTheme: string | null | undefined;
    documentState: DocumentState;
    sectionToNodeId: Record<string, string | undefined>;
}) => {
    const dayPlanTodayTargetSection =
        resolveThreeByThreeDayPlanTodayTargetSection(
            documentState.file.frontmatter,
        );
    const dayPlan = parseDayPlanFrontmatter(documentState.file.frontmatter);
    const allowSubgridExpansion = !(
        dayPlan &&
        dayPlan.daily_only_3x3 &&
        subgridTheme?.includes('.')
    );

    syncThreeByThreeSubgridState({
        view,
        mode,
        subgridTheme,
        documentState,
        sectionToNodeId,
        allowSubgridExpansion,
    });

    return dayPlanTodayTargetSection;
};

export const focusThreeByThreeDayPlanTodayFromButton = (
    view: MandalaView,
    event: MouseEvent,
) => {
    event.stopPropagation();
    view.focusDayPlanToday();
};
