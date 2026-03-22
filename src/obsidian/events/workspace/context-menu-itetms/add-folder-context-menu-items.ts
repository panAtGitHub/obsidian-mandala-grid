import { Menu, TFolder } from 'obsidian';
import MandalaGrid from 'src/main';
import { lang } from 'src/lang/lang';
import { customIcons } from 'src/shared/helpers/load-custom-icons';
import { createMandalaGridFileInFolder } from 'src/obsidian/events/workspace/effects/create-mandala-file-in-folder';

export const addFolderContextMenuItems = (
    menu: Menu,
    plugin: MandalaGrid,
    folder: TFolder,
) => {
    menu.addItem((item) => {
        item.setTitle(lang.ocm_new_document);
        item.setIcon(customIcons.mandalaGrid.name);
        item.onClick(() => {
            void createMandalaGridFileInFolder(plugin, folder);
        });
    });
};
