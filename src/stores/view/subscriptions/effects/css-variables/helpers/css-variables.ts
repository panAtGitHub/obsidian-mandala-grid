import { Theme } from 'src/mandala-settings/state/settings-type';

export const cssVariables = {
    colors: {
        activeBranchBg: '--background-active-node',
        activeBranchColor: '--color-active-node',
        containerBg: '--background-container',
    } satisfies Partial<Record<keyof Theme, string>>,
    cardWidth: '--node-width',
    nodeGap: '--node-gap-setting',
    minCardHeight: '--min-node-height',
    zoomLevel: '--zoom-level',
    viewWidth: '--view-width',
    viewHeight: '--view-height',
    inactiveCardOpacity: '--inactive-card-opacity',
};
