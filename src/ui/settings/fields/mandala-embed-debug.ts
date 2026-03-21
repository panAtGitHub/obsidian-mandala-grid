import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { lang } from 'src/lang/lang';

export const MandalaEmbedDebug = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    const settingsState = settingsStore.getValue();
    new Setting(element)
        .setName(lang.settings_general_mandala_embed_debug)
        .setDesc(lang.settings_general_mandala_embed_debug_desc)
        .addToggle((cb) => {
            cb.setValue(settingsState.view.mandalaEmbedDebug).onChange(
                (enabled) => {
                    settingsStore.dispatch({
                        type: 'settings/view/set-mandala-embed-debug',
                        payload: {
                            enabled,
                        },
                    });
                },
            );
        });
};
