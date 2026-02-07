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
        previousBodyUserSelect: string | null;
        previousBodyWebkitUserSelect: string | null;
        previousBodyWebkitTouchCallout: string | null;
        previousHtmlUserSelect: string | null;
        previousHtmlWebkitUserSelect: string | null;
        previousHtmlWebkitTouchCallout: string | null;
    } = {
        timer: null,
        longPress: false,
        previousBodyUserSelect: null,
        previousBodyWebkitUserSelect: null,
        previousBodyWebkitTouchCallout: null,
        previousHtmlUserSelect: null,
        previousHtmlWebkitUserSelect: null,
        previousHtmlWebkitTouchCallout: null,
    };

    const restoreUserSelect = () => {
        if (!options?.suppressTextSelectionPredicate) return;
        if (state.previousBodyUserSelect === null) return;
        document.body.setCssProps({
            'user-select': state.previousBodyUserSelect,
            '-webkit-user-select': state.previousBodyWebkitUserSelect ?? '',
            '-webkit-touch-callout':
                state.previousBodyWebkitTouchCallout ?? '',
        });
        const html = document.documentElement;
        html.setCssProps({
            'user-select': state.previousHtmlUserSelect ?? '',
            '-webkit-user-select': state.previousHtmlWebkitUserSelect ?? '',
            '-webkit-touch-callout':
                state.previousHtmlWebkitTouchCallout ?? '',
        });
        state.previousBodyUserSelect = null;
        state.previousBodyWebkitUserSelect = null;
        state.previousBodyWebkitTouchCallout = null;
        state.previousHtmlUserSelect = null;
        state.previousHtmlWebkitUserSelect = null;
        state.previousHtmlWebkitTouchCallout = null;
    };

    const clearSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            selection.removeAllRanges();
        }
    };

    const onTouchEnd = (e: TouchEvent) => {
        if (state.longPress) {
            state.longPress = false;
            if (preventDefaultPredicate(e)) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
        clearSelection();
        restoreUserSelect();
        if (state.timer) clearTimeout(state.timer);
    };

    const onTouchStart = (e: TouchEvent) => {
        if (state.timer) clearTimeout(state.timer);
        if (options?.suppressTextSelectionPredicate?.(e)) {
            state.previousBodyUserSelect = document.body.style.userSelect || '';
            state.previousBodyWebkitUserSelect =
                document.body.style.webkitUserSelect || '';
            state.previousBodyWebkitTouchCallout =
                document.body.style.getPropertyValue('-webkit-touch-callout') ||
                '';
            const html = document.documentElement;
            state.previousHtmlUserSelect = html.style.userSelect || '';
            state.previousHtmlWebkitUserSelect =
                html.style.webkitUserSelect || '';
            state.previousHtmlWebkitTouchCallout =
                html.style.getPropertyValue('-webkit-touch-callout') || '';
            document.body.setCssProps({
                'user-select': 'none',
                '-webkit-user-select': 'none',
                '-webkit-touch-callout': 'none',
            });
            html.setCssProps({
                'user-select': 'none',
                '-webkit-user-select': 'none',
                '-webkit-touch-callout': 'none',
            });
        }
        state.timer = setTimeout(() => {
            state.longPress = true;
            clearSelection();
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
