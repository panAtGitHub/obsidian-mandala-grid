import MandalaGrid from 'src/main';
import { TFolder } from 'obsidian';
import { createNewFile } from 'src/obsidian/events/workspace/effects/create-new-file';
import { openFileInMandalaGrid } from 'src/obsidian/events/workspace/effects/open-file-in-mandala';
import { createMandalaMarkdownTemplate } from 'src/mandala-display/logic/create-mandala-markdown-template';
import { onPluginError } from 'src/shared/store/on-plugin-error';
import { lang } from 'src/lang/lang';
import { createNewFileMandalaViewStateAction } from 'src/mandala-settings/state/current-file/mandala-view-state';

export const createMandalaGridFileInFolder = async (
    plugin: MandalaGrid,
    folder: TFolder,
) => {
    try {
        const newFile = await createNewFile(
            plugin,
            folder,
            createMandalaMarkdownTemplate(),
            'Mandala',
        );
        if (newFile) {
            plugin.settings.dispatch(
                createNewFileMandalaViewStateAction(
                    newFile.path,
                    plugin.settings.getValue(),
                ),
            );
            await openFileInMandalaGrid(plugin, newFile, 'tab');
        }
    } catch (e) {
        onPluginError(e, 'command', lang.ocm_new_document);
    }
};
