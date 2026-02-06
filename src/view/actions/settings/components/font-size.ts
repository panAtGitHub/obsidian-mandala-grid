import type { SettingsStore } from 'src/main';
import { lang } from 'src/lang/lang';
import { RangeSetting } from 'src/view/actions/settings/components/shared/range-setting';
import { localFontStore } from 'src/stores/local-font-store';
import { get } from 'svelte/store';

export const FontSize = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    const range = RangeSetting(element, settingsStore, {
        defaultValue: 16,
        onChange: (value) => {
            localFontStore.setFontSize(value);
        },
        valueSelector: () => get(localFontStore),
        label: lang.settings_appearance_font_size,
        max: 36,
        min: 6,
        step: 1,
    });

    // 订阅本地 store 变化，以便在卡片上调节时，设置面板能同步更新
    const unsub = localFontStore.subscribe(() => {
        if (range && range.setValues) range.setValues();
    });

    // 由于这是个普通的函数而非 Svelte 组件，我们需要一种方式来清理订阅
    // 这里简单依赖 element 的移除或者不处理（设置面板通常是一次性的）
    // 为了稳妥，我们可以返回一个清理函数
    return unsub;
};
