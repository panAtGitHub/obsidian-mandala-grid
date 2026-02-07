import { MandalaView } from 'src/view/view';
import {
    MenuItemObject,
    renderContextMenu,
} from 'src/obsidian/context-menu/render-context-menu';
import { getPersistedDocumentFormat } from 'src/obsidian/events/workspace/helpers/get-persisted-document-format';
import { lang } from 'src/lang/lang';
import { setDocumentFormat } from 'src/stores/settings/actions/set-document-format';
import { exportDocument } from 'src/obsidian/commands/helpers/export-document/export-document';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { hasNHeadings } from 'src/lib/format-detection/has-n-headings';
import { ejectDocument } from 'src/obsidian/commands/helpers/export-document/eject-document';
import { createCoreJumpMenuItems } from 'src/view/actions/context-menu/helpers/create-core-jump-menu-items';
import { touchEventToMouseEvent } from 'src/obsidian/context-menu/touch-event-to-mouse-event';

export const showViewContextMenu = (
    event: MouseEvent | TouchEvent,
    view: MandalaView,
) => {
    const file = view.file;
    if (!file) return;

    const format = getPersistedDocumentFormat(view);
    const isOutline = format === 'outline';
    const isHtmlElement = format === 'html-element';
    const isHtmlComments = format === 'sections';

    const _hasHeading = hasNHeadings(view.data, 1);
    const coreJumpItems = createCoreJumpMenuItems(view);
    const menuItems: MenuItemObject[] = [
        ...coreJumpItems,
        ...(coreJumpItems.length
            ? ([{ type: 'separator' }] as MenuItemObject[])
            : []),
        {
            title: lang.cm_format_headings,
            icon: 'heading-1',
            action: () => {
                saveNodeContent(view);
                view.documentStore.dispatch({
                    type: 'document/format-headings',
                });
            },
            disabled: !_hasHeading,
        },
        { type: 'separator' },
        {
            title: lang.cm_document_format,
            icon: 'file-cog',
            submenu: [
                {
                    title: lang.settings_format_html_elements,
                    icon: 'file-cog',
                    action: () => {
                        setDocumentFormat(
                            view.plugin,
                            file.path,
                            'html-element',
                        );
                    },
                    checked: isHtmlElement,
                },
                {
                    title: lang.settings_format_html_comments,
                    icon: 'file-cog',
                    action: () => {
                        setDocumentFormat(view.plugin, file.path, 'sections');
                    },
                    checked: isHtmlComments,
                },
                {
                    title: lang.settings_format_outline,
                    icon: 'file-cog',
                    action: () => {
                        setDocumentFormat(view.plugin, file.path, 'outline');
                    },
                    checked: isOutline,
                },
            ],
        },
        { type: 'separator' },
        {
            title: lang.cm_export_document,
            icon: 'file-text',
            action: () => {
                exportDocument(view);
            },
        },
        {
            title: lang.cm_eject_document,
            icon: 'file-text',
            action: () => {
                ejectDocument(view);
            },
            dangerous: true,
        },
    ];

    const contextEvent = event.instanceOf(MouseEvent)
        ? event
        : touchEventToMouseEvent(event);
    if (!contextEvent) return;
    renderContextMenu(contextEvent, menuItems);
};
