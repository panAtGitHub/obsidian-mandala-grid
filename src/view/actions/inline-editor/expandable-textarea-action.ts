import { LineageView } from 'src/view/view';
import { getView } from 'src/view/components/container/context';
import { get } from 'svelte/store';
import { limitPreviewHeightStore } from 'src/stores/settings/derived/limit-preview-height-store';

const deletionKeys = new Set(['Backspace', 'Delete', 'x', ' ']);

export const AdjustHeight = (view: LineageView, el: HTMLElement) => {
    let previousScrollHeight = 0;
    let x: HTMLElement;
    const limitCardHeight = get(limitPreviewHeightStore(view));
    const viewState = view.viewStore.getValue();
    const isInSidebar = viewState.document.editing.isInSidebar;

    return (e?: KeyboardEvent) => {
        if (!x) {
            x = el.querySelector('.cm-scroller') as HTMLElement;
        }

        if (!x) return;
        requestAnimationFrame(() => {
            const scrollHeight = x.scrollHeight;
            const scrollHeightChange =
                scrollHeight > 100 && scrollHeight !== previousScrollHeight;
            if (scrollHeightChange || (e && deletionKeys.has(e.key))) {
                x.style.height = 'auto';
                previousScrollHeight = x.scrollHeight;
                el.style.height = previousScrollHeight + 'px';
                x.style.height = '';
                if (!isInSidebar && limitCardHeight && scrollHeightChange) {
                    view.alignBranch.align({
                        type: 'view/align-branch/reveal-node',
                    });
                }
            }
        });
    };
};
export const expandableTextareaAction = (el: HTMLElement) => {
    const view = getView();
    const adjustHeight = AdjustHeight(view, el);

    el.addEventListener('keydown', adjustHeight);

    return {
        destroy: () => {
            el.removeEventListener('keydown', adjustHeight);
        },
    };
};
