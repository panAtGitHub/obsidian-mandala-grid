import { SettingsStore } from 'src/main';
import { DEFAULT_CARD_WIDTH } from 'src/mandala-settings/state/default-settings';
import { lang } from 'src/lang/lang';
import { RangeSetting } from 'src/mandala-settings/ui/settings-panel/fields/shared/range-setting';

export const CardWidth = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    RangeSetting(element, settingsStore, {
        defaultValue: DEFAULT_CARD_WIDTH,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/layout/set-card-width',
                payload: {
                    width: value,
                },
            });
        },
        valueSelector: (settingsState) => settingsState.view.cardWidth,
        label: lang.settings_layout_card_width,
        max: 1000,
        min: 200,
        step: 10,
    });
};
