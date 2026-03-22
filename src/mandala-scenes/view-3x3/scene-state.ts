import { findChildGroup } from 'src/mandala-document/tree-utils/find/find-child-group';
import { resolveDayPlanTodayNavigation } from 'src/mandala-display/logic/mandala-profile';
import {
    enterSubgridForNode,
    exitCurrentSubgrid,
} from 'src/mandala-interaction/helpers/mobile-navigation';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import type { MandalaView } from 'src/view/view';
import {
    assemble3x3CellViewModels,
    type Assemble3x3CellViewModelsArgs,
} from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';

export const resolveThreeByThreeTheme = (
    subgridTheme: string | null | undefined,
) => subgridTheme ?? '1';

export const buildThreeByThreeCells = (args: Assemble3x3CellViewModelsArgs) =>
    assemble3x3CellViewModels(args);

export const syncThreeByThreeSceneState = ({
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
    const todayNavigation = resolveDayPlanTodayNavigation(
        documentState.file.frontmatter,
    );
    const dayPlanTodayTargetSection = todayNavigation.targetSection;
    const dayPlan = todayNavigation.dayPlan;
    const allowSubgridExpansion = !(
        dayPlan &&
        dayPlan.daily_only_3x3 &&
        subgridTheme?.includes('.')
    );

    if (
        allowSubgridExpansion &&
        mode === '3x3' &&
        subgridTheme &&
        !subgridTheme.includes('.') &&
        documentState.meta.isMandala
    ) {
        const themeNodeId = sectionToNodeId[subgridTheme];
        if (themeNodeId) {
            const childGroup = findChildGroup(
                documentState.document.columns,
                themeNodeId,
            );
            const childCount = childGroup?.nodes.length ?? 0;
            if (childCount < 8) {
                view.documentStore.dispatch({
                    type: 'document/mandala/ensure-children',
                    payload: { parentNodeId: themeNodeId, count: 8 },
                });
            }
        }
    }

    return dayPlanTodayTargetSection;
};

export const enterThreeByThreeSubgridFromButton = (
    view: MandalaView,
    event: MouseEvent,
    nodeId: string,
) => {
    event.stopPropagation();
    enterSubgridForNode(view, nodeId);
};

export const exitThreeByThreeSubgridFromButton = (
    view: MandalaView,
    event: MouseEvent,
) => {
    event.stopPropagation();
    exitCurrentSubgrid(view);
};

export const focusThreeByThreeTodayFromButton = (
    view: MandalaView,
    event: MouseEvent,
) => {
    event.stopPropagation();
    view.focusDayPlanToday();
};

export const getThreeByThreeUpButtonLabel = (theme: string) =>
    theme.includes('.') ? '退出上一层子九宫格' : '上一层核心九宫格';

export const getThreeByThreeDownButtonLabel = (theme: string) =>
    theme.includes('.') ? '进入下一层子九宫格' : '下一层核心九宫格';
