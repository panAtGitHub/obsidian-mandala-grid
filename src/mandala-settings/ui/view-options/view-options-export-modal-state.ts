import { get, writable } from 'svelte/store';

export const createViewOptionsExportModalState = ({
    isMobile,
}: {
    isMobile: boolean;
}) => {
    const position = writable<{ left: number; top: number } | null>(null);
    const dragOffset = writable<{ x: number; y: number } | null>(null);
    const dragCandidate = writable<{
        offsetX: number;
        offsetY: number;
    } | null>(null);

    const readCssLengthVar = (
        styles: CSSStyleDeclaration,
        name: string,
    ): number => {
        const raw = styles.getPropertyValue(name).trim();
        if (!raw) return 0;
        const parsed = Number.parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const getExportModalSafeTop = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const bodyStyles = getComputedStyle(document.body);
        const headerHeight = Math.max(
            readCssLengthVar(rootStyles, '--header-height'),
            readCssLengthVar(bodyStyles, '--header-height'),
            40,
        );
        const titlebarHeight = Math.max(
            readCssLengthVar(rootStyles, '--titlebar-height'),
            readCssLengthVar(bodyStyles, '--titlebar-height'),
        );
        return Math.max(headerHeight, titlebarHeight, 40) + 8;
    };

    const clampPosition = (left: number, top: number) => {
        const width = Math.min(420, window.innerWidth - 24);
        const margin = 8;
        const maxLeft = Math.max(margin, window.innerWidth - width - margin);
        const minTop = getExportModalSafeTop();
        const maxTop = Math.max(minTop, window.innerHeight - 120);
        return {
            left: Math.min(Math.max(left, margin), maxLeft),
            top: Math.min(Math.max(top, minTop), maxTop),
        };
    };

    const getPointer = (event: MouseEvent | TouchEvent) => {
        if (event instanceof MouseEvent) {
            return { x: event.clientX, y: event.clientY };
        }
        if (event.touches.length > 0) {
            return {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
            };
        }
        return null;
    };

    return {
        position,
        open() {
            const initialWidth = Math.min(420, window.innerWidth - 24);
            const initialTop = getExportModalSafeTop();
            position.set(
                clampPosition(window.innerWidth - initialWidth - 16, initialTop),
            );
            dragOffset.set(null);
            dragCandidate.set(null);
        },
        close() {
            dragOffset.set(null);
            dragCandidate.set(null);
        },
        handleEscape(
            event: KeyboardEvent,
            isExportModeModalOpen: boolean,
            onClose: () => void,
        ) {
            if (!isExportModeModalOpen) return;
            if (event.key !== 'Escape') return;
            event.preventDefault();
            onClose();
        },
        startDrag(
            event: MouseEvent | TouchEvent,
            isExportModeModalOpen: boolean,
        ) {
            if (isMobile || !isExportModeModalOpen) return;
            if (event instanceof MouseEvent && event.button !== 0) return;
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.closest('.view-options-menu__close')) return;
            const modal = target.closest('.export-mode-modal');
            if (!(modal instanceof HTMLElement)) return;
            const pointer = getPointer(event);
            if (!pointer) return;

            const rect = modal.getBoundingClientRect();
            dragOffset.set(null);
            dragCandidate.set({
                offsetX: pointer.x - rect.left,
                offsetY: pointer.y - rect.top,
            });
        },
        moveDrag(
            event: MouseEvent | TouchEvent,
            isExportModeModalOpen: boolean,
        ) {
            if (isMobile || !isExportModeModalOpen) return;
            if (event instanceof MouseEvent && event.buttons !== 1) return;
            const pointer = getPointer(event);
            if (!pointer) return;

            const currentDragOffset = get(dragOffset);
            const currentDragCandidate = get(dragCandidate);

            if (!currentDragOffset && currentDragCandidate) {
                dragOffset.set({
                    x: currentDragCandidate.offsetX,
                    y: currentDragCandidate.offsetY,
                });
            }

            const nextDragOffset = get(dragOffset);
            if (!nextDragOffset) return;

            position.set(
                clampPosition(
                    pointer.x - nextDragOffset.x,
                    pointer.y - nextDragOffset.y,
                ),
            );
            event.preventDefault();
        },
        stopDrag() {
            dragOffset.set(null);
            dragCandidate.set(null);
        },
        toInlineStyle(value: { left: number; top: number } | null) {
            if (isMobile || !value) return undefined;
            return `left:${value.left}px;top:${value.top}px;right:auto;`;
        },
    };
};
