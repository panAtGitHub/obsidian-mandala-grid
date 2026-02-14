import MandalaGrid from 'src/main';
import { TFolder } from 'obsidian';
import { createNewFile } from 'src/obsidian/events/workspace/effects/create-new-file';
import { openFileInMandalaGrid } from 'src/obsidian/events/workspace/effects/open-file-in-mandala';
import { createMandalaMarkdownTemplate } from 'src/lib/mandala/create-mandala-markdown-template';
import { onPluginError } from 'src/lib/store/on-plugin-error';
import { lang } from 'src/lang/lang';

export const createMandalaGridFileInFolder = async (
    plugin: MandalaGrid,
    folder: TFolder,
) => {
    try {
        const format = 'sections';
        const newFile = await createNewFile(
            plugin,
            folder,
            createMandalaMarkdownTemplate(),
            'Mandala',
        );
        if (newFile) {
            await openFileInMandalaGrid(plugin, newFile, format, 'tab');
        }
    } catch (e) {
        onPluginError(e, 'command', lang.ocm_new_document);
    }
};
