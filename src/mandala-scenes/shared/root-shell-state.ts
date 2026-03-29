import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';

export const MIN_DESKTOP_DETAIL_SIDEBAR_SIZE = 200;

type ThemeStyleSource = Pick<CSSStyleDeclaration, 'getPropertyValue'>;
type ThemeBodySource = Pick<HTMLElement, 'classList'>;

type DesktopSquareSizeOptions = {
    isMobile: boolean;
    squareLayout: boolean;
    wrapperWidth: number;
    wrapperHeight: number;
    showDetailSidebar: boolean;
    detailSidebarWidth: number;
};

export const resolveSceneThemeSnapshot = (
    body: ThemeBodySource,
    styles: ThemeStyleSource,
): MandalaThemeSnapshot => {
    const inactiveThemeUnderlayColor =
        styles.getPropertyValue('--background-active-parent').trim() ||
        styles.getPropertyValue('--background-primary').trim();
    const activeThemeUnderlayColor =
        styles.getPropertyValue('--background-active-node').trim() ||
        inactiveThemeUnderlayColor;

    return {
        themeTone: body.classList.contains('theme-dark') ? 'dark' : 'light',
        themeUnderlayColor: inactiveThemeUnderlayColor,
        activeThemeUnderlayColor,
    };
};

export const resolveDesktopSquareSize = ({
    isMobile,
    squareLayout,
    wrapperWidth,
    wrapperHeight,
    showDetailSidebar,
    detailSidebarWidth,
}: DesktopSquareSizeOptions) => {
    if (isMobile || !squareLayout) {
        return 0;
    }

    const sidebarMinWidth = showDetailSidebar
        ? Math.max(
              MIN_DESKTOP_DETAIL_SIDEBAR_SIZE,
              detailSidebarWidth || MIN_DESKTOP_DETAIL_SIDEBAR_SIZE,
          )
        : 0;
    const availableWidth = Math.max(0, wrapperWidth - sidebarMinWidth);
    return Math.floor(Math.max(0, Math.min(wrapperHeight, availableWidth)));
};
