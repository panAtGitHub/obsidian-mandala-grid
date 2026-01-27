import { MenuItemObject } from 'src/obsidian/context-menu/render-context-menu';
import { lang } from 'src/lang/lang';
import { jumpCoreTheme } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme';
import { MandalaView } from 'src/view/view';

export const createCoreJumpMenuItems = (
    view: MandalaView,
): MenuItemObject[] => {
    const docState = view.documentStore.getValue();
    const isMandala = docState.meta.isMandala && view.mandalaMode !== null;
    if (!isMandala) return [];

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = docState.sections.id_section[activeNodeId];
    if (!activeSection) return [];

    const core = activeSection.split('.')[0];
    const coreNumber = Number(core);
    if (!core || Number.isNaN(coreNumber)) return [];

    const canJumpNext = true;
    const canJumpPrev = coreNumber > 1;

    return [
        {
            title: lang.hk_jump_core_next,
            icon: 'arrow-down',
            action: () => jumpCoreTheme(view, 'down'),
            disabled: !canJumpNext,
        },
        {
            title: lang.hk_jump_core_prev,
            icon: 'arrow-up',
            action: () => jumpCoreTheme(view, 'up'),
            disabled: !canJumpPrev,
        },
    ];
};
