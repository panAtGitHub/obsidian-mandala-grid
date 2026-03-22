import { MandalaView } from 'src/view/view';
import { Platform } from 'obsidian';
import {
    HiddenVerticalToolbarButtons
} from 'src/mandala-settings/state/derived/view-settings-store';
import { derived } from 'svelte/store';
import { ToolbarButton } from 'src/ui/toolbar/vertical/config/vertical-toolbar-buttons';
import { lang } from 'src/lang/lang';
import {
    PanelRight,
    ArrowLeftCircle,
    ArrowRightCircle,
} from 'lucide-svelte';
import { CustomIcon } from 'src/shared/helpers/load-custom-icons';
import { jumpCoreTheme } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme';

export type ToolbarButtonsGroup = {
    id: string;
    buttons: {
        label: string;
        onClick: (e: MouseEvent) => void;
        icon: typeof PanelRight | CustomIcon;
        id: ToolbarButton;
    }[];
};

export const VerticalToolbarButtonsList = (view: MandalaView) => {
    const hiddenControlsBarButtons = HiddenVerticalToolbarButtons(view.plugin);

    return derived(
        [hiddenControlsBarButtons],
        ([hiddenControlsBarButtons]) => {
            const set = new Set(hiddenControlsBarButtons);
            const buttons: ToolbarButtonsGroup[] = [
                {
                    id: 'mandala',
                    buttons: [
                        {
                            label: '详情侧边栏',
                            onClick: () => view.toggleCurrentMandalaDetailSidebar(),
                            icon: PanelRight,
                            id: 'mandala-detail-sidebar' as unknown as ToolbarButton,
                        },
                        {
                            label: lang.hk_jump_core_prev,
                            onClick: () => jumpCoreTheme(view, 'up'),
                            icon: ArrowLeftCircle,
                            id: 'jump-core-prev' as unknown as ToolbarButton,
                        },
                        {
                            label: lang.hk_jump_core_next,
                            onClick: () => jumpCoreTheme(view, 'down'),
                            icon: ArrowRightCircle,
                            id: 'jump-core-next' as unknown as ToolbarButton,
                        },
                    ],
                },
            ];

            const viewType = view.getViewType();
            const isMandala = viewType === 'mandala-grid';

            return buttons
                .map((group) => {
                    return {
                        id: group.id,
                        buttons: group.buttons.filter((b) => {
                            if (isMandala) {
                                if (Platform.isMobile && b.id === 'mandala-mode') return false;
                                if (
                                    view.mandalaMode === 'week-7x9' &&
                                    (b.id as string).startsWith('jump-core-')
                                ) {
                                    return false;
                                }
                                if (!Platform.isMobile && (b.id as string).startsWith('jump-core-')) return false;

                                if (
                                    (b.id as string) === 'mandala-detail-sidebar'
                                ) {
                                    // Show in both 3x3 and 9x9 modes
                                    return true;
                                }
                            }
                            return !set.has(b.id);
                        }),
                    };
                })
                .filter((g) => g.buttons.length > 0);
        });
};
