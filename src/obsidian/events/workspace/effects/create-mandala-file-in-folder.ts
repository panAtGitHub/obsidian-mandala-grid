import MandalaGrid from 'src/main';
import { TFolder } from 'obsidian';
import { createNewFile } from 'src/obsidian/events/workspace/effects/create-new-file';
import { openFileInMandalaGrid } from 'src/obsidian/events/workspace/effects/open-file-in-mandala';
import { createMandalaMarkdownTemplate } from 'src/mandala-display/logic/create-mandala-markdown-template';
import { onPluginError } from 'src/shared/store/on-plugin-error';
import { lang } from 'src/lang/lang';
import { createNewFileMandalaViewStateAction } from 'src/mandala-settings/state/current-file/mandala-view-state';
import {
    buildNewFileMandalaFrontmatterSettings,
    MANDALA_FRONTMATTER_SETTINGS_KEY,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';

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
            await plugin.app.fileManager.processFrontMatter(
                newFile,
                (frontmatter) => {
                    const record = frontmatter as Record<string, unknown>;
                    record[MANDALA_FRONTMATTER_SETTINGS_KEY] =
                        buildNewFileMandalaFrontmatterSettings(
                            plugin.settings.getValue(),
                            { dayPlan: false },
                        );
                },
            );
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
