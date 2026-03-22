import { SettingsStore } from 'src/main';
import { lang } from 'src/lang/lang';
import { RangeSetting } from 'src/mandala-settings/ui/settings-panel/fields/shared/range-setting';
import { DEFAULT_H1_FONT_SIZE_EM } from 'src/mandala-settings/state/default-settings';

export const HeadingsFontSize = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    RangeSetting(element, settingsStore, {
        defaultValue: DEFAULT_H1_FONT_SIZE_EM,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/theme/set-h1-font-size',
                payload: {
                    fontSize_em: value,
                },
            });
        },
        valueSelector: (settingsState) => settingsState.view.h1FontSize_em,
        label: lang.settings_appearance_headings_font_size,
        max: 4,
        min: 1,
        step: 0.1,
    });
};
