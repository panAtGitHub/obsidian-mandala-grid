export const createElementInDocument = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    ownerDocument: Document = activeDocument,
): HTMLElementTagNameMap[K] => {
    const element = createEl(tag);
    // Obsidian's global helper creates in its own window. Keep popout ownership.
    return element.ownerDocument === ownerDocument
        ? element
        : ownerDocument.adoptNode(element);
};
