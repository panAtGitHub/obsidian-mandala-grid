import { describe, expect, it } from 'vitest';
import { createPinnedListContextMenuItems } from 'src/view/actions/context-menu/card-context-menu/create-pinned-list-context-menu-items';

const createView = (headingEmbedDollar: boolean) =>
    ({
        plugin: {
            settings: {
                getValue: () => ({
                    view: {
                        contextMenuCopyLinkVisibilityDesktop: {
                            'heading-embed-dollar': headingEmbedDollar,
                        },
                        contextMenuCopyLinkVisibilityMobile: {
                            'heading-embed-dollar': headingEmbedDollar,
                        },
                    },
                }),
            },
        },
    }) as never;

describe('createPinnedListContextMenuItems', () => {
    it('includes heading link, pin toggle, and color items when heading dollar links are enabled', () => {
        const menuItems = createPinnedListContextMenuItems(createView(true), {
            activeNode: 'n1',
            section: '6.2',
        });

        expect(menuItems).toHaveLength(6);
        expect('title' in menuItems[0] ? menuItems[0].title : '').toBe(
            '复制标题链接（带 ! 与 |$）',
        );
        expect('title' in menuItems[2] ? menuItems[2].title : '').toBe(
            '从左侧边栏取消固定',
        );
        expect(menuItems[4]).toMatchObject({ type: 'custom' });
        expect('title' in menuItems[5] ? menuItems[5].title : '').toBe(
            '清除颜色',
        );
    });

    it('hides heading link item when the existing visibility setting disables it', () => {
        const menuItems = createPinnedListContextMenuItems(createView(false), {
            activeNode: 'n1',
            section: '6.2',
        });

        expect(menuItems).toHaveLength(4);
        expect('title' in menuItems[0] ? menuItems[0].title : '').toBe(
            '从左侧边栏取消固定',
        );
        expect(menuItems[2]).toMatchObject({ type: 'custom' });
    });
});
