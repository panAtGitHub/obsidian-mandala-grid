import { SettingsStore } from 'src/main';
import { getDefaultTheme } from 'src/stores/view/subscriptions/effects/css-variables/helpers/get-default-theme';
import { lang } from 'src/lang/lang';
import { ColorSetting } from 'src/mandala-settings/ui/settings-panel/fields/shared/color-setting';

export const ActiveBranchBackground = (
    container: HTMLElement,
    settingsStore: SettingsStore,
    label?: string,
) => {
    ColorSetting(container, settingsStore, {
        defaultValue: getDefaultTheme().activeBranchBg,
        label: label || lang.settings_theme_active_branch_bg,
        valueSelector: (settings) => settings.view.theme.activeBranchBg,
        onChange: (color) => {
            settingsStore.dispatch({
                type: 'settings/view/theme/set-active-branch-bg-color',
                payload: {
                    backgroundColor: color,
                },
            });
        },
    });
};
