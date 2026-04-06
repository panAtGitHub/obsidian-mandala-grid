import { TFolder } from 'obsidian';
import MandalaGrid from 'src/main';
import { createMandalaMarkdownTemplate } from 'src/mandala-display/logic/create-mandala-markdown-template';
import { getActiveFile } from 'src/obsidian/commands/helpers/get-active-file';
import { createNewFile } from 'src/obsidian/events/workspace/effects/create-new-file';
import { onPluginError } from 'src/shared/store/on-plugin-error';
import { lang } from 'src/lang/lang';
import { setupDayPlanMandalaFormat } from 'src/obsidian/commands/helpers/setup-day-plan-mandala-format';
import { createNewFileMandalaViewStateAction } from 'src/mandala-settings/state/current-file/mandala-view-state';

export const createDayPlanDocument = async (plugin: MandalaGrid) => {
    try {
        const file = getActiveFile(plugin);
        let folder: TFolder | null = null;
        if (file) {
            folder = file.parent;
        } else {
            folder = plugin.app.vault.getRoot();
        }
        if (!folder) return;

        const newFile = await createNewFile(
            plugin,
            folder,
            createMandalaMarkdownTemplate(),
            'Day Plan',
        );
        if (!newFile) return;
        plugin.settings.dispatch(
            createNewFileMandalaViewStateAction(
                newFile.path,
                plugin.settings.getValue(),
            ),
        );
        const completed = await setupDayPlanMandalaFormat(plugin, newFile);
        if (!completed) {
            await plugin.app.vault.delete(newFile);
            plugin.settings.dispatch({
                type: 'settings/documents/delete-document-preferences',
                payload: {
                    path: newFile.path,
                },
            });
        }
    } catch (e) {
        onPluginError(e, 'command', lang.cmd_create_day_plan_document);
    }
};
