import MandalaGrid from 'src/main';

export const setMandalaDetailSidebarClosedForFile = (
    plugin: MandalaGrid,
    path: string,
) => {
    plugin.settings.dispatch({
        type: 'settings/documents/persist-mandala-view-state',
        payload: {
            path,
            gridOrientation: null,
            selectedLayoutId: null,
            lastActiveSection: null,
            subgridTheme: null,
            showDetailSidebarDesktop: false,
            showDetailSidebarMobile: false,
        },
    });
};
