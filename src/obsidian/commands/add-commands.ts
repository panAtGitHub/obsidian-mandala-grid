import { Command } from 'obsidian';
import MandalaGrid from 'src/main';
import { lang } from 'src/lang/lang';
import { slugify } from 'src/helpers/slugify';
import { toggleFileViewType } from 'src/obsidian/events/workspace/effects/toggle-file-view-type';
import { customIcons } from 'src/helpers/load-custom-icons';
import { getActiveFile } from 'src/obsidian/commands/helpers/get-active-file';
import { createMandalaGridDocument } from 'src/obsidian/events/workspace/effects/create-mandala-document';
import { onPluginError } from 'src/lib/store/on-plugin-error';
import { setupDayPlanMandalaFormat } from 'src/obsidian/commands/helpers/setup-day-plan-mandala-format';
import { MANDALA_VIEW_TYPE } from 'src/view/view';
import { getCurrentViewTypeForFile } from 'src/obsidian/events/workspace/helpers/get-current-view-type-for-file';
import { getLeafOfFile } from 'src/obsidian/events/workspace/helpers/get-leaf-of-file';

const createCommands = (plugin: MandalaGrid) => {
    const commands: (Omit<Command, 'id' | 'callback'> & {
        commandId: string;
        checkCallback: (checking: boolean) => boolean | void;
    })[] = [];
    commands.push({
        commandId: 'open-active-file-in-mandala-view',
        name: lang.ocm_open_in_mandala,
        icon: customIcons.mandalaGrid.name,
        checkCallback: (checking) => {
            const file = getActiveFile(plugin);
            if (!file) return false;
            const leaf =
                getLeafOfFile(plugin, file, MANDALA_VIEW_TYPE) ||
                getLeafOfFile(plugin, file, 'markdown') ||
                undefined;
            const currentViewType = getCurrentViewTypeForFile(
                plugin,
                file,
                leaf,
            );
            if (currentViewType === MANDALA_VIEW_TYPE) return false;
            if (!checking) {
                void toggleFileViewType(plugin, file, undefined);
            }
            return true;
        },
    });

    commands.push({
        commandId: 'open-active-file-in-editor-view',
        name: lang.ocm_open_in_editor,
        icon: 'file-text',
        checkCallback: (checking) => {
            const file = getActiveFile(plugin);
            if (!file) return false;
            const leaf =
                getLeafOfFile(plugin, file, MANDALA_VIEW_TYPE) ||
                getLeafOfFile(plugin, file, 'markdown') ||
                undefined;
            const currentViewType = getCurrentViewTypeForFile(
                plugin,
                file,
                leaf,
            );
            if (currentViewType !== MANDALA_VIEW_TYPE) return false;
            if (!checking) {
                void toggleFileViewType(plugin, file, undefined);
            }
            return true;
        },
    });

    commands.push({
        commandId: 'create-new-mandala-document',
        name: lang.cmd_create_new_document,
        icon: customIcons.mandalaGrid.name,
        checkCallback: (checking) => {
            if (checking) return true;
            void createMandalaGridDocument(plugin);
        },
    });

    // Temporarily disabled commands:
    // - lang.cmd_toggle_horizontal_scrolling_mode
    // - lang.cmd_toggle_vertical_scrolling_mode
    // - lang.cm_split_node
    // - lang.cmd_sort_child_nodes_asc
    // - lang.cmd_sort_child_nodes_desc
    // - lang.cm_copy_link_to_block
    // - lang.cmd_toggle_pin_in_left_sidebar
    // - lang.cmd_extract_branch
    // - lang.cmd_export_branches_with_subitems
    // - lang.cmd_export_nodes_wo_subitems
    // - lang.cm_export_document
    // - lang.cm_eject_document
    // - lang.cmd_toggle_minimap
    // - lang.cmd_toggle_left_sidebar
    // - lang.cmd_space_between_cards

    commands.push({
        commandId: 'set-day-plan-mandala-format',
        name: lang.cmd_set_day_plan_mandala_format,
        icon: customIcons.mandalaGrid.name,
        checkCallback: (checking) => {
            if (checking) return true;
            void setupDayPlanMandalaFormat(plugin);
        },
    });

    return commands;
};

export const addCommands = (plugin: MandalaGrid) => {
    const commands = createCommands(plugin);
    for (const command of commands) {
        plugin.addCommand({
            ...command,
            checkCallback: (checking) => {
                try {
                    return command.checkCallback(checking);
                } catch (e) {
                    onPluginError(e, 'command', command.name);
                    return false;
                }
            },
            id: slugify(command.commandId),
        });
    }
};
