import { SettingsStore } from 'src/main';
import { DEFAULT_CARDS_GAP } from 'src/stores/settings/default-settings';
import { lang } from 'src/lang/lang';
import { RangeSetting } from 'src/ui/settings/fields/shared/range-setting';

export const CardsGap = (
    element: HTMLElement,
    settingsStore: SettingsStore,
    label?: string,
    max?: number,
    step?: number,
) => {
    RangeSetting(element, settingsStore, {
        defaultValue: DEFAULT_CARDS_GAP,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/layout/set-cards-gap',
                payload: {
                    gap: value,
                },
            });
        },
        valueSelector: (settingsState) => settingsState.view.cardsGap,
        label: label || lang.settings_layout_space_between_cards,
        max: max ?? 500,
        min: 0,
        step: step ?? 10,
    });
};
