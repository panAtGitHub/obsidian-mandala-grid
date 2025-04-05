import { LineageView } from 'src/view/view';
import { Platform } from 'obsidian';
import { onLongPress } from 'src/helpers/on-long-press';
import { showNodeContextMenu } from 'src/view/actions/context-menu/card-context-menu/show-node-context-menu';
import { shouldShowNodeContextMenu } from 'src/view/actions/context-menu/card-context-menu/should-show-node-context-menu';
import { shouldShowViewContextMenu } from 'src/view/actions/context-menu/view-context-menu/should-show-view-context-menu';
import { showViewContextMenu } from 'src/view/actions/context-menu/view-context-menu/show-view-context-menu';

export const showContextMenu = (element: HTMLElement, view: LineageView) => {
    const listener = (e: MouseEvent | TouchEvent) => {
        if (shouldShowNodeContextMenu(e)) {
            if (e.instanceOf(MouseEvent)) showNodeContextMenu(e, view);
            else showNodeContextMenu(new MouseEvent('contextmenu', e), view);
        } else if (shouldShowViewContextMenu(e)) {
            if (e.instanceOf(MouseEvent)) showViewContextMenu(e, view);
            else showViewContextMenu(new MouseEvent('contextmenu', e), view);
        }
    };
    element.addEventListener('contextmenu', listener);

    let unsubFromLongPress: (() => void) | null = null;
    if (Platform.isMobile) {
        unsubFromLongPress = onLongPress(
            element,
            listener,
            shouldShowNodeContextMenu,
        );
    }
    return {
        destroy: () => {
            element.removeEventListener('contextmenu', listener);
            if (unsubFromLongPress) {
                unsubFromLongPress();
            }
        },
    };
};
