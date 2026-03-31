import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { lang } from 'src/lang/lang';

export const Features9x9 = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    const settingsState = settingsStore.getValue();

    new Setting(element)
        .setName(lang.settings_features_9x9_parallel_nav_desktop)
        .addToggle((cb) => {
            cb.setValue(
                settingsState.view.show9x9ParallelNavButtonsDesktop ?? true,
            ).onChange((enabled) => {
                settingsStore.dispatch({
                    type: 'settings/view/toggle-9x9-parallel-nav-buttons-desktop',
                });
            });
        });

    new Setting(element)
        .setName(lang.settings_features_9x9_parallel_nav_mobile)
        .addToggle((cb) => {
            cb.setValue(
                settingsState.view.show9x9ParallelNavButtonsMobile ?? true,
            ).onChange((enabled) => {
                settingsStore.dispatch({
                    type: 'settings/view/toggle-9x9-parallel-nav-buttons-mobile',
                });
            });
        });

    new Setting(element)
        .setName(lang.settings_features_9x9_title_only)
        .addToggle((cb) => {
            cb.setValue(settingsState.view.show9x9TitleOnly).onChange(
                (enabled) => {
                    settingsStore.dispatch({
                        type: 'settings/view/toggle-9x9-title-only',
                    });
                },
            );
        });
};
