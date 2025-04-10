import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { lang } from 'src/lang/lang';

export const LimitCardHeight = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    const settingsState = settingsStore.getValue();
    new Setting(element)
        .setName(lang.settings_layout_limit_card_height)
        .addToggle((cb) => {
            cb.setValue(settingsState.view.limitPreviewHeight).onChange(
                (limit) => {
                    settingsStore.dispatch({
                        type: 'settings/view/layout/set-limit-card-height',
                        payload: {
                            limit,
                        },
                    });
                },
            );
        });
};
