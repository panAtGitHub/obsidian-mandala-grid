const GRID_FOCUS_EXCLUDED_SELECTOR = [
    '.mandala-card',
    '.mandala-detail-sidebar',
    '.mandala-inline-editor',
    '.editor-container',
    '.cell-preview-dialog',
    '.cm-editor',
    'button',
    'input',
    'textarea',
    'select',
    'a',
    '[contenteditable="true"]',
    '[role="button"]',
    '.modal',
    '.popover',
    '.menu',
].join(', ');

type ClosestTarget = {
    closest: (selector: string) => unknown;
};

const isClosestTarget = (value: unknown): value is ClosestTarget => {
    if (typeof value !== 'object' || value === null || !('closest' in value)) {
        return false;
    }

    return typeof value.closest === 'function';
};

export const shouldRequestGridFocusFromPointer = (event: MouseEvent) => {
    if (!isClosestTarget(event.target)) {
        return false;
    }

    return !event.target.closest(GRID_FOCUS_EXCLUDED_SELECTOR);
};
