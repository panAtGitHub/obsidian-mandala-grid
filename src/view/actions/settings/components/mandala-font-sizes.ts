import type { SettingsStore } from 'src/main';
import { lang } from 'src/lang/lang';
import { RangeSetting } from 'src/view/actions/settings/components/shared/range-setting';

const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 36;
const STEP = 1;

export const MandalaFontSizes = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    RangeSetting(element, settingsStore, {
        label: lang.settings_appearance_mandala_font_size_3x3_desktop,
        defaultValue: 16,
        valueSelector: (settings) => settings.view.mandalaFontSize3x3Desktop,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/font-size/set-3x3-desktop',
                payload: { fontSize: value },
            });
        },
        min: MIN_FONT_SIZE,
        max: MAX_FONT_SIZE,
        step: STEP,
    });

    RangeSetting(element, settingsStore, {
        label: lang.settings_appearance_mandala_font_size_3x3_mobile,
        defaultValue: 12,
        valueSelector: (settings) => settings.view.mandalaFontSize3x3Mobile,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/font-size/set-3x3-mobile',
                payload: { fontSize: value },
            });
        },
        min: MIN_FONT_SIZE,
        max: MAX_FONT_SIZE,
        step: STEP,
    });

    RangeSetting(element, settingsStore, {
        label: lang.settings_appearance_mandala_font_size_9x9_desktop,
        defaultValue: 11,
        valueSelector: (settings) => settings.view.mandalaFontSize9x9Desktop,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/font-size/set-9x9-desktop',
                payload: { fontSize: value },
            });
        },
        min: MIN_FONT_SIZE,
        max: MAX_FONT_SIZE,
        step: STEP,
    });

    RangeSetting(element, settingsStore, {
        label: lang.settings_appearance_mandala_font_size_9x9_mobile,
        defaultValue: 10,
        valueSelector: (settings) => settings.view.mandalaFontSize9x9Mobile,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/font-size/set-9x9-mobile',
                payload: { fontSize: value },
            });
        },
        min: MIN_FONT_SIZE,
        max: MAX_FONT_SIZE,
        step: STEP,
    });

    RangeSetting(element, settingsStore, {
        label: lang.settings_appearance_mandala_font_size_sidebar_desktop,
        defaultValue: 16,
        valueSelector: (settings) =>
            settings.view.mandalaFontSizeSidebarDesktop,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/font-size/set-sidebar-desktop',
                payload: { fontSize: value },
            });
        },
        min: MIN_FONT_SIZE,
        max: MAX_FONT_SIZE,
        step: STEP,
    });

    RangeSetting(element, settingsStore, {
        label: lang.settings_appearance_mandala_font_size_sidebar_mobile,
        defaultValue: 12,
        valueSelector: (settings) =>
            settings.view.mandalaFontSizeSidebarMobile,
        onChange: (value) => {
            settingsStore.dispatch({
                type: 'settings/view/font-size/set-sidebar-mobile',
                payload: { fontSize: value },
            });
        },
        min: MIN_FONT_SIZE,
        max: MAX_FONT_SIZE,
        step: STEP,
    });
};
