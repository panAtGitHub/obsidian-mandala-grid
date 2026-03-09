const MANDALA_EMBED_CELL_SIZE_VAR = '--mandala-embed-cell-size';
const MANDALA_EMBED_FONT_SIZE_VAR = '--mandala-embed-font-size';
const MANDALA_EMBED_HEADER_FONT_SIZE_VAR = '--mandala-embed-header-font-size';
const MANDALA_EMBED_CONTENT_PADDING_Y_VAR = '--mandala-embed-content-padding-y';
const MANDALA_EMBED_CONTENT_PADDING_X_VAR = '--mandala-embed-content-padding-x';
const MANDALA_EMBED_CONTENT_PADDING_BOTTOM_VAR =
    '--mandala-embed-content-padding-bottom';
const MANDALA_EMBED_HEADER_PADDING_Y_VAR = '--mandala-embed-header-padding-y';
const MANDALA_EMBED_HEADER_PADDING_X_VAR = '--mandala-embed-header-padding-x';
const MANDALA_EMBED_HEADER_GAP_VAR = '--mandala-embed-header-gap';
const MANDALA_EMBED_HEADER_BUTTON_SIZE_VAR = '--mandala-embed-header-button-size';
const MANDALA_EMBED_HEADER_ICON_SIZE_VAR = '--mandala-embed-header-icon-size';
const MANDALA_EMBED_SECTION_FONT_SIZE_VAR = '--mandala-embed-section-font-size';
const MANDALA_EMBED_LINE_HEIGHT_VAR = '--mandala-embed-line-height';
const MANDALA_EMBED_SCROLLBAR_SIZE_VAR = '--mandala-embed-scrollbar-size';

const MANDALA_EMBED_DENSITY_COMPACT_CLASS = 'is-density-compact';
const MANDALA_EMBED_DENSITY_ULTRA_CLASS = 'is-density-ultra';

export const MANDALA_EMBED_ROOT_DENSITY_COMPACT_CLASS =
    'mandala-embed-density-compact';
export const MANDALA_EMBED_ROOT_DENSITY_ULTRA_CLASS =
    'mandala-embed-density-ultra';

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

type MandalaEmbedResponsiveSizing = {
    cellSize: number;
    isUltraDensity: boolean;
    isCompactDensity: boolean;
    contentFontSize: number;
    headerFontSize: number;
    sectionFontSize: number;
    contentPaddingY: number;
    contentPaddingX: number;
    contentPaddingBottom: number;
    headerPaddingY: number;
    headerPaddingX: number;
    headerGap: number;
    headerButtonSize: number;
    headerIconSize: number;
    lineHeight: number;
    scrollbarSize: number;
};

export const resolveMandalaEmbedResponsiveSizing = (
    width: number,
): MandalaEmbedResponsiveSizing | null => {
    if (width <= 0) return null;

    const cellSize = Math.max(1, Math.floor(width / 3));
    const scale = clamp(cellSize / 120, 0.45, 1.15);

    const isUltraDensity = cellSize < 72;
    const isCompactDensity = !isUltraDensity && cellSize < 96;

    return {
        cellSize,
        isUltraDensity,
        isCompactDensity,
        contentFontSize: clamp(Math.round(16 * scale), 9, 16),
        headerFontSize: clamp(Math.round(16 * scale * 1.15), 10, 18),
        sectionFontSize: clamp(Math.round(10 * scale), 7, 10),
        contentPaddingY: clamp(
            Math.round(8 * scale) - (isCompactDensity ? 1 : 0),
            2,
            8,
        ),
        contentPaddingX: clamp(
            Math.round(10 * scale) - (isCompactDensity ? 2 : 0),
            2,
            10,
        ),
        contentPaddingBottom: clamp(
            Math.round(14 * scale) - (isCompactDensity ? 3 : 0),
            4,
            14,
        ),
        headerPaddingY: clamp(
            Math.round(4 * scale) - (isCompactDensity ? 1 : 0),
            2,
            4,
        ),
        headerPaddingX: clamp(
            Math.round(8 * scale) - (isCompactDensity ? 1 : 0),
            4,
            8,
        ),
        headerGap: clamp(Math.round(8 * scale), 4, 8),
        headerButtonSize: clamp(
            Math.round(20 * scale) - (isCompactDensity ? 2 : 0),
            12,
            20,
        ),
        headerIconSize: clamp(
            Math.round(14 * scale) - (isCompactDensity ? 1 : 0),
            10,
            14,
        ),
        lineHeight: clamp(1.18 + scale * 0.2, 1.22, 1.4),
        scrollbarSize: isUltraDensity ? 3 : isCompactDensity ? 4 : 5,
    };
};

const applyMandalaEmbedResponsiveSizingState = ({
    rootEl,
    gridEl,
    sizing,
}: {
    rootEl: HTMLElement;
    gridEl: HTMLElement;
    sizing: MandalaEmbedResponsiveSizing;
}) => {
    gridEl.classList.toggle(
        MANDALA_EMBED_DENSITY_COMPACT_CLASS,
        sizing.isCompactDensity || sizing.isUltraDensity,
    );
    gridEl.classList.toggle(
        MANDALA_EMBED_DENSITY_ULTRA_CLASS,
        sizing.isUltraDensity,
    );
    rootEl.classList.toggle(
        MANDALA_EMBED_ROOT_DENSITY_COMPACT_CLASS,
        sizing.isCompactDensity || sizing.isUltraDensity,
    );
    rootEl.classList.toggle(
        MANDALA_EMBED_ROOT_DENSITY_ULTRA_CLASS,
        sizing.isUltraDensity,
    );

    gridEl.style.setProperty(
        MANDALA_EMBED_CELL_SIZE_VAR,
        `${sizing.cellSize}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_FONT_SIZE_VAR,
        `${sizing.contentFontSize}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_HEADER_FONT_SIZE_VAR,
        `${sizing.headerFontSize}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_SECTION_FONT_SIZE_VAR,
        `${sizing.sectionFontSize}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_CONTENT_PADDING_Y_VAR,
        `${sizing.contentPaddingY}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_CONTENT_PADDING_X_VAR,
        `${sizing.contentPaddingX}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_CONTENT_PADDING_BOTTOM_VAR,
        `${sizing.contentPaddingBottom}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_HEADER_PADDING_Y_VAR,
        `${sizing.headerPaddingY}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_HEADER_PADDING_X_VAR,
        `${sizing.headerPaddingX}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_HEADER_GAP_VAR,
        `${sizing.headerGap}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_HEADER_BUTTON_SIZE_VAR,
        `${sizing.headerButtonSize}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_HEADER_ICON_SIZE_VAR,
        `${sizing.headerIconSize}px`,
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_LINE_HEIGHT_VAR,
        sizing.lineHeight.toFixed(2),
    );
    gridEl.style.setProperty(
        MANDALA_EMBED_SCROLLBAR_SIZE_VAR,
        `${sizing.scrollbarSize}px`,
    );
};

export const applyMandalaEmbedResponsiveSizingSnapshot = ({
    rootEl,
    gridEl,
    width,
}: {
    rootEl: HTMLElement;
    gridEl: HTMLElement;
    width: number;
}) => {
    const sizing = resolveMandalaEmbedResponsiveSizing(width);
    if (!sizing) return false;

    applyMandalaEmbedResponsiveSizingState({
        rootEl,
        gridEl,
        sizing,
    });
    return true;
};

export const applyMandalaEmbedResponsiveSizing = ({
    rootEl,
    bodyEl,
    gridEl,
}: {
    rootEl: HTMLElement;
    bodyEl: HTMLElement;
    gridEl: HTMLElement;
}) => {
    let resizeObserver: ResizeObserver | null = null;
    let resizeRafId = 0;

    const update = () => {
        applyMandalaEmbedResponsiveSizingSnapshot({
            rootEl,
            gridEl,
            width: bodyEl.clientWidth,
        });
    };

    const scheduleUpdate = () => {
        if (resizeRafId !== 0) cancelAnimationFrame(resizeRafId);
        resizeRafId = requestAnimationFrame(() => {
            resizeRafId = 0;
            update();
        });
    };

    resizeObserver = new ResizeObserver(() => scheduleUpdate());
    resizeObserver.observe(bodyEl);
    scheduleUpdate();

    return () => {
        if (resizeRafId !== 0) {
            cancelAnimationFrame(resizeRafId);
            resizeRafId = 0;
        }
        resizeObserver?.disconnect();
        resizeObserver = null;
    };
};
