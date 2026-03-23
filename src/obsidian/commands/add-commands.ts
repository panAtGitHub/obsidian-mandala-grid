import type { Command } from 'obsidian';
import type MandalaGrid from 'src/main';
import { lang } from 'src/lang/lang';
import { slugify } from 'src/shared/helpers/slugify';
import { toggleFileViewType } from 'src/obsidian/events/workspace/effects/toggle-file-view-type';
import { customIcons } from 'src/shared/helpers/load-custom-icons';
import { getActiveFile } from 'src/obsidian/commands/helpers/get-active-file';
import { createMandalaGridDocument } from 'src/obsidian/events/workspace/effects/create-mandala-document';
import { onPluginError } from 'src/shared/store/on-plugin-error';
import { setupDayPlanMandalaFormat } from 'src/obsidian/commands/helpers/setup-day-plan-mandala-format';
import { getActiveMandalaView } from 'src/obsidian/commands/helpers/get-active-mandala-view';
import { openExportModeModalForView } from 'src/mandala-settings/ui/view-options/export-mode-modal-store';
import { writeCurrentCoreDayPlanSlotsToYaml } from 'src/obsidian/commands/helpers/write-day-plan-slots-to-yaml';
import { refreshCurrentDayPlanDateHeadings } from 'src/obsidian/commands/helpers/refresh-day-plan-date-headings';
import { exportPerfSnapshot } from 'src/obsidian/commands/helpers/export-perf-snapshot';

type ManagedCommand = Omit<Command, 'id' | 'callback'> & {
    commandId: string;
    checkCallback: (checking: boolean) => boolean | void;
    isEnabled?: (plugin: MandalaGrid) => boolean;
};

const getAllCommands = (plugin: MandalaGrid): ManagedCommand[] => {
    const commands: ManagedCommand[] = [];
    commands.push({
        commandId: 'toggle-mandala-view',
        name: lang.cmd_toggle_mandala_view,
        icon: customIcons.mandalaGrid.name,
        checkCallback: (checking) => {
            const file = getActiveFile(plugin);
            if (file) {
                if (checking) return true;
                else {
                    void toggleFileViewType(plugin, file, undefined);
                }
            }
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
    // - lang.cmd_toggle_left_sidebar
    // - lang.cmd_space_between_cards

    commands.push({
        commandId: 'set-day-plan-mandala-format',
        name: lang.cmd_set_day_plan_mandala_format,
        icon: customIcons.mandalaGrid.name,
        isEnabled: (currentPlugin) =>
            currentPlugin.settings.getValue().general.dayPlanEnabled,
        checkCallback: (checking) => {
            if (checking) return true;
            void setupDayPlanMandalaFormat(plugin);
        },
    });

    commands.push({
        commandId: 'write-current-core-day-plan-slots-to-yaml',
        name: lang.cmd_write_current_core_day_plan_slots_to_yaml,
        icon: customIcons.mandalaGrid.name,
        isEnabled: (currentPlugin) =>
            currentPlugin.settings.getValue().general.dayPlanEnabled,
        checkCallback: (checking) => {
            if (checking) return true;
            void writeCurrentCoreDayPlanSlotsToYaml(plugin);
        },
    });

    commands.push({
        commandId: 'refresh-day-plan-date-headings',
        name: lang.cmd_refresh_day_plan_date_headings,
        icon: customIcons.mandalaGrid.name,
        isEnabled: (currentPlugin) =>
            currentPlugin.settings.getValue().general.dayPlanEnabled,
        checkCallback: (checking) => {
            if (checking) return true;
            void refreshCurrentDayPlanDateHeadings(plugin);
        },
    });

    commands.push({
        commandId: 'open-export-mode',
        name: lang.cmd_open_export_mode,
        icon: customIcons.mandalaGrid.name,
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (!view) return false;
            if (checking) return true;
            openExportModeModalForView(view.id);
        },
    });

    commands.push({
        commandId: 'export-perf-snapshot',
        name: lang.cmd_export_perf_snapshot,
        icon: customIcons.mandalaGrid.name,
        checkCallback: (checking) => {
            if (checking) return true;
            void exportPerfSnapshot(plugin);
        },
    });

    return commands;
};

export const getManagedCommandIds = (plugin: MandalaGrid) =>
    getAllCommands(plugin).map((command) => slugify(command.commandId));

export const addCommands = (plugin: MandalaGrid) => {
    const commands = getAllCommands(plugin).filter(
        (command) => command.isEnabled?.(plugin) ?? true,
    );
    return commands.map((command) =>
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
        }),
    );
};
