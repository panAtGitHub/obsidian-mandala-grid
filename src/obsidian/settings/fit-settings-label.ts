/** Shrink a single-line label without changing the surrounding control size. */
export const fitSettingsLabel = (label: HTMLElement): (() => void) => {
    const ownerWindow = label.ownerDocument.defaultView;
    if (!ownerWindow) return () => {};
    const baseFontSize = ownerWindow.getComputedStyle(label).fontSize;
    const baseSize = Number.parseFloat(baseFontSize);
    const fit = () => {
        label.style.fontSize = baseFontSize;
        const availableWidth = label.clientWidth;
        if (!availableWidth || !baseSize) return;
        const contentWidth = label.scrollWidth;
        if (contentWidth <= availableWidth) return;
        const ratio = Math.max(0.85, availableWidth / contentWidth);
        label.style.fontSize = `${baseSize * ratio}px`;
    };
    const observer = new ownerWindow.ResizeObserver(fit);
    const textObserver = new ownerWindow.MutationObserver(fit);
    observer.observe(label);
    textObserver.observe(label, {
        childList: true,
        characterData: true,
        subtree: true,
    });
    fit();
    return () => {
        observer.disconnect();
        textObserver.disconnect();
    };
};
