import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { lang } from 'src/lang/lang';

export const DefaultDocumentFormat = (
    element: HTMLElement,
    _settingsStore: SettingsStore,
) => {
    const setting = new Setting(element).setName(
        lang.settings_general_default_format,
    );
    setting.addText((cb) => {
        cb.setValue('sections').setDisabled(true);
    });
    setting.setDesc('Sections format only.');
};
