import { MandalaView } from 'src/view/view';
import { MenuItemObject } from 'src/obsidian/context-menu/render-context-menu';
import { lang } from 'src/lang/lang';
import { copyLinkToBlock } from 'src/view/actions/context-menu/card-context-menu/helpers/copy-link-to-block';
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
        ...(isMandala
            ? ([
                  {
                      title: lang.cm_swap_position,
                      icon: 'shuffle',
                      action: () => startMandalaSwap(view, activeNode),
                  },
              ] as MenuItemObject[])
            : []),
        {
            title: lang.cm_copy_link_to_block,
            icon: 'links-coming-in',
            action: () => copyLinkToBlock(view, false),
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
    ];
    return menuItems;
};
