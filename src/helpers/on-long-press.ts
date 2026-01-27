type LongPressOptions = {
    suppressTextSelectionPredicate?: (e: TouchEvent) => boolean;
};

export const onLongPress = (
    element: HTMLElement,
    callback: (e: TouchEvent) => void,
    preventDefaultPredicate: (e: TouchEvent) => boolean,
    options?: LongPressOptions,
) => {
    const state: {
        timer: ReturnType<typeof setTimeout> | null;
        longPress: boolean;
        previousUserSelect: string | null;
        previousWebkitUserSelect: string | null;
    } = {
        timer: null,
        longPress: false,
        previousUserSelect: null,
        previousWebkitUserSelect: null,
    };

    const restoreUserSelect = () => {
        if (!options?.suppressTextSelectionPredicate) return;
        if (state.previousUserSelect === null) return;
        document.body.style.userSelect = state.previousUserSelect;
        document.body.style.webkitUserSelect = state.previousWebkitUserSelect ?? '';
        state.previousUserSelect = null;
        state.previousWebkitUserSelect = null;
    };

    const onTouchEnd = (e: TouchEvent) => {
        if (state.longPress) {
            state.longPress = false;
            if (preventDefaultPredicate(e)) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
        restoreUserSelect();
        if (state.timer) clearTimeout(state.timer);
    };

    const onTouchStart = (e: TouchEvent) => {
        if (state.timer) clearTimeout(state.timer);
        if (options?.suppressTextSelectionPredicate?.(e)) {
            state.previousUserSelect = document.body.style.userSelect || '';
            state.previousWebkitUserSelect = document.body.style.webkitUserSelect || '';
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
        }
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
