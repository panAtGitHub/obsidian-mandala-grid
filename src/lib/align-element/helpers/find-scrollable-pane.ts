const isVerticallyScrollable = (element: HTMLElement) => {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    const canScroll =
        overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
    return canScroll && element.scrollHeight > element.clientHeight + 1;
};

export const findNearestVerticalScrollPane = (
    element: HTMLElement | null,
    boundary: HTMLElement,
) => {
    let current = element;
    while (current && current !== boundary) {
        if (isVerticallyScrollable(current)) {
            return current;
        }
        current = current.parentElement;
    }

    return isVerticallyScrollable(boundary) ? boundary : null;
};
