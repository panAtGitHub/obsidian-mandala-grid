import { applyCssProps } from 'src/shared/helpers/apply-css-props';

const deletionKeys = new Set(['Backspace', 'Delete', 'x', ' ']);

type ExpandableTextareaRuntime = {
    shouldLimitCardHeight: () => boolean;
    isEditingInSidebar: () => boolean;
    revealNode: () => void;
};

export const createAdjustHeight = (
    runtime: ExpandableTextareaRuntime,
    el: HTMLElement,
) => {
    let previousScrollHeight = 0;
    let x: HTMLElement;

    return (e?: KeyboardEvent) => {
        if (!x) {
            x = el.querySelector('.cm-scroller') as HTMLElement;
        }

        if (!x) return;
        window.requestAnimationFrame(() => {
            const scrollHeight = x.scrollHeight;
            const scrollHeightChange =
                scrollHeight > 100 && scrollHeight !== previousScrollHeight;
            if (scrollHeightChange || (e && deletionKeys.has(e.key))) {
                applyCssProps(x, { height: 'auto' });
                previousScrollHeight = x.scrollHeight;
                applyCssProps(el, { height: previousScrollHeight + 'px' });
                applyCssProps(x, { height: '' });
                if (
                    !runtime.isEditingInSidebar() &&
                    runtime.shouldLimitCardHeight() &&
                    scrollHeightChange
                ) {
                    runtime.revealNode();
                }
            }
        });
    };
};

export const createExpandableTextareaAction = (
    runtime: ExpandableTextareaRuntime,
) => {
    return (el: HTMLElement, enabled = true) => {
        const adjustHeight = createAdjustHeight(runtime, el);
        let isAttached = false;

        const attach = () => {
            if (isAttached || !enabled) return;
            adjustHeight();
            el.addEventListener('keydown', adjustHeight);
            isAttached = true;
        };

        const detach = () => {
            if (!isAttached) return;
            el.removeEventListener('keydown', adjustHeight);
            isAttached = false;
        };

        attach();

        return {
            update: (nextEnabled: boolean) => {
                enabled = nextEnabled;
                if (enabled) attach();
                else detach();
            },
            destroy: () => {
                detach();
            },
        };
    };
};
