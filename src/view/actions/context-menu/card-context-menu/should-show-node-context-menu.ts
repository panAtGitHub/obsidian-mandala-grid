export const shouldShowNodeContextMenu = (e: MouseEvent | TouchEvent) => {
    const target = e.target as HTMLElement;
    return (
        !target.hasClass('drag-handle') &&
        Boolean(target.closest('.lineage-card'))
    );
};
