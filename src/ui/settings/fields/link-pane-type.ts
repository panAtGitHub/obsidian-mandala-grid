import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { LinkPaneType as TLinkPaneType } from 'src/stores/settings/settings-type';
import { lang } from 'src/lang/lang';
import { isMacLike } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/mod-key';

export const LinkPaneType = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    const settingsState = settingsStore.getValue();
    const setting = new Setting(element).setName(
        lang.settings_general_link_behavior,
    );
    setting.setDesc(
        `Hold '${isMacLike ? 'cmd' : 'control'}' to use the other option`,
    );
    setting.addDropdown((cb) => {
        const value = settingsState.general.linkPaneType;

        cb.addOptions({
            split: lang.settings_general_link_split,
            tab: lang.settings_general_link_tab,
        } satisfies Record<TLinkPaneType, string>)
            .setValue(value)
            .onChange((value) => {
                settingsStore.dispatch({
                    type: 'settings/general/set-link-pane-type',
                    payload: {
                        position: value as TLinkPaneType,
                    },
                });
            });
    });
};
