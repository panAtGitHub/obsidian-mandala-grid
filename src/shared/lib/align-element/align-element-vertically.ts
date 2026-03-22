import { calculateScrollTop } from 'src/shared/lib/align-element/helpers/calculate-scroll-top';
import { THRESHOLD } from 'src/shared/lib/align-element/constants';
import {
    AlignBranchContext,
    PartialDOMRect,
} from 'src/stores/view/subscriptions/effects/align-branch/helpers/create-context';
import { calculateScrollTopRelative } from 'src/shared/lib/align-element/helpers/calculate-scroll-top-relative';
import { getElementById } from 'src/shared/lib/align-element/helpers/get-element-by-id';
import { findNearestVerticalScrollPane } from 'src/shared/lib/align-element/helpers/find-scrollable-pane';

export const alignVertically = (
    context: AlignBranchContext,
    column: HTMLElement,
    elementRect: DOMRect,
    relativeId: string | null,
    center: boolean,
) => {
    let relativeRect: PartialDOMRect | null = null;
    if (relativeId && context.state.rects.has(relativeId)) {
        relativeRect = context.state.rects.get(relativeId)!;
    } else if (relativeId) {
        const relativeElement = getElementById(context.container, relativeId);
        if (relativeElement) {
            relativeRect = relativeElement.getBoundingClientRect();
        }
    }
    const scrollTop = relativeRect
        ? calculateScrollTopRelative(
              elementRect,
              context.containerRect,
              relativeRect,
          )
        : calculateScrollTop(elementRect, context.containerRect, center);

    if (Math.abs(scrollTop) > THRESHOLD) {
        column.scrollBy({
            top: (scrollTop * -1) / context.alignBranchSettings.zoomLevel,
            behavior: context.alignBranchSettings.behavior,
        });
    } else {
        // cancel previous pending calls
        column.scrollBy({
            top: 0,
            behavior: 'instant',
        });
    }

    return {
        height: elementRect.height,
        top: elementRect.top + scrollTop,
    } satisfies PartialDOMRect;
};

export const alignElementVertically = (
    context: AlignBranchContext,
    id: string,
    relativeId: string | null,
    center: boolean,
): string | undefined => {
    const element = getElementById(context.container, id);
    if (!element) return;
    const scrollPane = findNearestVerticalScrollPane(element, context.container);
    if (!scrollPane) return;

    const elementRect = element.getBoundingClientRect();
    const rect = alignVertically(
        context,
        scrollPane,
        elementRect,
        relativeId,
        center,
    );
    if (
        !center &&
        (id === context.activeBranch.group || id === context.activeBranch.node)
    ) {
        context.state.rects.set(id, rect);
    }
};
