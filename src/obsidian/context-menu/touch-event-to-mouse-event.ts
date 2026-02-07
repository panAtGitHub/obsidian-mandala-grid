export const touchEventToMouseEvent = (
    event: TouchEvent,
    type = 'contextmenu',
): MouseEvent | null => {
    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) return null;

    return new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
    });
};
