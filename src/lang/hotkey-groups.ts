import { lang } from 'src/lang/lang';
import { hotkeysLang } from 'src/lang/hotkeys-lang';

export type CommandName = keyof typeof hotkeysLang;
export type GroupName = keyof typeof hotkeyGroups;

export const hotkeyGroups = {
    [lang.hkg_create_nodes]: new Set([
        'add_child',
        'add_below',
        'add_above',
        'add_parent_sibling',
        'add_child_and_split',
        'add_below_and_split',
        'add_above_and_split',
    ]),
    [lang.hkg_edit_nodes]: new Set([
        'enable_edit_mode',
        'enable_edit_mode_and_place_cursor_at_start',
        'enable_edit_mode_and_place_cursor_at_end',
        'disable_edit_mode',
        'save_changes_and_exit_card',
    ]),
    [lang.hkg_move_nodes]: new Set([
        'move_node_up',
        'move_node_down',
        'move_node_right',
        'move_node_left',
    ]),
    [lang.hkg_merge_nodes]: new Set([
        'merge_with_node_above',
        'merge_with_node_below',
    ]),
    [lang.hkg_delete_nodes]: new Set(['delete_card']),
    [lang.hkg_navigation]: new Set([
        'go_up',
        'go_down',
        'go_right',
        'go_left',
        'go_to_beginning_of_group',
        'go_to_end_of_group',
        'go_to_beginning_of_column',
        'go_to_end_of_column',
        'navigate_back',
        'navigate_forward',
        'navigate_to_previous_node',
        'navigate_to_next_node',
        'select_parent',
    ]),
    [lang.hkg_selection]: new Set([
        'extend_select_up',
        'extend_select_down',
        'extend_select_to_start_of_group',
        'extend_select_to_end_of_group',
        'extend_select_to_start_of_column',
        'extend_select_to_end_of_column',
        'select_all_nodes',
    ]),
    [lang.hkg_history]: new Set(['undo_change', 'redo_change']),
    [lang.hkg_search]: new Set(['toggle_search_input']),
    [lang.hkg_clipboard]: new Set([
        'copy_node',
        'copy_node_unformatted',
        'copy_node_without_subitems',
        'cut_node',
        'paste_node',
    ]),
    [lang.hkg_scrolling]: new Set([
        'scroll_left',
        'scroll_right',
        'scroll_up',
        'scroll_down',
        'align_branch',
    ]),
    [lang.hkg_zoom]: new Set(['zoom_in', 'zoom_out', 'zoom_reset']),
    [lang.hkg_outline]: new Set([
        'toggle_outline_mode',
        'toggle_collapse',
        'toggle_collapse_all',
    ]),
    [lang.hkg_mandala]: new Set([
        'toggle_mandala_mode',
        'toggle_lock_mode',
        'enter_subgrid',
        'exit_subgrid',
        'jump_core_next',
        'jump_core_prev',
        'swap_cell_up',
        'swap_cell_down',
        'swap_cell_left',
        'swap_cell_right',
    ]),
} satisfies Record<string, Set<CommandName>>;

export const hotkeysGroups: Record<CommandName, GroupName> = Object.fromEntries(
    Object.entries(hotkeyGroups)
        .map(([group, commands]) => Array.from(commands).map((c) => [c, group]))
        .flat(),
);
