import { MandalaView } from 'src/view/view';

export const fixVimCursorWhenZooming = (view: MandalaView) => {
    if (view.zoomFactor === 1) return null;
    const config = (
        view.plugin.app.vault as unknown as { config?: { vimMode?: boolean } }
    ).config;
    if (!config?.vimMode) return null;

    const inlineEditor = view.inlineEditor.target;
    if (!inlineEditor) return null;

    const previousValues = { top: -1, lineHeight: -1, left: -1 };
    let animationFrame: number;

    const adjustCursorPosition = () => {
        const cursor = inlineEditor.querySelector(
            '.cm-cursor-primary',
        ) as HTMLDivElement;

        if (!cursor) {
            animationFrame = requestAnimationFrame(adjustCursorPosition);
            return;
        }

        const top = parseFloat(cursor.style.top);
        const left = parseFloat(cursor.style.left);
        const lineHeight = parseFloat(cursor.style.lineHeight);

        if (top !== previousValues.top) {
            cursor.style.top = `${(top + 1) / view.zoomFactor}px`;
            previousValues.top = parseFloat(cursor.style.top);
        }

        if (left !== previousValues.left) {
            cursor.style.left = `${left / view.zoomFactor}px`;
            previousValues.left = parseFloat(cursor.style.left);
        }

        if (lineHeight !== previousValues.lineHeight) {
            cursor.style.lineHeight = `${lineHeight / view.zoomFactor}px`;
            previousValues.lineHeight = parseFloat(cursor.style.lineHeight);
        }

        animationFrame = requestAnimationFrame(adjustCursorPosition);
    };

    animationFrame = requestAnimationFrame(adjustCursorPosition);

    return () => {
        cancelAnimationFrame(animationFrame);
    };
};
