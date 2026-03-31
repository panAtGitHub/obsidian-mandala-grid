import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { lang } from 'src/lang/lang';

export const Features3x3 = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    const settingsState = settingsStore.getValue();

    new Setting(element)
        .setName(lang.settings_features_3x3_subgrid_nav_desktop)
        .addToggle((cb) => {
            cb.setValue(
                settingsState.view.show3x3SubgridNavButtonsDesktop ?? true,
            ).onChange((enabled) => {
                settingsStore.dispatch({
                    type: 'settings/view/toggle-3x3-subgrid-nav-buttons-desktop',
                });
            });
        });

    new Setting(element)
        .setName(lang.settings_features_3x3_subgrid_nav_mobile)
        .addToggle((cb) => {
            cb.setValue(
                settingsState.view.show3x3SubgridNavButtonsMobile ?? true,
            ).onChange((enabled) => {
                settingsStore.dispatch({
                    type: 'settings/view/toggle-3x3-subgrid-nav-buttons-mobile',
                });
            });
        });

    new Setting(element)
        .setName(lang.settings_features_3x3_infinite_nesting)
        .setDesc(lang.settings_features_3x3_infinite_nesting_desc)
        .addToggle((cb) => {
            cb.setValue(
                settingsState.view.enable3x3InfiniteNesting ?? true,
            ).onChange((enabled) => {
                settingsStore.dispatch({
                    type: 'settings/view/toggle-3x3-infinite-nesting',
                });
            });
        });
};
