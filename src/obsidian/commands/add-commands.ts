import { Command } from 'obsidian';
import MandalaGrid from 'src/main';
import { lang } from 'src/lang/lang';
import { slugify } from 'src/helpers/slugify';
import { toggleFileViewType } from 'src/obsidian/events/workspace/effects/toggle-file-view-type';
import { customIcons } from 'src/helpers/load-custom-icons';
import { getActiveFile } from 'src/obsidian/commands/helpers/get-active-file';
import { createMandalaGridDocument } from 'src/obsidian/events/workspace/effects/create-mandala-document';
import { getActiveMandalaView } from 'src/obsidian/commands/helpers/get-active-mandala-view';
import { openSplitNodeModal } from 'src/view/modals/split-node-modal/open-split-node-modal';
import { isEditing } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/is-editing';
import { copyLinkToBlock } from 'src/view/actions/context-menu/card-context-menu/helpers/copy-link-to-block';
import { extractBranch } from 'src/obsidian/commands/helpers/extract-branch/extract-branch';
import { exportSelection } from 'src/view/actions/context-menu/card-context-menu/helpers/export-selection';
import { exportDocument } from 'src/obsidian/commands/helpers/export-document/export-document';
import { onPluginError } from 'src/lib/store/on-plugin-error';
import invariant from 'tiny-invariant';
import { sortChildNodes } from 'src/view/actions/context-menu/card-context-menu/helpers/sort-child-nodes';
import { ejectDocument } from 'src/obsidian/commands/helpers/export-document/eject-document';
import { cleanupLegacyMandalaFrontmatter } from 'src/obsidian/commands/helpers/cleanup-legacy-mandala-frontmatter';

const createCommands = (plugin: MandalaGrid) => {
    const commands: (Omit<Command, 'id' | 'callback'> & {
        checkCallback: (checking: boolean) => boolean | void;
    })[] = [];
    commands.push({
        name: lang.cmd_toggle_mandala_view,
        icon: customIcons.mandalaGrid.name,
        checkCallback: (checking) => {
            const file = getActiveFile(plugin);
            if (file) {
                if (checking) return true;
                else {
                    toggleFileViewType(plugin, file, undefined);
                }
            }
        },
    });

    commands.push({
        name: lang.cmd_create_new_document,
        icon: customIcons.mandalaGrid.name,
        checkCallback: (checking) => {
            if (checking) return true;
            createMandalaGridDocument(plugin);
        },
    });

    commands.push({
        name: lang.cmd_toggle_horizontal_scrolling_mode,
        icon: customIcons.alignH.name,
        checkCallback: (checking) => {
            if (checking) {
                return Boolean(getActiveMandalaView(plugin));
            }
            plugin.settings.dispatch({
                type: 'settings/view/toggle-horizontal-scrolling-mode',
            });
        },
    });

    commands.push({
        name: lang.cmd_toggle_vertical_scrolling_mode,
        icon: customIcons.alignV.name,
        checkCallback: (checking) => {
            if (checking) {
                return Boolean(getActiveMandalaView(plugin));
            }
            plugin.settings.dispatch({
                type: 'settings/view/toggle-vertical-scrolling-mode',
            });
        },
    });

    commands.push({
        name: lang.cm_split_node,
        icon: customIcons.split.name,
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            openSplitNodeModal(view!);
        },
    });

    commands.push({
        name: lang.cmd_sort_child_nodes_asc,
        icon: 'sort-asc',
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            invariant(view);
            sortChildNodes(
                view,
                view.viewStore.getValue().document.activeNode,
                'ascending',
            );
        },
    });

    commands.push({
        name: lang.cmd_sort_child_nodes_desc,
        icon: 'sort-desc',
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            invariant(view);
            sortChildNodes(
                view,
                view.viewStore.getValue().document.activeNode,
                'descending',
            );
        },
    });

    commands.push({
        name: lang.cm_copy_link_to_block,
        icon: 'links-coming-in',
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            copyLinkToBlock(view!, false);
        },
    });

    commands.push({
        name: lang.cmd_toggle_pin_in_left_sidebar,
        icon: 'pin',
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return view ? isEditing(view) : false;
            }
            if (!view) return;
            const viewState = view.viewStore.getValue();

            const documentStore = view.documentStore;
            const documentState = documentStore.getValue();
            const activeNode = viewState.document.activeNode;
            const isPinned = documentState.pinnedNodes.Ids.includes(activeNode);
            documentStore.dispatch({
                type: isPinned
                    ? 'document/pinned-nodes/unpin'
                    : 'document/pinned-nodes/pin',
                payload: { id: activeNode },
            });
        },
    });

    commands.push({
        name: lang.cmd_extract_branch,
        icon: customIcons.mandalaGrid.name,
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            extractBranch(view!);
        },
    });

    commands.push({
        name: lang.cmd_export_branches_with_subitems,
        icon: 'file-text',
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            exportSelection(view!, true);
        },
    });

    commands.push({
        name: lang.cmd_export_nodes_wo_subitems,
        icon: 'file-text',
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            exportSelection(view!, false);
        },
    });

    commands.push({
        name: lang.cm_export_document,
        icon: 'file-text',
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            exportDocument(view!);
        },
    });

    commands.push({
        name: lang.cm_eject_document,
        icon: 'file-text',
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            ejectDocument(view!);
        },
    });

    commands.push({
        name: lang.cmd_toggle_minimap,
        icon: 'panel-right',
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            plugin.settings.dispatch({
                type: 'settings/view/toggle-minimap',
            });
        },
    });

    commands.push({
        name: lang.cmd_toggle_left_sidebar,
        icon: 'panel-left',
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            plugin.settings.dispatch({ type: 'view/left-sidebar/toggle' });
        },
    });

    commands.push({
        name: lang.cmd_space_between_cards,
        icon: customIcons.gap.name,
        checkCallback: (checking) => {
            const view = getActiveMandalaView(plugin);
            if (checking) {
                return Boolean(view);
            }
            view!.plugin.settings.dispatch({
                type: 'view/modes/gap-between-cards/toggle',
            });
        },
    });

    commands.push({
        name: '清理旧版 Mandala YAML 视图键',
        icon: 'eraser',
        checkCallback: (checking) => {
            if (checking) return true;
            void cleanupLegacyMandalaFrontmatter(plugin);
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
            id: slugify(command.name),
        });
    }
};
