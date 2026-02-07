import { SettingsStore } from 'src/main';
import {
    ExtraButtonComponent,
    Setting,
    SliderComponent,
    TextComponent,
} from 'obsidian';
import { lang } from 'src/lang/lang';
import { Settings } from 'src/stores/settings/settings-type';

export type RangeInputProps = {
    label: string;
    desc?: string;
    onChange: (value: number) => void;
    valueSelector: (settings: Settings) => number;
    defaultValue: number;
    min: number;
    max: number;
    step: number;
};

export const RangeSetting = (
    element: HTMLElement,
    settingsStore: SettingsStore,
    props: RangeInputProps,
) => {
    let slider: SliderComponent;
    let textInput: TextComponent;
    let resetButton: ExtraButtonComponent;

    const updateResetButton = (currentValue: number) => {
        resetButton.setDisabled(currentValue === props.defaultValue);
    };

    const setValues = () => {
        const settingsState = settingsStore.getValue();
        const currentValue =
            props.valueSelector(settingsState) ?? props.defaultValue;
        slider.setValue(currentValue);
        textInput.setValue(currentValue.toString());
        updateResetButton(currentValue);
    };

    const setting = new Setting(element);
    setting.setName(props.label);
    if (props.desc) {
        setting.setDesc(props.desc);
    }

    setting
        .addSlider((cb) => {
            slider = cb;
            cb.setLimits(props.min, props.max, props.step);

            cb.onChange((value) => {
                props.onChange(value);
                textInput.setValue(value.toString());
                updateResetButton(value);
            }).setDynamicTooltip();
        })
        .addText((cb) => {
            textInput = cb;
            cb.inputEl.type = 'number';
            cb.inputEl.setCssProps({
                width: '60px',
                'margin-left': '12px',
            });
            cb.setValue(
                (
                    props.valueSelector(settingsStore.getValue()) ??
                    props.defaultValue
                ).toString(),
            );

            cb.onChange((value) => {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    const clampedValue = Math.min(
                        Math.max(numValue, props.min),
                        props.max,
                    );
                    props.onChange(clampedValue);
                    slider.setValue(clampedValue);
                    updateResetButton(clampedValue);
                }
            });
        })
        .addExtraButton((cb) => {
            resetButton = cb;
            cb.setIcon('reset')
                .onClick(() => {
                    props.onChange(props.defaultValue);
                    setValues();
                })
                .setTooltip(lang.settings_reset);
        });
    setValues();
    return {
        setValues,
    };
};
