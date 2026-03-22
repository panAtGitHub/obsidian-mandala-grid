import { lang } from 'src/lang/lang';
import { MenuItemObject } from 'src/obsidian/context-menu/render-context-menu';
import { MandalaView } from 'src/view/view';
import { copyLinkToHeading } from 'src/view/actions/context-menu/card-context-menu/helpers/copy-link-to-heading';
import { togglePinNode } from 'src/view/actions/context-menu/card-context-menu/create-sidebar-context-menu-items';
import {
    createSectionColorIndex,
    parseSectionColorsFromPersistedState,
    SECTION_COLOR_KEYS,
    SECTION_COLOR_PALETTE,
    serializeSectionColorMapForSettings,
    setSectionColor,
} from 'src/lib/mandala/section-colors';
import { getCurrentFileSectionColorMap } from 'src/lib/mandala/current-file-mandala-settings';
import { resolveContextMenuCopyLinkVisibility } from 'src/mandala-settings/state/helpers/context-menu-copy-link-visibility';

const createSectionColorPersistence = (view: MandalaView) => {
    let cachedSectionColorMap: ReturnType<
        typeof parseSectionColorsFromPersistedState
    > | null = null;

    const getSectionColorMap = () => {
        if (cachedSectionColorMap) return cachedSectionColorMap;
        cachedSectionColorMap = getCurrentFileSectionColorMap(view);
        return cachedSectionColorMap;
    };

    const persistSectionColorMap = (
        next: ReturnType<typeof parseSectionColorsFromPersistedState>,
    ) => {
        if (!view.file) return;
        const current =
            serializeSectionColorMapForSettings(getSectionColorMap());
        const normalizedNext = serializeSectionColorMapForSettings(next);
        if (JSON.stringify(current) === JSON.stringify(normalizedNext)) return;
        cachedSectionColorMap = next;
        view.plugin.settings.dispatch({
            type: 'settings/documents/persist-mandala-section-colors',
            payload: {
                path: view.file.path,
                map: normalizedNext,
            },
        });
    };

    return {
        getSectionColorMap,
        persistSectionColorMap,
    };
};

export const createCopyHeadingLinkEmbedDollarMenuItems = (
    view: MandalaView,
    activeNode: string,
) => {
    const copyLinkVisibility = resolveContextMenuCopyLinkVisibility(
        view.plugin.settings.getValue().view,
    );

    if (!copyLinkVisibility['heading-embed-dollar']) {
        return [];
    }

    return [
        {
            title: lang.cm_copy_heading_link_embed_dollar,
            icon: 'heading-1',
            action: () => {
                void copyLinkToHeading(view, activeNode, {
                    embed: true,
                    alias: '$',
                });
            },
        },
    ] satisfies MenuItemObject[];
};

export const createPinToggleMenuItems = (
    view: MandalaView,
    activeNode: string,
    isPinned: boolean,
    isInSidebar: boolean,
) =>
    [
        {
            title: isPinned
                ? lang.cm_unpin_from_left_sidebar
                : lang.cm_pin_in_left_sidebar,
            icon: isPinned ? 'pin-off' : 'pin',
            action: () => {
                togglePinNode(view, activeNode, isPinned, isInSidebar);
            },
        },
    ] satisfies MenuItemObject[];

export const createSectionColorMenuItems = (
    view: MandalaView,
    section: string | undefined,
) => {
    if (!section) return [];

    const { getSectionColorMap, persistSectionColorMap } =
        createSectionColorPersistence(view);

    return [
        {
            type: 'custom',
            render: (menu, container) => {
                requestAnimationFrame(() => {
                    const sectionColorMap = getSectionColorMap();
                    const sectionColorIndex =
                        createSectionColorIndex(sectionColorMap);
                    const activeColorKey = sectionColorIndex[section];
                    const palette = document.createElement('div');
                    palette.className = 'mandala-color-palette';

                    for (const key of SECTION_COLOR_KEYS) {
                        const button = document.createElement('button');
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
                            persistSectionColorMap(next);
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
                const next = setSectionColor(sectionColorMap, section, null);
                persistSectionColorMap(next);
            },
        },
    ] satisfies MenuItemObject[];
};
