import { SettingsStore } from 'src/main';
import { lang } from 'src/lang/lang';
import { RangeSetting } from 'src/view/actions/settings/components/shared/range-setting';

export const FontSize = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    RangeSetting(element, settingsStore, {
        defaultValue: 16,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/theme/set-font-size',
                payload: {
                    fontSize: value,
                },
            });
        },
        valueSelector: (settingsState) => settingsState.view.fontSize,
        label: lang.settings_appearance_font_size,
        max: 36,
        min: 6,
        step: 1,
    });
};
