import { SettingsStore } from 'src/main';
import { DEFAULT_INACTIVE_NODE_OPACITY } from 'src/stores/settings/default-settings';
import { lang } from 'src/lang/lang';
import { RangeSetting } from 'src/ui/settings/fields/shared/range-setting';

export const InactiveCardOpacity = (
    element: HTMLElement,
    settingsStore: SettingsStore,
    label?: string,
) => {
    RangeSetting(element, settingsStore, {
        defaultValue: DEFAULT_INACTIVE_NODE_OPACITY,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/theme/set-inactive-node-opacity',
                payload: {
                    opacity: value,
                },
            });
        },
        valueSelector: (settingsState) =>
            settingsState.view.theme.inactiveNodeOpacity,
        label: label || lang.settings_appearance_inactive_node_opacity,
        max: 100,
        min: 0,
        step: 5,
    });
};
