import { Menu, MenuItem } from 'obsidian';

export type MenuItemObject =
    | { type: 'separator' }
    | {
          type: 'custom';
          render: (menu: Menu, container: HTMLElement) => void;
      }
    | ({
          title: string;
          icon: string;
          disabled?: boolean;
          checked?: boolean;
          dangerous?: boolean;
      } & (
          | {
                submenu: MenuItemObject[];
            }
          | {
                action: () => void;
            }
      ));

const addMenuItem = (menu: Menu, menuItem: MenuItemObject) => {
    if ('type' in menuItem && menuItem.type === 'separator') {
        menu.addSeparator();
    } else if ('type' in menuItem && menuItem.type === 'custom') {
        menu.addItem((item) => {
            item.setTitle('');
            item.setIcon('');
            const itemDom = (item as MenuItem & { dom?: HTMLElement }).dom;
            if (!itemDom) return;
            itemDom.textContent = '';
            itemDom.classList.add('mandala-context-menu-custom');
            menuItem.render(menu, itemDom);
        });
    } else if ('title' in menuItem) {
        menu.addItem((item) => {
            item.setTitle(menuItem.title)
                .setIcon(menuItem.icon)
                .setDisabled(menuItem.disabled || false)
                .setChecked(menuItem.checked || false);

            if ('submenu' in menuItem) {
                const subMenu = (
                    item as MenuItem & { setSubmenu?: () => Menu }
                ).setSubmenu?.();
                if (subMenu) {
                    for (const subItem of menuItem.submenu) {
                        addMenuItem(subMenu, subItem);
                    }
                }
            } else {
                item.onClick(menuItem.action);
            }
            if (menuItem.dangerous) {
                const itemDom = (item as MenuItem & { dom?: HTMLElement }).dom;
                itemDom?.classList.add('is-warning');
            }
        });
    }
};

export const renderContextMenu = (
    event: MouseEvent,
    menuItems: MenuItemObject[],
) => {
    const menu = new Menu();

    for (const menuItem of menuItems) {
        addMenuItem(menu, menuItem);
    }

    menu.showAtMouseEvent(event);
};
