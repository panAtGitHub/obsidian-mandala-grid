const HOTKEY_EXCLUDED_SELECTOR = '.mandala-search-results';
const ACTIVE_SEARCH_NAVIGATION_SELECTOR =
    '.mandala-search-results[data-keyboard-navigation-active="true"]';

const isEditableTarget = (target: HTMLElement) =>
    target.localName === 'input' ||
    target.localName === 'textarea' ||
    target.isContentEditable ||
    target.getAttribute('contenteditable') === '' ||
    target.getAttribute('contenteditable') === 'true';

const resolveEventTarget = (event: KeyboardEvent): HTMLElement | null => {
    const directTarget = event.target;
    if (directTarget instanceof Node && directTarget.instanceOf(HTMLElement)) {
        return directTarget;
    }

    const path = event.composedPath();
    const pathTarget = path.find(
        (value): value is HTMLElement =>
            value instanceof Node && value.instanceOf(HTMLElement),
    );
    if (pathTarget) {
        return pathTarget;
    }

    return activeDocument.activeElement?.instanceOf(HTMLElement)
        ? activeDocument.activeElement
        : null;
};

export const shouldHandleViewHotkey = (event: KeyboardEvent): boolean => {
    const target = resolveEventTarget(event);
    if (!target) {
        return !activeDocument.querySelector(ACTIVE_SEARCH_NAVIGATION_SELECTOR);
    }

    if (isEditableTarget(target)) {
        return false;
    }

    if (activeDocument.querySelector(ACTIVE_SEARCH_NAVIGATION_SELECTOR)) {
        return false;
    }

    if (target.closest(HOTKEY_EXCLUDED_SELECTOR)) {
        return false;
    }

    return true;
};
