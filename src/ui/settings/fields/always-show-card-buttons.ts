import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { lang } from 'src/lang/lang';

export const AlwaysShowCardButtons = (
    element: HTMLElement,
    settingsStore: SettingsStore,
    label?: string,
) => {
    const settingsState = settingsStore.getValue();
    new Setting(element)
        .setName(label || lang.settings_always_show_card_buttons)
        .setDesc(lang.settings_always_show_card_buttons_desc)
        .addToggle((cb) => {
            cb.setValue(settingsState.view.alwaysShowCardButtons).onChange(
                (show) => {
                    settingsStore.dispatch({
                        type: 'settings/view/set-always-show-card-buttons',
                        payload: {
                            show,
                        },
                    });
                },
            );
        });
};
