import { MandalaView } from 'src/view/view';
import { MenuItemObject } from 'src/obsidian/context-menu/render-context-menu';
import { lang } from 'src/lang/lang';
import { copyLinkToBlock } from 'src/view/actions/context-menu/card-context-menu/helpers/copy-link-to-block';
import { togglePinNode } from 'src/view/actions/context-menu/card-context-menu/create-sidebar-context-menu-items';
import { createCoreJumpMenuItems } from 'src/view/actions/context-menu/helpers/create-core-jump-menu-items';
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
    isPinned: boolean;
};
export const createSingleNodeContextMenuItems = (
    view: MandalaView,
    { isPinned, activeNode }: Props,
) => {
    const isMandala = view.documentStore.getValue().meta.isMandala;
    const section = view.documentStore.getValue().sections.id_section[activeNode];
    let cachedSectionColorMap: ReturnType<
        typeof parseSectionColorsFromFrontmatter
    > | null = null;
    const getSectionColorMap = () => {
        if (cachedSectionColorMap) return cachedSectionColorMap;
        const frontmatter = view.documentStore.getValue().file.frontmatter;
        cachedSectionColorMap = parseSectionColorsFromFrontmatter(frontmatter);
        return cachedSectionColorMap;
    };

    const menuItems: MenuItemObject[] = [];
    if (isMandala) {
        menuItems.push({
            title: lang.cm_swap_position,
            icon: 'shuffle',
            action: () => startMandalaSwap(view, activeNode),
        });
    }
    const coreJumpItems = createCoreJumpMenuItems(view);
    if (coreJumpItems.length) {
        if (menuItems.length) {
            menuItems.push({ type: 'separator' });
        }
        menuItems.push(...coreJumpItems);
        menuItems.push({ type: 'separator' });
    }
    menuItems.push(
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
                          requestAnimationFrame(() => {
                              const sectionColorMap = getSectionColorMap();
                              const sectionColorIndex =
                                  createSectionColorIndex(sectionColorMap);
                              const activeColorKey =
                                  sectionColorIndex[section];
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
                          });
                      },
                  },
                  {
                      title: lang.cm_clear_section_color,
                      icon: 'reset',
                      action: () => {
                          const sectionColorMap = getSectionColorMap();
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
    );
    return menuItems;
};
