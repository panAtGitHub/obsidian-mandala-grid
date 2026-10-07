import {
    dateFromDayOfYear,
    type DayPlanFrontmatter,
} from 'src/mandala-display/logic/day-plan';
import { applyDayPlanToCore } from 'src/mandala-display/logic/apply-day-plan-to-core';
import { ensureChildrenForSection } from 'src/mandala-interaction/helpers/ensure-node-for-section';
import { canExpandThreeByThreeChildren } from 'src/mandala-scenes/view-3x3/subgrid-depth';
import { type DayPlanTodayNavigation } from 'src/mandala-display/logic/mandala-profile';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import type { SectionLookup } from 'src/mandala-document/runtime/section-lookup';
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
    sectionLookup,
    dayPlan,
    dayPlanTodayNavigation,
}: {
    view: MandalaView;
    mode: string;
    subgridTheme: string | null | undefined;
    documentState: DocumentState;
    sectionToNodeId: Record<string, string | undefined>;
    sectionLookup?: SectionLookup;
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
        sectionLookup,
        allowSubgridExpansion: true,
    });

    // A year plan initially stores most days as centers only. Prepare the
    // visible day's slots even when the indexed preview is still sparse.
    if (
        dayPlan?.enabled &&
        mode === '3x3' &&
        subgridTheme &&
        /^[1-9]\d*$/.test(subgridTheme) &&
        canExpandThreeByThreeChildren(view, subgridTheme)
    ) {
        const date = dateFromDayOfYear(dayPlan.year, Number(subgridTheme));
        if (date.startsWith(`${dayPlan.year}-`)) {
            const hasSlots = Array.from({ length: 8 }, (_, index) => {
                const section = `${subgridTheme}.${index + 1}`;
                return sectionToNodeId[section] || sectionLookup?.has(section);
            }).every(Boolean);
            if (!hasSlots) ensureChildrenForSection(view, subgridTheme);
            applyDayPlanToCore(view, subgridTheme, subgridTheme, date);
        }
    }

    return dayPlanTodayTargetSection;
};

export const focusThreeByThreeDayPlanTodayFromButton = (
    view: MandalaView,
    event: MouseEvent,
) => {
    event.stopPropagation();
    view.focusDayPlanToday();
};
