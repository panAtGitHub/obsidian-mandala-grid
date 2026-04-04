import MandalaGrid from 'src/main';

export const setMandalaDetailSidebarClosedForFile = (
    plugin: MandalaGrid,
    path: string,
) => {
    const settings = plugin.settings.getValue();
    plugin.settings.dispatch({
        type: 'settings/documents/persist-mandala-view-state',
        payload: {
            path,
            gridOrientation: settings.view.mandalaGridOrientation,
            selectedLayoutId: null,
            lastActiveSection: null,
            subgridTheme: null,
            showDetailSidebarDesktop: false,
            showDetailSidebarMobile: false,
        },
    });
};
