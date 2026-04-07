import { SettingsStore } from 'src/main';
import { Setting } from 'obsidian';
import { Platform } from 'obsidian';
import { lang } from 'src/lang/lang';
import {
    ContextMenuCopyLinkVariant,
} from 'src/mandala-settings/state/settings-type';
import {
    normalizeContextMenuCopyLinkVisibility,
} from 'src/mandala-settings/state/helpers/context-menu-copy-link-visibility';

export const FeaturesGeneral = (
    element: HTMLElement,
    settingsStore: SettingsStore,
) => {
    const settingsState = settingsStore.getValue();

    new Setting(element)
        .setName(lang.settings_features_hidden_card_info)
        .addToggle((cb) => {
            cb.setValue(settingsState.view.showHiddenCardInfo).onChange(
                (_enabled) => {
                    settingsStore.dispatch({
                        type: 'settings/view/toggle-hidden-card-info',
                    });
                },
            );
        });

    new Setting(element)
        .setName(lang.settings_features_cell_quick_preview_desktop)
        .addToggle((cb) => {
            cb.setValue(
                settingsState.view.showCellQuickPreviewDialogDesktop ?? true,
            ).onChange((_enabled) => {
                settingsStore.dispatch({
                    type: 'settings/view/toggle-cell-quick-preview-dialog-desktop',
                });
            });
        });

    new Setting(element)
        .setName(lang.settings_features_cell_quick_preview_mobile)
        .addToggle((cb) => {
            cb.setValue(
                settingsState.view.showCellQuickPreviewDialogMobile ?? false,
            ).onChange((_enabled) => {
                settingsStore.dispatch({
                    type: 'settings/view/toggle-cell-quick-preview-dialog-mobile',
                });
            });
        });

    // Context menu copy link variants
    const contextMenuDetails = element.createEl('details', {
        cls: 'mandala-context-menu-settings',
    });
    contextMenuDetails.createEl('summary', {
        text: lang.settings_display_context_menu_advanced,
    });
    const contextMenuContent = contextMenuDetails.createEl('div', {
        cls: 'mandala-context-menu-settings__content',
    });

    const isMobile = Platform.isMobile;
    const visibility = isMobile
        ? normalizeContextMenuCopyLinkVisibility(
              settingsState.view.contextMenuCopyLinkVisibilityMobile,
          )
        : normalizeContextMenuCopyLinkVisibility(
              settingsState.view.contextMenuCopyLinkVisibilityDesktop,
          );

    const variants: ContextMenuCopyLinkVariant[] = [
        'block-plain',
        'block-embed',
        'heading-plain',
        'heading-embed',
        'heading-embed-dollar',
    ];
    const labels: Record<ContextMenuCopyLinkVariant, string> = {
        'block-plain': lang.settings_display_copy_block_link_plain,
        'block-embed': lang.settings_display_copy_block_link_embed,
        'heading-plain': lang.settings_display_copy_heading_link_plain,
        'heading-embed': lang.settings_display_copy_heading_link_embed,
        'heading-embed-dollar':
            lang.settings_display_copy_heading_link_embed_dollar,
    };

    for (const variant of variants) {
        new Setting(contextMenuContent)
            .setName(labels[variant])
            .addToggle((cb) => {
                cb.setValue(visibility[variant]).onChange((visible) => {
                    settingsStore.dispatch({
                        type: 'settings/view/context-menu-copy-link/set-visibility',
                        payload: { variant, visible },
                    });
                });
            });
    }
};
