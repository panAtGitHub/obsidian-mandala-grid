export const lang = {
    // open
    ocm_open_in_editor: 'Open in editor',
    ocm_open_in_lineage: 'Open in Lineage',
    cmd_toggle_lineage_view: 'Toggle view',
    card_btn_reveal_in_editor: 'Reveal in editor',
    error_parent_not_found: (full: string) =>
        `Could not find the parent section of ${full}`,
    modals_snapshots_document_loaded: 'Opened document',
    error_set_empty_data: 'Data is empty, but the file on disk is not',
    error_save_empty_data: "Can't save empty data",

    // create document
    cmd_create_new_document: 'Create new document',
    ocm_new_document: 'New document',
    ocm_import_from_gingko: 'Import from Gingko',

    // add cards
    hk_add_below_and_split: 'Add card below and split at cursor',
    card_btn_add_card_below: 'Add card below',
    hk_add_above_and_split: 'Add card above and split at cursor',
    card_btn_add_card_above: 'Add card above',
    hk_add_parent_sibling: 'Add card after parent',
    hk_add_child_and_split: 'Add child card and split at cursor',
    card_btn_add_child_card: 'Add child card',
    hkg_create_cards: 'Create cards',
    modals_snapshots_created_card: 'Created card ',

    // edit
    settings_general_maintain_edit_mode: 'Maintain editing mode',
    settings_general_maintain_edit_mode_desc:
        'Maintain editing mode when switching to a different card using the mouse or keyboard',
    card_btn_edit: 'Edit',
    hk_enable_edit_mode: 'Edit card',
    hk_enable_edit_mode_and_place_cursor_at_start:
        'Edit card and place cursor at the start',
    hk_enable_edit_mode_and_place_cursor_at_end:
        'Edit card and place cursor at the end',
    hkg_edit_cards: 'Edit cards',
    modals_snapshots_updated_card: 'Updated card ',
    modal_hk_editor_state_on: 'Enable only when the editor is active',
    modal_hk_editor_state_off: 'Enable only when the editor is inactive',
    modal_hk_editor_state_both: 'Enable regardless of the editor state',

    // save
    card_btn_save: 'Save',
    hk_save_changes: 'Save changes and exit card',
    hk_disable_edit_mode: 'Cancel changes',

    // delete
    card_btn_delete: 'Delete',
    hk_delete_card: 'Delete card',
    error_delete_last_node: 'Cannot delete this card',
    hkg_delete_cards: 'Delete cards',
    modals_snapshots_deleted_card: 'Deleted card ',

    // copy
    cm_copy: 'Copy',
    cm_copy_branches: 'Copy branches',
    cm_copy_branch: 'Copy branch',
    cm_copy_branches_wo_formatting: 'Copy branches without formatting',
    cm_copy_branch_wo_formatting: 'Copy branch without formatting',
    cm_copy_section_wo_subitems: 'Copy sections without sub-items',
    cm_copy_sections_wo_subitems: 'Copy section without sub-items',
    hk_copy_node: 'Copy branch',
    hk_copy_node_unformatted: 'Copy branch without formatting',
    hk_copy_node_without_subitems: 'Copy without subitems',
    cm_copy_link_to_block: 'Copy link to block',
    hkg_clipboard: 'Clipboard',
    hk_notice_copy: (
        size: number,
        formatted: boolean,
        type: 'branch' | 'section',
    ) => {
        if (size === 0) return null;
        return type === 'branch'
            ? size === 1
                ? formatted
                    ? null
                    : 'Unformatted branch copied to clipboard'
                : formatted
                  ? `${size} branches copied to clipboard`
                  : `${size} unformatted branches copied to clipboard`
            : size === 1
              ? null
              : size + ' sections copied to clipboard';
    },

    // cut paste
    cm_cut: 'Cut branch',
    hk_cut_node: 'Cut branch',
    cm_paste: 'Paste',
    hk_paste_node: 'Paste branch',
    modals_snapshots_cut_card: 'Cut card ',
    modals_snapshots_pasted_card: 'Pasted card ',
    error_cant_paste: 'Paste command failed. Try pasting directly into a card',

    // merge
    cm_merge_above: 'Merge with branch above',
    cm_merge_below: 'Merge with branch below',
    hk_merge_with_node_above: 'Merge with branch above',
    hk_merge_with_node_below: 'Merge with branch below',
    error_hk_cant_merge_multiple_nodes: 'Cannot merge multiple cards',
    hkg_merge_cards: 'Merge cards',
    modals_snapshots_merged_card: 'Merged card ',

    // move
    hk_move_node_up: 'Move branch up',
    hk_move_node_down: 'Move branch down',
    hk_move_node_right: 'Move branch right',
    hk_move_node_left: 'Move branch left',
    hkg_move_cards: 'Move cards',
    modals_snapshots_moved_card: 'Moved branch ',

    // dnd
    modals_snapshots_dropped_card: 'Dropped card ',

    // split
    cm_split_card: 'Split card',
    error_cm_cant_split_card_that_has_children:
        'Cannot split a card that has children',
    error_cm_cant_split_card_identical: 'The result is the same as the input',
    modals_snapshots_split_card: 'Split card ',

    // undo
    controls_history: 'History',
    controls_history_undo: 'Undo',
    controls_history_redo: 'Redo',
    hk_undo_change: 'Undo change',
    hk_redo_change: 'Redo change',
    error_apply_snapshot_while_editing: 'Cannot apply a snapshot while editing',
    hkg_history: 'History',

    // extract
    cmd_extract_branch: 'Extract branch to a new document',
    cm_extract_branch: 'Extract branch',
    modals_snapshots_extracted_card: 'Extracted card ',

    // export
    cm_export_document: 'Export document',
    cm_export_column: 'Export column',

    // document format
    settings_general_default_format: 'Default format',
    settings_general_default_format_desc: 'Applies to new documents',
    settings_format_html_elements: 'HTML elements (experimental)',
    settings_format_html_comments: 'HTML comments',
    settings_format_outline: 'Outline',
    cm_change_format_to_html_element: 'Format: HTML elements (experimental)',
    cm_change_format_to_document: 'Format: HTML comments',
    cm_change_format_to_outline: 'Format: outline',

    // format
    cm_format_headings: 'Format headings',
    modals_snapshots_formatted_headings: 'Formatted headings',

    // search
    tlb_search_toggle: 'Toggle search input',
    tlb_search_show_all_cards: 'Show all cards',
    tlb_search_fuzzy_search: 'Fuzzy search',
    tlb_search_previous_result: 'Previous result',
    tlb_search_next_result: 'Next result',
    tlb_search_clear: 'Clear',
    hk_toggle_search_input: 'Toggle search',
    hkg_search: 'Search',

    // select
    hk_extend_select_up: 'Extend selection up',
    hk_extend_select_down: 'Extend selection down',
    hk_extend_select_to_start_of_group: 'Extend selection to start of group',
    hk_extend_select_to_end_of_group: 'Extend selection to end of group',
    hk_extend_select_to_start_of_column: 'Extend selection to start of column',
    hk_extend_select_to_end_of_column: 'Extend selection to end of column',
    hkg_selection: 'Selection',

    // navigate spatially
    hk_navigate_to_next_node: 'Select next card',
    hk_navigate_to_previous_node: 'Select previous card',
    hk_go_up: 'Go up',
    hk_go_down: 'Go down',
    hk_go_right: 'Go right',
    hk_go_Left: 'Go left',
    hk_go_to_beginning_of_group: 'Go to start of group',
    hk_go_to_end_of_group: 'Go to end of group',
    hk_go_to_beginning_of_column: 'Go to start of column',
    hk_go_to_end_of_column: 'Go to end of column',
    hk_select_parent: 'Select parent card',
    hkg_navigation: 'Navigation',
    hk_select_previous_sibling: 'Select previous sibling',
    hk_select_next_sibling: 'Select next sibling',

    // navigate node history
    hk_navigate_back: 'Navigate back',
    hk_navigate_forward: 'Navigate forward',
    tlb_navigation_navigate_back: 'Navigate back',
    tlb_navigation_navigate_forward: 'Navigate forward',

    // zoom
    controls_zoom_in: 'Zoom in',
    controls_zoom_out: 'Zoom out',
    controls_zoom_reset: 'Reset (hold shift to undo)',
    controls_zoom_presets: 'Zoom menu',
    hk_zoom_in: 'Zoom in',
    hk_zoom_out: 'Zoom out',
    hk_zoom_reset: 'Reset zoom',
    hkg_zoom: 'Zoom',

    // scroll
    hk_scroll_left: 'Scroll left',
    hk_scroll_right: 'Scroll right',
    hk_scroll_up: 'Scroll up',
    hk_scroll_down: 'Scroll down',
    hk_align_branch: 'Align active branch',

    controls_toggle_scrolling_mode_horizontal:
        'Always center active card horizontally',
    controls_toggle_scrolling_mode_vertical:
        'Always center active card vertically',
    cmd_toggle_horizontal_scrolling_mode: `Toggle 'always center active card horizontally'`,
    cmd_toggle_vertical_scrolling_mode: `Toggle 'always center active card vertically'`,
    card_btn_scroll_to_reveal: 'Scroll to reveal',
    hkg_scrolling: 'Align branch',

    // theme
    settings_theme_bg: 'Background color',
    settings_theme_active_branch_bg: 'Active branch background color',
    settings_theme_active_branch_color: 'Active branch text color',
    settings_appearance_font_size: 'Font size',
    settings_appearance_headings_font_size: 'Headings font size (em)',
    settings_appearance_inactive_node_opacity: 'Inactive cards opacity',

    // layout
    settings_layout_card_width: 'Card width',
    settings_layout_limit_card_height: 'Limit card height',
    settings_always_show_card_buttons: 'Show buttons on all cards',
    settings_always_show_card_buttons_desc:
        'Show card buttons on all cards, not just the active one',

    // outline
    settings_layout_indentation_width: 'Card indentation',
    settings_layout_indentation_width_desc: "Applicable in 'outline mode'",
    controls_single_column: 'Outline mode',
    hk_toggle_outline_mode: `Toggle outline mode`,
    card_btn_collapse_card: 'Collapse',
    card_btn_expand_card: 'Expand',
    hk_outline_toggle_collapse: 'Collapse/expand card',
    hk_outline_toggle_collapse_all: 'Collapse/expand all cards',
    hkg_outline: 'Outline',

    // toolbar
    settings_vertical_toolbar_icons: 'Vertical toolbar buttons',
    settings_vertical_toolbar_icons_desc:
        'Configure what buttons appear in the vertical toolbar',

    // space between cards
    controls_gap_between_cards: 'Space between cards',
    cmd_space_between_cards: `Toggle 'space between cards'`,
    settings_layout_space_between_cards: 'Space between cards',
    settings_layout_space_between_cards_desc:
        'Applicable when spaces are enabled',

    // sidebar
    toolbar_toggle_left_sidebar: 'Left sidebar',
    controls_toggle_minimap: 'Document minimap',
    cmd_toggle_minimap: 'Toggle document minimap',
    cmd_toggle_left_sidebar: 'Toggle left sidebar',

    // recent cards
    sidebar_tab_recent_cards: 'Recent cards',
    sidebar_no_recent_cards: 'No recent cards',

    // pin cards
    cm_unpin_from_left_sidebar: 'Unpin from left sidebar',
    cm_pin_in_left_sidebar: 'Pin in left sidebar',
    cmd_toggle_pin_in_left_sidebar: `Toggle 'pin card in left sidebar'`,
    sidebar_tab_pinned_cards: 'Pinned cards',
    sidebar_no_pinned_cards: 'No pinned cards',

    // rules
    modals_rules_add_rule: 'New rule',
    modals_rules_no_rules: 'No rules',
    controls_rules: 'Style rules',
    modals_rules_matches: 'Number of matches',
    modals_rules_drag_handle: 'Change priority',
    modals_rules_tab_global_rules: 'Global rules',
    modals_rules_tab_document_rules: 'Document rules',
    modals_rules_rule_cm_move_to_document: 'Move to document rules',
    modals_rules_rule_cm_move_to_global: 'Move to global rules',

    // sort
    cmd_sort_child_cards_asc: 'Sort child cards: ascending order',
    cmd_sort_child_cards_desc: 'Sort child cards: descending order',
    cm_sort_child: 'Sort child cards',
    cm_sort_child_cards_asc: 'Ascending order',
    cm_sort_child_cards_desc: 'Descending order',
    modals_snapshots_sorted_child_cards: 'Sorted child cards of card ',

    // settings
    controls_settings: 'Settings',
    controls_toggle_bar: 'Toggle controls bar',
    settings_appearance: 'Appearance',
    settings_layout: 'Layout',
    settings_reset: 'Reset',

    // hotkeys
    modals_hk_input_placeholder: 'Filter',
    modals_hk_editor_cancel: 'Cancel',
    controls_hotkeys: 'Hotkeys',
    modals_hk_reset_hotkeys: 'Reset all hotkeys',
    modals_hk_load_alt_hotkeys_preset:
        "Apply preset: use 'Alt' as the primary modifier",

    modals_hk_load_nav_while_editing_preset:
        "Apply preset: navigate while editing using 'Alt+Shift+Arrow keys'",
    error_generic:
        'Something went wrong\nYou might find additional details in the developer console',
} as const;
