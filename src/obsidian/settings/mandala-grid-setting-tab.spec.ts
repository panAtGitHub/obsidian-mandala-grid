/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    onLanguageChange: null as null | ((value: string) => Promise<void>),
}));
vi.mock('obsidian', () => ({
    getLanguage: () => 'en',
    Notice: class {},
    PluginSettingTab: class {
        containerEl = document.createElement('div');
    },
    Setting: class {
        element: HTMLElement;
        constructor(parent: HTMLElement) {
            this.element = document.createElement('div');
            parent.appendChild(this.element);
        }
        setName(name: string) {
            this.element.textContent = name;
            return this;
        }
        setDesc() {
            return this;
        }
        setHeading() {
            return this;
        }
        addDropdown(callback: (dropdown: unknown) => void) {
            const select = document.createElement('select');
            this.element.appendChild(select);
            const dropdown = {
                addOption(value: string, label: string) {
                    select.add(new Option(label, value));
                    return dropdown;
                },
                setValue(value: string) {
                    select.value = value;
                    return dropdown;
                },
                onChange(handler: (value: string) => Promise<void>) {
                    mocks.onLanguageChange = handler;
                    return dropdown;
                },
            };
            callback(dropdown);
            return this;
        }
    },
}));
vi.mock('src/view/view', () => ({ MandalaView: class {} }));
vi.mock('src/obsidian/settings/fit-settings-label', () => ({
    fitSettingsLabel: () => () => {},
}));
vi.mock('src/obsidian/settings/render-mandala-core-settings', () => ({
    renderMandalaCoreSettings: vi.fn(),
}));
import { MandalaGridSettingTab } from 'src/obsidian/settings/mandala-grid-setting-tab';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import { settingsReducer } from 'src/mandala-settings/state/settings-reducer';
import { setInterfaceLanguage } from 'src/lang/interface-language';
import type { SettingsActions } from 'src/mandala-settings/state/settings-store-actions';

beforeEach(() => {
    setInterfaceLanguage('auto');
    mocks.onLanguageChange = null;
});

describe('language selector', () => {
    it('renders language options, saves an override and redraws in the selected language', async () => {
        const settings = DEFAULT_SETTINGS();
        const plugin = {
            settings: {
                getValue: () => settings,
                dispatch: (action: SettingsActions) =>
                    settingsReducer(settings, action),
            },
            saveSettings: vi.fn(async () => {}),
            refreshCommands: vi.fn(),
        };
        const tab = new MandalaGridSettingTab({} as never, plugin as never);
        tab.containerEl.empty = () => tab.containerEl.replaceChildren();
        tab.containerEl.addClass = (name: string) =>
            tab.containerEl.classList.add(name);
        tab.display();
        expect(tab.containerEl.textContent).toContain('Interface language');
        expect(
            Array.from(tab.containerEl.querySelectorAll('option')).map(
                (option) => option.value,
            ),
        ).toEqual(['auto', 'zh', 'en']);
        const onChange = mocks.onLanguageChange;
        expect(onChange).not.toBeNull();
        if (!onChange) throw new Error('Language selector was not initialized');
        await onChange('zh');
        expect(settings.general.interfaceLanguage).toBe('zh');
        expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
        expect(plugin.refreshCommands).toHaveBeenCalledTimes(1);
        expect(tab.containerEl.textContent).toContain('界面语言');
        expect(tab.containerEl.querySelector('select')?.value).toBe('zh');
    });
});
