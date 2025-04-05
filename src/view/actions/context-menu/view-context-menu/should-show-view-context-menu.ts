export const shouldShowViewContextMenu = (e: MouseEvent | TouchEvent) => {
    const target = e.target as HTMLElement;
    return (
        target.hasClass('column-buffer') ||
        target.hasClass('column') ||
        target.hasClass('group') ||
        target.hasClass('columns') ||
        target.hasClass('columns-container')
    );
};
