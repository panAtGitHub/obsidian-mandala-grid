import { MandalaView } from 'src/view/view';
import { MenuItemObject } from 'src/obsidian/context-menu/render-context-menu';
import { lang } from 'src/lang/lang';
import { customIcons } from 'src/helpers/load-custom-icons';
import { Notice } from 'obsidian';
import { openSplitNodeModal } from 'src/view/modals/split-node-modal/open-split-node-modal';
import { sortChildNodes } from 'src/view/actions/context-menu/card-context-menu/helpers/sort-child-nodes';
import { mergeNode } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/merge-node';
import { copyLinkToBlock } from 'src/view/actions/context-menu/card-context-menu/helpers/copy-link-to-block';
import { copyActiveNodesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-active-nodes-to-clipboard';
import { copyActiveBranchesToClipboard } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/clipboard/copy-active-branches-to-clipboard';
import { cutNode } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/cut-node';
import { pasteNode } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/paste-node';
import { extractBranch } from 'src/obsidian/commands/helpers/extract-branch/extract-branch';
import { exportSelection } from 'src/view/actions/context-menu/card-context-menu/helpers/export-selection';
import { togglePinNode } from 'src/view/actions/context-menu/card-context-menu/create-sidebar-context-menu-items';
import {
    createSectionColorIndex,
    parseSectionColorsFromFrontmatter,
    SECTION_COLOR_KEYS,
    SECTION_COLOR_PALETTE,
    setSectionColor,
    writeSectionColorsToFrontmatter,
} from 'src/view/helpers/mandala/section-colors';
import { startMandalaSwap } from 'src/view/helpers/mandala/mandala-swap';

type Props = {
    activeNode: string;
    hasChildren: boolean;
    isPinned: boolean;
};
export const createSingleNodeContextMenuItems = (
    view: MandalaView,
    { hasChildren, isPinned, activeNode }: Props,
) => {
    const isMandala = view.documentStore.getValue().meta.isMandala;
    const section = view.documentStore.getValue().sections.id_section[activeNode];
    const frontmatter = view.documentStore.getValue().file.frontmatter;
    const sectionColorMap = parseSectionColorsFromFrontmatter(frontmatter);
    const sectionColorIndex = createSectionColorIndex(sectionColorMap);
    const activeColorKey = section ? sectionColorIndex[section] : undefined;

    const menuItems: MenuItemObject[] = [
        {
            title: lang.cm_split_node,
            icon: customIcons.split.name,
            action: () => {
                if (hasChildren) {
                    new Notice(lang.error_cm_cant_split_node_that_has_children);
                } else {
                    openSplitNodeModal(view);
                }
            },
        },
        {
            title: lang.cm_sort_child,
            icon: 'sort-asc',
            disabled: !hasChildren,
            submenu: [
                {
                    title: lang.cm_sort_child_nodes_asc,
                    icon: 'sort-asc',
                    action: () => sortChildNodes(view, activeNode, 'ascending'),
                },
                {
                    title: lang.cm_sort_child_nodes_desc,
                    icon: 'sort-desc',
                    action: () =>
                        sortChildNodes(view, activeNode, 'descending'),
                },
            ],
        },
        ...(isMandala
            ? ([
                  {
                      title: lang.cm_swap_position,
                      icon: 'shuffle',
                      action: () => startMandalaSwap(view, activeNode),
                  },
              ] as MenuItemObject[])
            : []),
        { type: 'separator' },
        {
            title: lang.cm_merge_above,
            icon: 'merge',
            action: () => mergeNode(view, 'up'),
        },
        {
            title: lang.cm_merge_below,
            icon: 'merge',
            action: () => mergeNode(view, 'down'),
        },

        { type: 'separator' },
        {
            title: lang.cm_copy_link_to_block,
            icon: 'links-coming-in',
            action: () => copyLinkToBlock(view, false),
        },
        { type: 'separator' },
        !hasChildren
            ? {
                title: lang.cm_copy,
                icon: 'documents',
                action: () => copyActiveNodesToClipboard(view, false),
            }
            : {
                title: lang.cm_copy,
                icon: 'documents',
                submenu: [
                    {
                        title: lang.cm_copy_branch,
                        icon: 'mandala-cards',
                        action: () =>
                            copyActiveBranchesToClipboard(view, true, false),
                    },
                    {
                        title: lang.cm_copy_branch_wo_formatting,
                        icon: 'file-text',
                        action: () =>
                            copyActiveBranchesToClipboard(view, false, false),
                    },
                    {
                        title: lang.cm_copy_nodes_wo_subitems,
                        icon: 'file-text',
                        action: () => copyActiveNodesToClipboard(view, false),
                    },
                ],
            },
        {
            title: lang.cm_cut,
            icon: 'scissors',
            action: () => cutNode(view),
        },
        {
            title: lang.cm_paste,
            icon: 'paste',
            action: () => pasteNode(view),
        },
        { type: 'separator' },
        {
            title: isPinned
                ? lang.cm_unpin_from_left_sidebar
                : lang.cm_pin_in_left_sidebar,
            icon: isPinned ? 'pin-off' : 'pin',
            action: () => {
                togglePinNode(view, activeNode, isPinned, false);
            },
        },
        { type: 'separator' },
        ...(section
            ? ([
                  {
                      type: 'custom',
                      render: (menu, container) => {
                          const palette = document.createElement('div');
                          palette.className = 'mandala-color-palette';
                          for (const key of SECTION_COLOR_KEYS) {
                              const button =
                                  document.createElement('button');
                              button.type = 'button';
                              button.className = 'mandala-color-swatch';
                              if (activeColorKey === key) {
                                  button.classList.add('is-active');
                              }
                              button.style.setProperty(
                                  '--swatch-color',
                                  SECTION_COLOR_PALETTE[key],
                              );
                              button.style.backgroundColor =
                                  SECTION_COLOR_PALETTE[key];
                              button.setAttribute(
                                  'aria-label',
                                  `${lang.cm_section_color} ${key}`,
                              );
                              button.addEventListener('click', (event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  const next = setSectionColor(
                                      sectionColorMap,
                                      section,
                                      key,
                                  );
                                  void writeSectionColorsToFrontmatter(
                                      view,
                                      next,
                                  );
                                  menu.hide();
                              });
                              palette.appendChild(button);
                          }
                          container.appendChild(palette);
                      },
                  },
                  {
                      title: lang.cm_clear_section_color,
                      icon: 'reset',
                      disabled: !activeColorKey,
                      action: () => {
                          const next = setSectionColor(
                              sectionColorMap,
                              section,
                              null,
                          );
                          void writeSectionColorsToFrontmatter(view, next);
                      },
                  },
              ] as MenuItemObject[])
            : []),
        { type: 'separator' },
        {
            title: hasChildren
                ? lang.cm_extract_branch
                : lang.cm_extract_section,
            icon: customIcons.cards.name,
            action: () => extractBranch(view),
        },
        !hasChildren
            ? {
                title: lang.cm_export_section,
                icon: 'file-text',
                action: () => exportSelection(view, false),
            }
            : {
                title: lang.cm_export_selection,
                icon: 'file-text',
                submenu: [
                    {
                        title: lang.cm_export_branch_with_subitems,
                        icon: 'file-text',
                        action: () => exportSelection(view, true),
                    },
                    {
                        title: lang.cm_export_branch_wo_subitems,
                        icon: 'file-text',
                        action: () => exportSelection(view, false),
                    },
                ],
            },
    ];
    return menuItems;
};
