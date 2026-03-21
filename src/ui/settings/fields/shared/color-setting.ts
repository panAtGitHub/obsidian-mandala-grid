import { SettingsStore } from 'src/main';
import { ColorComponent, ExtraButtonComponent, Setting } from 'obsidian';
import { lang } from 'src/lang/lang';
import { Settings } from 'src/stores/settings/settings-type';

export type ColorInputProps = {
    label: string;
    onChange: (color: string | undefined) => void;
    valueSelector: (settings: Settings) => string | undefined;
    defaultValue: string;
};

export const ColorSetting = (
    container: HTMLElement,
    settingsStore: SettingsStore,
    props: ColorInputProps,
) => {
    let input: ColorComponent;
    let resetButton: ExtraButtonComponent;

    const updateExtraButton = (currentValue: string) => {
        if (currentValue === props.defaultValue) {
            resetButton.setDisabled(true);
        } else {
            resetButton.setDisabled(false);
        }
    };
    const setValue = () => {
        const settingsState = settingsStore.getValue();
        const currentValue =
            props.valueSelector(settingsState) || props.defaultValue;

        input.onChange(() => void undefined);
        input.setValue(currentValue);
        input.onChange((value) => {
            props.onChange(value);
            updateExtraButton(value);
        });
        updateExtraButton(currentValue);
    };

    new Setting(container)
        .setName(props.label)
        .addColorPicker((cb) => {
            input = cb;
        })
        .addExtraButton((cb) => {
            resetButton = cb;
            resetButton
                .setIcon('reset')
                .onClick(() => {
                    props.onChange(undefined);
                    setValue();
                })
                .setTooltip(lang.settings_reset);
        });
    setValue();
};
