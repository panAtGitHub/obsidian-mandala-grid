export const lang = {
    // open
    ocm_open_in_editor: '在编辑器中打开',
    ocm_open_in_mandala: '在九宫格中打开',
    cmd_toggle_mandala_view: 'Open Mandala Grid',
    card_btn_reveal_in_editor: 'Reveal in editor',
    error_parent_not_found: (full: string) =>
        `Could not find the parent section of ${full}`,
    modals_snapshots_document_loaded: 'Opened document',
    error_set_empty_data: 'Data is empty, but the file on disk is not',
    error_save_empty_data: "Can't save empty data",

    // create document
    cmd_create_new_document: 'New Mandala Grid',
    ocm_new_document: '新建九宫格文档',
    ocm_import_from_gingko: '从 Gingko 导入',

    // add sections
    hk_add_below_and_split: '在下方新增分区并在光标处拆分',
    card_btn_add_node_below: 'Add section after',
    hk_add_above_and_split: '在上方新增分区并在光标处拆分',
    card_btn_add_node_above: 'Add section before',
    hk_add_parent_sibling: '在父分区后新增分区',
    hk_add_child_and_split: '新增子分区并在光标处拆分',
    card_btn_add_child_node: 'Add subsection',
    hkg_create_nodes: '新建',
    modals_snapshots_created_node: 'Created section ',

    // edit
    settings_general_maintain_edit_mode: 'Maintain editing mode',
    settings_general_maintain_edit_mode_desc:
        'Maintain editing mode when switching to a different card using the mouse or keyboard',
    card_btn_edit: 'Edit',
    hk_enable_edit_mode: '编辑卡片',
    hk_enable_edit_mode_and_place_cursor_at_start:
        '编辑卡片并将光标置于开头',
    hk_enable_edit_mode_and_place_cursor_at_end: '编辑卡片并将光标置于末尾',
    hkg_edit_nodes: '编辑',
    modals_snapshots_updated_node: 'Updated section ',
    modal_hk_editor_state_on: '仅在编辑器激活时启用',
    modal_hk_editor_state_off: '仅在编辑器未激活时启用',
    modal_hk_editor_state_both: '无论编辑器状态均启用',

    // save
    card_btn_save: 'Save',
    hk_save_changes: '保存更改并退出编辑',
    hk_disable_edit_mode: '取消更改',

    // delete
    card_btn_delete: 'Delete',
    hk_delete_section: '删除卡片',
    error_delete_last_node: 'Cannot delete this section',
    hkg_delete_nodes: '删除',
    modals_snapshots_deleted_section: 'Deleted section ',

    // clipboard
    cm_copy: '复制',
    cm_copy_branches: '复制分支',
    cm_copy_branch: '复制分支',
    cm_copy_branches_wo_formatting: '复制分支（纯文本）',
    cm_copy_branch_wo_formatting: '复制分支（纯文本）',
    cm_copy_node_wo_subitems: '复制卡片',
    cm_copy_nodes_wo_subitems: '复制卡片',
    hk_copy_node: '复制分支',
    hk_copy_node_unformatted: '复制分支（纯文本）',
    hk_copy_node_without_subitems: '复制卡片',
    cm_copy_link_to_block: '复制块链接',
    cm_section_color: '分区颜色',
    cm_clear_section_color: '清除颜色',
    toolbar_copy_search_results: 'Copy search results',
    toolbar_copy_search_results_wo_subitems:
        'Copy search results without sub-items',
    toolbar_cut_search_results: 'Cut search results',
    hkg_clipboard: '剪贴板',
    modals_snapshots_cut_section: 'Cut section ',
    cm_cut: '剪切',
    hk_cut_node: '剪切分支',
    cm_paste: '粘贴',
    hk_paste_node: '粘贴分支',
    modals_snapshots_pasted_section: 'Pasted section ',
    error_cant_paste: 'Paste command failed. Try pasting directly into a card',
    /*hk_notice_copy: (
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
    },*/

    // merge
    cm_merge_above: '与上方分支合并',
    cm_merge_below: '与下方分支合并',
    hk_merge_with_node_above: '与上方分支合并',
    hk_merge_with_node_below: '与下方分支合并',
    error_hk_cant_merge_multiple_nodes: '不能合并多个分支',
    hkg_merge_nodes: '合并',
    modals_snapshots_merged_node: 'Merged section ',

    // move
    hk_move_node_up: '向上移动分支',
    hk_move_node_down: '向下移动分支',
    hk_move_node_right: '向右移动分支',
    hk_move_node_left: '向左移动分支',
    hkg_move_nodes: '移动',
    modals_snapshots_moved_node: 'Moved section ',
    cm_swap_position: '交换位置（仅适用于3x3视图）',
    notice_swap_select_target:
        'Source selected. Click a target card to swap, or press Esc to cancel.',
    notice_swap_in_progress: 'Swapping...',
    notice_swap_complete: 'Swap complete',
    notice_swap_canceled: 'Swap canceled',
    notice_swap_no_targets: 'No valid swap targets found',

    // dnd
    modals_snapshots_dropped_node: 'Dropped section ',

    // split
    cm_split_node: '拆分卡片',
    error_cm_cant_split_node_that_has_children:
        'Cannot split a section that has sub-items',
    error_cm_cant_split_node_identical: 'The result is the same as the input',
    modals_snapshots_split_node: 'Split section ',

    // undo
    controls_history: 'History',
    controls_history_undo: 'Undo',
    controls_history_redo: 'Redo',
    hk_undo_change: '撤销更改',
    hk_redo_change: '重做更改',
    error_apply_snapshot_while_editing: 'Cannot apply a snapshot while editing',
    hkg_history: '历史',

    // extract
    cmd_extract_branch: 'Extract to Mandala Grid',
    cm_extract_branch: '提取分支',
    cm_extract_section: '提取卡片',
    modals_snapshots_extracted_node: 'Extracted section ',

    // export
    cm_export_document: '导出文档',
    cm_eject_document: '弹出文档',
    cm_export_selection: '导出',
    cm_export_section: '导出卡片',
    cm_export_branch_with_subitems: '导出分支',
    cm_export_branch_wo_subitems: '导出卡片',
    cmd_export_branches_with_subitems: 'Export branches',
    cmd_export_nodes_wo_subitems: 'Export sections',

    // document format
    settings_general_default_format: 'Default format',
    cm_document_format: '文档格式',
    settings_format_html_elements: 'HTML 元素（实验）',
    settings_format_html_comments: 'HTML 注释',
    settings_format_outline: '大纲',
    cm_change_format_to_html_element: 'Format: HTML elements (experimental)',
    cm_change_format_to_document: 'Format: HTML comments',
    cm_change_format_to_outline: 'Format: outline',

    // format
    cm_format_headings: '格式化标题',
    modals_snapshots_formatted_headings: 'Formatted headings',

    // search
    tlb_search_toggle: 'Toggle search input',
    tlb_search_show_all_nodes: 'Show all sections',
    tlb_search_fuzzy_search: 'Fuzzy search',
    tlb_search_previous_result: 'Previous result',
    tlb_search_next_result: 'Next result',
    tlb_search_clear: '清除',
    hk_toggle_search_input: '切换搜索',
    hkg_search: '搜索',

    // select
    hk_extend_select_up: '向上扩展选中',
    hk_extend_select_down: '向下扩展选中',
    hk_extend_select_to_start_of_group: '扩展选中到分组开头',
    hk_extend_select_to_end_of_group: '扩展选中到分组末尾',
    hk_extend_select_to_start_of_column: '扩展选中到列开头',
    hk_extend_select_to_end_of_column: '扩展选中到列末尾',
    hkg_selection: '选择',
    hk_select_all: '选择所有卡片',

    // navigate spatially
    hk_navigate_to_next_node: '选择下一张卡片',
    hk_navigate_to_previous_node: '选择上一张卡片',
    hk_go_up: '向上移动',
    hk_go_down: '向下移动',
    hk_go_right: '向右移动',
    hk_go_Left: '向左移动',
    hk_go_to_beginning_of_group: '跳到分组开头',
    hk_go_to_end_of_group: '跳到分组末尾',
    hk_go_to_beginning_of_column: '跳到列开头',
    hk_go_to_end_of_column: '跳到列末尾',
    hk_select_parent: '选择父级卡片',
    hkg_navigation: '导航',
    hk_select_previous_sibling: '选择上一个同级',
    hk_select_next_sibling: '选择下一个同级',

    // navigate node history
    hk_navigate_back: '返回上一个位置',
    hk_navigate_forward: '前进到下一个位置',
    tlb_navigation_navigate_back: 'Navigate back',
    tlb_navigation_navigate_forward: 'Navigate forward',

    // zoom
    controls_zoom_in: 'Zoom in',
    controls_zoom_out: 'Zoom out',
    controls_zoom_reset: 'Reset (hold shift to undo)',
    controls_zoom_presets: 'Zoom menu',
    hk_zoom_in: '放大',
    hk_zoom_out: '缩小',
    hk_zoom_reset: '重置缩放',
    hkg_zoom: '缩放',

    // scroll
    hk_scroll_left: '向左滚动',
    hk_scroll_right: '向右滚动',
    hk_scroll_up: '向上滚动',
    hk_scroll_down: '向下滚动',
    hk_align_branch: '居中当前分支',

    controls_toggle_scrolling_mode_horizontal:
        'Always center active card horizontally',
    controls_toggle_scrolling_mode_vertical:
        'Always center active card vertically',
    controls_toggle_hidden_card_info: 'Show hidden card info',
    cmd_toggle_horizontal_scrolling_mode: `Toggle 'always center active card horizontally'`,
    cmd_toggle_vertical_scrolling_mode: `Toggle 'always center active card vertically'`,
    card_btn_scroll_to_reveal: 'Reveal',
    hkg_scrolling: '滚动',

    // theme
    settings_theme_bg: 'Background color',
    settings_theme_active_branch_bg: 'Active branch background color',
    settings_theme_active_branch_color: 'Active branch text color',
    settings_appearance_font_size: '字体大小',
    settings_appearance_font_sizes_group: '字体设置',
    settings_appearance_mandala_font_size_3x3_desktop:
        '3×3 格子字体大小（PC）',
    settings_appearance_mandala_font_size_3x3_mobile:
        '3×3 格子字体大小（手机）',
    settings_appearance_mandala_font_size_9x9_desktop:
        '9×9 格子字体大小（PC）',
    settings_appearance_mandala_font_size_9x9_mobile:
        '9×9 格子字体大小（手机）',
    settings_appearance_mandala_font_size_sidebar_desktop:
        '详情侧边栏字体大小（PC）',
    settings_appearance_mandala_font_size_sidebar_mobile:
        '详情侧边栏字体大小（手机）',
    settings_appearance_headings_font_size: '标题字体大小（em）',
    settings_appearance_inactive_node_opacity: 'Inactive cards opacity',

    // layout
    settings_layout_card_width: 'Card width',
    settings_layout_limit_card_height: 'Limit card height',
    settings_always_show_card_buttons: 'Show buttons on all cards',
    settings_always_show_card_buttons_desc:
        'Show card buttons on all cards, not just the active one',

    // outline
    settings_layout_indentation_width: 'Card indentation',
    controls_single_column: 'Outline mode',
    hk_toggle_outline_mode: '切换大纲模式',
    hk_toggle_mandala_mode: '切换 3×3 / 9×9',
    card_btn_collapse_node: 'Collapse',
    card_btn_expand_node: 'Expand',
    hk_outline_toggle_collapse: '折叠/展开卡片',
    hk_outline_toggle_collapse_all: '折叠/展开所有卡片',
    hkg_outline: '大纲',
    hkg_mandala: '九宫格',

    // toolbar
    controls_toggle_mandala_mode: 'Toggle 3×3 / 9×9',
    settings_vertical_toolbar_icons: 'Vertical toolbar buttons',
    settings_vertical_toolbar_icons_desc:
        'Configure what buttons appear in the vertical toolbar',

    // space between cards
    controls_gap_between_cards: 'Space between cards',
    cmd_space_between_cards: `Toggle 'space between cards'`,
    settings_layout_space_between_cards: 'Space between cards',

    // sidebar
    toolbar_toggle_left_sidebar: 'Left sidebar',
    controls_toggle_minimap: 'Document minimap',
    cmd_toggle_minimap: 'Toggle document minimap',
    cmd_toggle_left_sidebar: 'Toggle left sidebar',

    // recent sections
    sidebar_tab_recent_nodes: 'Recently selected sections',
    sidebar_no_recent_nodes: 'No recent sections',

    // pin sections
    cm_unpin_from_left_sidebar: '从左侧边栏取消固定',
    cm_pin_in_left_sidebar: '固定到左侧边栏',
    cmd_toggle_pin_in_left_sidebar: `Toggle 'pin section in left sidebar'`,
    sidebar_tab_pinned_nodes: 'Pinned sections',
    sidebar_no_pinned_nodes: 'No pinned sections',

    // rules
    modals_rules_add_rule: 'New rule',
    modals_rules_no_rules: 'No rules',
    controls_rules: 'Card style rules',
    modals_rules_matches: 'Number of matches',
    modals_rules_drag_handle: 'Change priority',
    modals_rules_tab_global_rules: 'Global rules',
    modals_rules_tab_document_rules: 'Document rules',
    modals_rules_rule_cm_move_to_document: 'Move to document rules',
    modals_rules_rule_cm_move_to_global: 'Move to global rules',

    // sort
    cmd_sort_child_nodes_asc: 'Sort subsections: ascending order',
    cmd_sort_child_nodes_desc: 'Sort subsections: descending order',
    cm_sort_child: '排序子项',
    cm_sort_child_nodes_asc: '升序',
    cm_sort_child_nodes_desc: '降序',
    modals_snapshots_sorted_child_nodes: 'Sorted subsections of section ',

    // settings
    controls_settings: 'Settings',
    controls_toggle_bar: 'Toggle controls bar',
    settings_appearance: 'Appearance',
    settings_layout: 'Layout',
    settings_reset: '重置',

    // general settings
    settings_general_link_split: 'Open in new split',
    settings_general_link_tab: 'Open in new tab',
    settings_general_link_behavior: 'Default link behavior',

    // hotkeys
    hk_enter_subgrid: '进入子九宫',
    hk_exit_subgrid: '退出子九宫',
    hk_jump_core_next: '跳到下一个核心九宫',
    hk_jump_core_prev: '跳到上一个核心九宫',
    hk_swap_cell_up: '向上交换格子',
    hk_swap_cell_down: '向下交换格子',
    hk_swap_cell_left: '向左交换格子',
    hk_swap_cell_right: '向右交换格子',
    modals_hk_input_placeholder: '筛选',
    modals_hk_editor_cancel: '取消',
    controls_hotkeys: '快捷键',
    modals_hk_reset_hotkeys: '重置所有快捷键',
    modals_hk_load_alt_hotkeys_preset: "应用预设：将 'Alt' 设为主修饰键",

    modals_hk_load_nav_while_editing_preset:
        "应用预设：编辑时用 'Alt+Shift+方向键' 导航",
    error_generic:
        'Something went wrong\nYou might find additional details in the developer console',
} as const;
