const HOTKEY_EXCLUDED_SELECTOR = '.mandala-search-results';

const resolveEventTarget = (event: KeyboardEvent): HTMLElement | null => {
    const directTarget = event.target;
    if (directTarget instanceof HTMLElement) {
        return directTarget;
    }

    const path = event.composedPath();
    const pathTarget = path.find(
        (value): value is HTMLElement => value instanceof HTMLElement,
    );
    if (pathTarget) {
        return pathTarget;
    }

    return document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
};

export const shouldHandleViewHotkey = (event: KeyboardEvent): boolean => {
    const target = resolveEventTarget(event);
    if (!target) return true;

    if (
        target.localName === 'input' ||
        target.localName === 'textarea' ||
        target.isContentEditable ||
        target.getAttribute('contenteditable') === '' ||
        target.getAttribute('contenteditable') === 'true'
    ) {
        return false;
    }

    if (target.closest(HOTKEY_EXCLUDED_SELECTOR)) {
        return false;
    }

    return true;
};
