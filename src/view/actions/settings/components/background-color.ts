import { SettingsStore } from 'src/main';
import { getDefaultTheme } from 'src/stores/view/subscriptions/effects/css-variables/helpers/get-default-theme';
import { lang } from 'src/lang/lang';
import { ColorSetting } from 'src/view/actions/settings/components/shared/color-setting';

export const BackgroundColor = (
    container: HTMLElement,
    settingsStore: SettingsStore,
) => {
    ColorSetting(container, settingsStore, {
        defaultValue: getDefaultTheme().containerBg,
        label: lang.settings_theme_bg,
        valueSelector: (settings) => settings.view.theme.containerBg,
        onChange: (color) => {
            settingsStore.dispatch({
                type: 'settings/view/theme/set-container-bg-color',
                payload: {
                    backgroundColor: color,
                },
            });
        },
    });
};
