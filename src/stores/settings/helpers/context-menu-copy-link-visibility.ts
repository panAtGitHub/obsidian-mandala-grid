import { Platform } from 'obsidian';
import {
    ContextMenuCopyLinkVisibility,
    Settings,
} from 'src/stores/settings/settings-type';

export const DEFAULT_CONTEXT_MENU_COPY_LINK_VISIBILITY: ContextMenuCopyLinkVisibility =
    {
        'block-plain': true,
        'block-embed': true,
        'heading-plain': true,
        'heading-embed': true,
        'heading-embed-dollar': true,
    };

export const normalizeContextMenuCopyLinkVisibility = (
    value: Partial<ContextMenuCopyLinkVisibility> | undefined,
): ContextMenuCopyLinkVisibility => ({
    'block-plain': value?.['block-plain'] ?? true,
    'block-embed': value?.['block-embed'] ?? true,
    'heading-plain': value?.['heading-plain'] ?? true,
    'heading-embed': value?.['heading-embed'] ?? true,
    'heading-embed-dollar': value?.['heading-embed-dollar'] ?? true,
});

export const resolveContextMenuCopyLinkVisibility = (view: Settings['view']) =>
    Platform.isMobile
        ? normalizeContextMenuCopyLinkVisibility(
              view.contextMenuCopyLinkVisibilityMobile,
          )
        : normalizeContextMenuCopyLinkVisibility(
              view.contextMenuCopyLinkVisibilityDesktop,
          );
