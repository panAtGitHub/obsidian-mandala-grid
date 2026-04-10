const HOTKEY_EXCLUDED_SELECTOR = '.mandala-search-results';

export const shouldHandleViewHotkey = (event: KeyboardEvent): boolean => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return true;

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
