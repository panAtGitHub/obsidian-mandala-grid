const toggleHideButtons = (element: HTMLElement, hide: boolean) => {
    element.toggleClass('hide-floating-buttons', hide);
};

export const hideFloatingButtons = (element: HTMLElement) => {
    let timeoutHandle: number | null = null;
    let hidden = false;
    const delayedHideButtons = () => {
        timeoutHandle = window.setTimeout(() => {
            if (!hidden) {
                toggleHideButtons(element, true);
                hidden = true;
            }
        }, 5 * 1000);
    };

    const resetHideButtons = () => {
        if (timeoutHandle) window.clearTimeout(timeoutHandle);
        if (hidden) {
            toggleHideButtons(element, false);
            hidden = false;
        }
    };

    const onMousemove = () => {
        resetHideButtons();
        delayedHideButtons();
    };

    element.addEventListener('mousemove', onMousemove);
    return {
        destroy: () => {
            resetHideButtons();
            element.removeEventListener('mousemove', onMousemove);
        },
    };
};
