import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { LineageDocumentFormat } from 'src/stores/settings/settings-type';
import { lang } from 'src/lang/lang';

export const DefaultDocumentFormat = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    const settingsState = settingsStore.getValue();
    const setting = new Setting(element).setName(
        lang.settings_general_default_format,
    );
    setting.addDropdown((cb) => {
        const value = settingsState.general.defaultDocumentFormat;

        cb.addOptions({
            'html-element': lang.settings_format_html_elements,
            sections: lang.settings_format_html_comments,
            outline: lang.settings_format_outline,
        } satisfies Record<LineageDocumentFormat, string>)
            .setValue(value)
            .onChange((value) => {
                settingsStore.dispatch({
                    type: 'settings/general/set-default-document-format',
                    payload: {
                        format: value as LineageDocumentFormat,
                    },
                });
            });
    });
};
