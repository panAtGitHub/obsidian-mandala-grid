import Lineage from 'src/main';
import { TFile } from 'obsidian';

export const onVaultEvent = (plugin: Lineage) => {
    const onDeleteRef = plugin.app.vault.on('delete', (file) => {
        if (file instanceof TFile) {
            if (plugin.viewType[file.path]) {
                plugin.store.dispatch({
                    type: 'plugin/documents/unregister-document-store',
                    payload: {
                        path: file.path,
                    },
                });
                plugin.settings.dispatch({
                    type: 'settings/documents/delete-document-preferences',
                    payload: {
                        path: file.path,
                    },
                });
            }
        }
    });

    const onRenameRef = plugin.app.vault.on('rename', (file, oldPath) => {
        if (file instanceof TFile) {
            if (plugin.viewType[oldPath]) {
                plugin.store.dispatch({
                    type: 'plugin/documents/update-document-path',
                    payload: {
                        newPath: file.path,
                        oldPath,
                    },
                });
                plugin.settings.dispatch({
                    type: 'settings/documents/update-document-path',
                    payload: {
                        newPath: file.path,
                        oldPath,
                    },
                });
            }
        }
    });

    plugin.registerEvent(onDeleteRef);
    plugin.registerEvent(onRenameRef);
};
