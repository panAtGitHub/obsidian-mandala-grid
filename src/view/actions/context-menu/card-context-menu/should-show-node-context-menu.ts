export const shouldShowNodeContextMenu = (e: MouseEvent | TouchEvent) => {
    const target = e.target as HTMLElement;
    return (
        Boolean(target.closest('.mandala-card')) ||
            Boolean(target.closest('.simple-cell[data-node-id]')) ||
            Boolean(target.closest('.pinned-list-item'))
    );
};
