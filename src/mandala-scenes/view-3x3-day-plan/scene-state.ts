import type { DayPlanFrontmatter } from 'src/mandala-display/logic/day-plan';
import {
    type DayPlanTodayNavigation,
} from 'src/mandala-display/logic/mandala-profile';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import { syncThreeByThreeSubgridState } from 'src/mandala-scenes/view-3x3/scene-state';
import type { MandalaView } from 'src/view/view';

export const resolveThreeByThreeDayPlanTodayTargetSection = (
    navigation: DayPlanTodayNavigation,
) => navigation.targetSection;

export const syncThreeByThreeDayPlanSceneState = ({
    view,
    mode,
    subgridTheme,
    documentState,
    sectionToNodeId,
    dayPlan,
    dayPlanTodayNavigation,
}: {
    view: MandalaView;
    mode: string;
    subgridTheme: string | null | undefined;
    documentState: DocumentState;
    sectionToNodeId: Record<string, string | undefined>;
    dayPlan: DayPlanFrontmatter | null;
    dayPlanTodayNavigation: DayPlanTodayNavigation;
}) => {
    const dayPlanTodayTargetSection =
        resolveThreeByThreeDayPlanTodayTargetSection(dayPlanTodayNavigation);

    syncThreeByThreeSubgridState({
        view,
        mode,
        subgridTheme,
        documentState,
        sectionToNodeId,
        allowSubgridExpansion: true,
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
