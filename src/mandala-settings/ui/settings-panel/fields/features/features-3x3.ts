import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { lang } from 'src/lang/lang';
import { parsePositiveIntegerInput } from 'src/mandala-settings/state/helpers/section-range';

export const Features3x3 = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    const settingsState = settingsStore.getValue();

    new Setting(element)
        .setName(lang.settings_features_3x3_subgrid_nav_desktop)
        .addToggle((cb) => {
            cb.setValue(
                settingsState.view.show3x3SubgridNavButtonsDesktop ?? true,
            ).onChange((enabled) => {
                settingsStore.dispatch({
                    type: 'settings/view/toggle-3x3-subgrid-nav-buttons-desktop',
                });
            });
        });

    new Setting(element)
        .setName(lang.settings_features_3x3_subgrid_nav_mobile)
        .addToggle((cb) => {
            cb.setValue(
                settingsState.view.show3x3SubgridNavButtonsMobile ?? true,
            ).onChange((enabled) => {
                settingsStore.dispatch({
                    type: 'settings/view/toggle-3x3-subgrid-nav-buttons-mobile',
                });
            });
        });

    new Setting(element)
        .setName(lang.settings_global_core_section_max)
        .setDesc(lang.settings_global_range_input_empty)
        .addText((text) =>
            text
                .setPlaceholder('留空表示不限')
                .setValue(
                    settingsState.view.coreSectionMax === 'unlimited'
                        ? ''
                        : String(settingsState.view.coreSectionMax),
                )
                .onChange((value) => {
                    const parsed = parsePositiveIntegerInput(value);
                    if (!parsed.valid) return;
                    settingsStore.dispatch({
                        type: 'settings/view/set-core-section-max',
                        payload: { max: parsed.value },
                    });
                }),
        );

    new Setting(element)
        .setName(lang.settings_global_subgrid_max_depth)
        .setDesc(lang.settings_global_range_input_empty)
        .addText((text) =>
            text
                .setPlaceholder('留空表示不限')
                .setValue(
                    settingsState.view.subgridMaxDepth === 'unlimited'
                        ? ''
                        : String(settingsState.view.subgridMaxDepth),
                )
                .onChange((value) => {
                    const parsed = parsePositiveIntegerInput(value);
                    if (!parsed.valid) return;
                    settingsStore.dispatch({
                        type: 'settings/view/set-subgrid-max-depth',
                        payload: { depth: parsed.value },
                    });
                }),
        );
};
