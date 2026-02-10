import {
    Context,
    scrollVertically,
} from 'src/view/actions/dnd/scroll-on-dnd-y/helpers/scroll-vertically';
import { getView } from 'src/view/components/container/context';

export type ScrollState = {
    direction: number;
};

export const scrollOnDndY = (container: HTMLElement) => {
    let topEdge: HTMLElement | null = null;
    let bottomEdge: HTMLElement | null = null;

    const view = getView();

    const state: ScrollState = {
        direction: 0,
    };

    const handleDragEnter = (event: DragEvent) => {
        event.preventDefault();

        const target = event.target as HTMLElement | null;
        if (!target) return;
        state.direction =
            target.id === 'dnd-edge-top'
                ? -1
                : target.id === 'dnd-edge-bottom'
                  ? 1
                  : 0;

        const columns = Array.from(
            container.querySelectorAll<HTMLElement>('.column'),
        );

        const context: Context = {
            columns,
            containerRect: container.getBoundingClientRect(),
            state,
            edge: target,
        };
        scrollVertically(context);
    };

    const handleDragLeave = () => {
        state.direction = 0;
    };
    setTimeout(() => {
        topEdge = view.contentEl.querySelector<HTMLElement>('#dnd-edge-top');
        bottomEdge =
            view.contentEl.querySelector<HTMLElement>('#dnd-edge-bottom');

        if (topEdge && bottomEdge) {
            topEdge.addEventListener('dragenter', handleDragEnter);
            topEdge.addEventListener('dragleave', handleDragLeave);

            bottomEdge.addEventListener('dragenter', handleDragEnter);
            bottomEdge.addEventListener('dragleave', handleDragLeave);
        }
    }, 100);
    return {
        destroy() {
            if (topEdge && bottomEdge) {
                topEdge.removeEventListener('dragenter', handleDragEnter);
                topEdge.removeEventListener('dragleave', handleDragLeave);

                bottomEdge.removeEventListener('dragenter', handleDragEnter);
                bottomEdge.removeEventListener('dragleave', handleDragLeave);
            }
        },
    };
};
