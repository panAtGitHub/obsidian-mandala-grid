export const onLongPress = (
    element: HTMLElement,
    callback: (e: TouchEvent) => void,
    preventDefaultPredicate: (e: TouchEvent) => boolean,
) => {
    const state: {
        timer: ReturnType<typeof setTimeout> | null;
        longPress: boolean;
    } = { timer: null, longPress: false };

    const onTouchEnd = (e: TouchEvent) => {
        if (state.longPress) {
            state.longPress = false;
            if (preventDefaultPredicate(e)) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
        if (state.timer) clearTimeout(state.timer);
    };

    const onTouchStart = (e: TouchEvent) => {
        if (state.timer) clearTimeout(state.timer);
        state.timer = setTimeout(() => {
            state.longPress = true;
            callback(e);
        }, 500);
    };

    element.addEventListener('touchstart', onTouchStart);
    element.addEventListener('touchend', onTouchEnd);
    element.addEventListener('touchmove', onTouchEnd);

    return () => {
        element.removeEventListener('touchstart', onTouchStart);
        element.removeEventListener('touchend', onTouchEnd);
        element.removeEventListener('touchmove', onTouchEnd);
    };
};
