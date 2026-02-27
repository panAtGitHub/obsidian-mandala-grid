import { TFile, TFolder } from 'obsidian';
import MandalaGrid from 'src/main';
import { addToggleViewMenuItem } from 'src/obsidian/events/workspace/context-menu-itetms/add-toggle-view-menu-item';
import { addFolderContextMenuItems } from 'src/obsidian/events/workspace/context-menu-itetms/add-folder-context-menu-items';

export const registerFileMenuEvent = (plugin: MandalaGrid) => {
    plugin.registerEvent(
        plugin.app.workspace.on(
            'file-menu',
            (menu, abstractFile, _source, leaf) => {
                if (abstractFile instanceof TFile) {
                    addToggleViewMenuItem(menu, plugin, abstractFile, leaf);
                } else if (abstractFile instanceof TFolder) {
                    addFolderContextMenuItems(menu, plugin, abstractFile);
                }
            },
        ),
    );
};
