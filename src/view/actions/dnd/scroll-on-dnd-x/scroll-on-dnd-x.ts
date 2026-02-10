import { getHorizontalBuffer } from 'src/view/actions/dnd/scroll-on-dnd-x/helpers/get-horizontal-buffer';
import {
    HorizontalContext,
    scrollHorizontally,
} from 'src/view/actions/dnd/scroll-on-dnd-x/helpers/scroll-horizontally';
import { ScrollState } from '../scroll-on-dnd-y/scroll-on-dnd-y';
import { getView } from 'src/view/components/container/context';
import { getRightMostColumn } from 'src/view/actions/dnd/scroll-on-dnd-x/helpers/get-right-most-column';

export const scrollOnDndX = (container: HTMLElement) => {
    let leftEdge: HTMLElement | null = null;
    let rightEdge: HTMLElement | null = null;
    const view = getView();
    const state: ScrollState = {
        direction: 0,
    };
    const handleDragEnter = (event: DragEvent) => {
        const containerRect = container.getBoundingClientRect();
        const target = event.target as HTMLElement | null;
        if (!target) return;
        state.direction =
            target.id === 'dnd-edge-left'
                ? -1
                : target.id === 'dnd-edge-right'
                  ? 1
                  : 0;

        const buffer = getHorizontalBuffer(container, state.direction);
        const rightColumn = getRightMostColumn(container, state.direction);

        if (!buffer) return;
        const context: HorizontalContext = {
            buffer,
            rightColumn: rightColumn,
            columnsContainer: container,
            containerRect: containerRect,
            state,
        };
        scrollHorizontally(context);
    };

    const handleDragLeave = () => {
        state.direction = 0;
    };

    setTimeout(() => {
        leftEdge = view.contentEl.querySelector<HTMLElement>('#dnd-edge-left');
        rightEdge = view.contentEl.querySelector<HTMLElement>('#dnd-edge-right');

        if (leftEdge && rightEdge) {
            leftEdge.addEventListener('dragenter', handleDragEnter);
            leftEdge.addEventListener('dragleave', handleDragLeave);

            rightEdge.addEventListener('dragenter', handleDragEnter);
            rightEdge.addEventListener('dragleave', handleDragLeave);
        }
    }, 100);
    return {
        destroy() {
            if (leftEdge && rightEdge) {
                leftEdge.removeEventListener('dragenter', handleDragEnter);
                leftEdge.removeEventListener('dragleave', handleDragLeave);

                rightEdge.removeEventListener('dragenter', handleDragEnter);
                rightEdge.removeEventListener('dragleave', handleDragLeave);
            }
        },
    };
};
