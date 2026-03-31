export const shouldShowViewContextMenu = (e: MouseEvent | TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.mandala-detail-sidebar')) return false;
    return Boolean(
        target.closest(
            '.mandala-root, .mandala-grid, .mandala-cell, .simple-9x9-grid, .nx9-grid, .row-matrix-grid',
        ),
    );
};
