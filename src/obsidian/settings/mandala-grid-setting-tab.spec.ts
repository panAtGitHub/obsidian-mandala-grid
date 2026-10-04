/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    update: vi.fn(),
    cleanup: vi.fn(),
    onTextChange: null as null | ((value: string) => Promise<void>),
}));
vi.mock('obsidian', () => {
    const createNode = (
        tag: string,
        options: {
            cls?: string;
            text?: string;
            attr?: Record<string, string>;
        } = {},
    ): HTMLElement => {
        const node = document.createElement(tag);
        node.className = options.cls ?? '';
        node.textContent = options.text ?? '';
        for (const [key, value] of Object.entries(options.attr ?? {}))
            node.setAttribute(key, value);
        const append = (child: HTMLElement) => {
            node.appendChild(child);
            return child;
        };
        Object.assign(node, {
            addClass: (name: string) => node.classList.add(name),
            setText: (text: string) => {
                node.textContent = text;
            },
            createDiv: (opts: typeof options) =>
                append(createNode('div', opts)),
            createSpan: (opts: typeof options) =>
                append(createNode('span', opts)),
            createEl: (name: string, opts: typeof options) =>
                append(createNode(name, opts)),
        });
        return node;
    };
    return {
        getLanguage: () => 'en',
        Notice: class {},
        PluginSettingTab: class {
            constructor(public app: unknown) {}
            containerEl = createNode('div');
            update = mocks.update;
        },
        Setting: class {
            settingEl: HTMLElement;
            descEl: HTMLElement;
            constructor(parent: HTMLElement) {
                this.settingEl = createNode('div');
                parent.appendChild(this.settingEl);
                this.descEl = this.settingEl.createDiv({});
            }
            setDesc(desc: string) {
                this.descEl.textContent = desc;
                return this;
            }
            addText(callback: (text: unknown) => void) {
                const input = document.createElement('input');
                this.settingEl.appendChild(input);
                const text = {
                    setPlaceholder(value: string) {
                        input.placeholder = value;
                        return text;
                    },
                    setValue(value: string) {
                        input.value = value;
                        return text;
                    },
                    onChange(handler: (value: string) => Promise<void>) {
                        mocks.onTextChange = handler;
                        return text;
                    },
                };
                callback(text);
                return this;
            }
        },
    };
});
vi.mock('src/view/view', () => ({ MandalaView: class {} }));
vi.mock('src/obsidian/settings/fit-settings-label', () => ({
    fitSettingsLabel: () => mocks.cleanup,
}));
import { Setting } from 'obsidian';
import type { SettingDefinition, SettingDefinitionItem } from 'obsidian';
import { MandalaGridSettingTab } from 'src/obsidian/settings/mandala-grid-setting-tab';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import { settingsReducer } from 'src/mandala-settings/state/settings-reducer';
import { setInterfaceLanguage } from 'src/lang/interface-language';
import type { SettingsActions } from 'src/mandala-settings/state/settings-store-actions';

const flatten = (items: SettingDefinitionItem[]): SettingDefinition[] =>
    items.flatMap((item) =>
        'items' in item
            ? flatten(item.items ?? [])
            : 'name' in item
              ? [item]
              : [],
    );
const setup = () => {
    const settings = DEFAULT_SETTINGS();
    const activeView = { setMandalaMode: vi.fn(async () => {}) };
    const app = { workspace: { getActiveViewOfType: () => activeView } };
    const plugin = {
        settings: {
            getValue: () => settings,
            dispatch: (action: SettingsActions) =>
                settingsReducer(settings, action),
        },
        saveSettings: vi.fn(async () => {}),
        refreshCommands: vi.fn(),
    };
    const tab = new MandalaGridSettingTab(app as never, plugin as never);
    const find = (name: string) => {
        const definition = flatten(tab.getSettingDefinitions()).find(
            (item) => item.name === name,
        );
        if (!definition) throw new Error(`Missing setting: ${name}`);
        return definition;
    };
    const render = (name: string) => {
        const definition = find(name);
        const setting = new Setting(tab.containerEl);
        if (definition.desc) setting.setDesc(definition.desc);
        const cleanup = definition.render?.(setting, {} as never);
        return { setting, cleanup };
    };
    return { tab, settings, plugin, activeView, find, render };
};

beforeEach(() => {
    setInterfaceLanguage('auto');
    vi.clearAllMocks();
    mocks.onTextChange = null;
});

describe('declarative plugin settings', () => {
    it('indexes every setting without rendering or saving', () => {
        const { tab, plugin } = setup();
        const names = flatten(tab.getSettingDefinitions()).map(
            (item) => item.name,
        );
        expect(names).toEqual([
            'Interface language',
            'Preset',
            'Enable 9×9 view',
            'Enable nx9 view',
            'Core section range (1–n)',
            'Maximum subgrid depth (including core level)',
            'Current range overview',
            'Enable time plans (day and week)',
        ]);
        expect(tab.containerEl.childElementCount).toBe(0);
        expect(plugin.saveSettings).not.toHaveBeenCalled();
    });
    it('saves a language override and updates definitions in the chosen language', async () => {
        const { tab, settings, plugin, find } = setup();
        expect(find('Interface language').control).toMatchObject({
            type: 'dropdown',
            options: { auto: 'Follow Obsidian', zh: '简体中文', en: 'English' },
        });
        await tab.setControlValue('interfaceLanguage', 'zh');
        expect(settings.general.interfaceLanguage).toBe('zh');
        expect(tab.getControlValue('interfaceLanguage')).toBe('zh');
        expect(plugin.saveSettings).toHaveBeenCalledOnce();
        expect(plugin.refreshCommands).toHaveBeenCalledOnce();
        expect(mocks.update).toHaveBeenCalledOnce();
        expect(find('界面语言')).toBeDefined();
    });
    it('disables an active large grid and returns to 3×3', async () => {
        const { tab, settings, activeView, plugin } = setup();
        settings.view.enable9x9View = true;
        settings.view.mandalaMode = '9x9';
        await tab.setControlValue('enable9x9View', false);
        expect(tab.getControlValue('enable9x9View')).toBe(false);
        expect(settings.view.mandalaMode).toBe('3x3');
        expect(activeView.setMandalaMode).toHaveBeenCalledWith('3x3');
        expect(plugin.saveSettings).toHaveBeenCalledOnce();
    });
    it('keeps day and week plan switches synchronized', async () => {
        const { tab, settings } = setup();
        await tab.setControlValue('timePlanEnabled', false);
        expect(settings.general.dayPlanEnabled).toBe(false);
        expect(settings.general.weekPlanEnabled).toBe(false);
        await tab.setControlValue('timePlanEnabled', true);
        expect(tab.getControlValue('timePlanEnabled')).toBe(true);
    });
    it('does not toggle an already matching switch or persist unknown controls', async () => {
        const { tab, settings, plugin } = setup();
        const enabled = settings.view.enableNx9View;
        await tab.setControlValue('enableNx9View', enabled);
        expect(settings.view.enableNx9View).toBe(enabled);
        plugin.saveSettings.mockClear();
        await tab.setControlValue('enableNx9View', 'false');
        await tab.setControlValue('unknown', true);
        expect(plugin.saveSettings).not.toHaveBeenCalled();
    });
    it('applies a preset repeatedly without flipping matching switches and cleans up labels', async () => {
        const { tab, settings, render } = setup();
        const { setting, cleanup } = render('Preset');
        const buttons = setting.settingEl.querySelectorAll('button');
        expect(buttons).toHaveLength(6);
        buttons[0].click();
        await vi.waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
        buttons[0].click();
        await vi.waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
        expect(settings.view).toMatchObject({
            enable9x9View: true,
            enableNx9View: false,
            coreSectionMax: 1,
            subgridMaxDepth: 3,
        });
        expect(
            tab.containerEl
                .querySelector('.mandala-settings-view-presets__grid')
                ?.getAttribute('style'),
        ).toContain('repeat(3, minmax(0, 1fr))');
        cleanup?.();
        expect(mocks.cleanup).toHaveBeenCalledTimes(6);
    });
    it('validates ranges and refreshes previews without redrawing the focused input', async () => {
        const { settings, plugin, render } = setup();
        const preview = render('Current range overview');
        const range = render('Core section range (1–n)');
        const handler = mocks.onTextChange;
        if (!handler) throw new Error('Range input was not rendered');
        const previous = settings.view.coreSectionMax;
        await handler('invalid');
        expect(settings.view.coreSectionMax).toBe(previous);
        expect(plugin.saveSettings).not.toHaveBeenCalled();
        await handler('12');
        expect(settings.view.coreSectionMax).toBe(12);
        expect(preview.setting.descEl.textContent).toContain(
            'Core range: 1–12',
        );
        expect(mocks.update).not.toHaveBeenCalled();
        await handler('');
        expect(settings.view.coreSectionMax).toBe('unlimited');
        range.cleanup?.();
        preview.cleanup?.();
    });
});
