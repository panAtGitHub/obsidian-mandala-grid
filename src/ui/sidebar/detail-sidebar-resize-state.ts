import { get, writable } from 'svelte/store';

export const createDetailSidebarResizeState = ({
    isMobile,
    minSize,
    persistWidth,
}: {
    isMobile: boolean;
    minSize: number;
    persistWidth: (width: number) => void;
}) => {
    const animatedSize = writable(0);
    const sidebarSize = writable(minSize);
    const isResizing = writable(false);

    let startX = 0;
    let startSize = 0;
    let isPortraitResize = false;
    let contentEl: HTMLElement | null = null;

    const stopResize = () => {
        if (!get(isResizing) || isMobile) return;
        isResizing.set(false);
        contentEl?.removeEventListener('mousemove', onResize);
        contentEl?.removeEventListener('mouseup', stopResize);
        document.body.setCssProps({ cursor: '' });

        const nextSize = Math.max(minSize, get(animatedSize));
        animatedSize.set(nextSize);
        sidebarSize.set(nextSize);
        persistWidth(nextSize);
    };

    const onResize = (event: MouseEvent) => {
        if (!get(isResizing) || isMobile) return;
        event.preventDefault();

        if (isPortraitResize) {
            const dy = event.clientY - startX;
            animatedSize.set(Math.max(minSize, startSize - dy));
            return;
        }

        const dx = event.clientX - startX;
        animatedSize.set(Math.max(minSize, startSize - dx));
    };

    return {
        animatedSize,
        sidebarSize,
        isResizing,
        syncVisibility(show: boolean, savedSize: number | null | undefined) {
            if (isMobile) return;
            if (show) {
                const nextSize = savedSize || minSize;
                animatedSize.set(nextSize);
                sidebarSize.set(nextSize);
                return;
            }
            animatedSize.set(0);
        },
        startResize(
            event: MouseEvent,
            options: {
                isPortrait: boolean;
                contentEl: HTMLElement;
            },
        ) {
            if (isMobile) return;
            isResizing.set(true);
            isPortraitResize = options.isPortrait;
            contentEl = options.contentEl;
            startX = options.isPortrait ? event.clientY : event.clientX;
            startSize = get(animatedSize);
            options.contentEl.addEventListener('mousemove', onResize);
            options.contentEl.addEventListener('mouseup', stopResize);
            document.body.setCssProps({
                cursor: options.isPortrait ? 'row-resize' : 'col-resize',
            });
            event.preventDefault();
            event.stopPropagation();
        },
        destroy() {
            stopResize();
        },
    };
};
