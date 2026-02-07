import { MandalaView } from 'src/view/view';
import { Platform } from 'obsidian';
import {
    HiddenVerticalToolbarButtons,
    MandalaModeStore
} from 'src/stores/settings/derived/view-settings-store';
import { derived } from 'svelte/store';
import { ToolbarButton } from 'src/view/modals/vertical-toolbar-buttons/vertical-toolbar-buttons';
import { lang } from 'src/lang/lang';
import {
    Palette,
    PanelRight,
    Eye,
    ArrowLeftCircle,
    ArrowRightCircle,
} from 'lucide-svelte';
import { CustomIcon, customIcons } from 'src/helpers/load-custom-icons';
import { VerticalToolbarActions } from 'src/view/components/container/toolbar-vertical/vertical-toolbar-actions';
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
    const mandalaModeStore = MandalaModeStore(view);
    const h = new VerticalToolbarActions(view);

    return derived(
        [hiddenControlsBarButtons, mandalaModeStore],
        ([hiddenControlsBarButtons, mandalaMode]) => {
            const set = new Set(hiddenControlsBarButtons);
            const buttons: ToolbarButtonsGroup[] = [
                {
                    id: 'minimap',
                    buttons: [
                        {
                            label: lang.controls_toggle_minimap,
                            onClick: h.toggleMinimap,
                            icon: PanelRight,
                            id: 'minimap',
                        },
                    ],
                },
                {
                    id: 'settings',
                    buttons: [
                        // Temporarily hidden: user requested removing the gear button from UI.
                        // Keep the code commented for possible future restore.
                        // {
                        //     label: lang.controls_settings,
                        //     onClick: h.toggleSettings,
                        //     icon: Settings,
                        //     id: 'settings',
                        // },
                        {
                            label: lang.controls_rules,
                            onClick: h.toggleStyleRules,
                            icon: Palette,
                            id: 'style-rules',
                        },
                    ],
                },
                {
                    id: 'mandala',
                    buttons: [
                        {
                            label: '详情侧边栏',
                            onClick: () => {
                                view.plugin.settings.dispatch({
                                    type: 'view/mandala-detail-sidebar/toggle',
                                });
                            },
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
                {
                    id: 'scroll',
                    buttons: [
                        {
                            label: lang.controls_toggle_scrolling_mode_horizontal,
                            onClick: h.toggleScrollModeH,
                            icon: customIcons.alignH,
                            id: 'center-active-node-h',
                        },
                        {
                            label: lang.controls_toggle_scrolling_mode_vertical,
                            onClick: h.toggleScrollModeV,
                            icon: customIcons.alignV,
                            id: 'center-active-node-v',
                        },
                        {
                            label: lang.controls_single_column,
                            onClick: h.toggleOutlineMode,
                            icon: customIcons.outline,
                            id: 'outline-mode',
                        },
                        {
                            label: lang.controls_gap_between_cards,
                            onClick: h.toggleGap,
                            icon: customIcons.gap,
                            id: 'space-between-cards',
                        },
                        {
                            label: lang.controls_toggle_hidden_card_info,
                            onClick: h.toggleHiddenInfo,
                            icon: Eye,
                            id: 'hidden-card-info',
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
                                if (!Platform.isMobile && (b.id as string).startsWith('jump-core-')) return false;

                                if (
                                    b.id === 'minimap' ||
                                    b.id === 'outline-mode' ||
                                    b.id === 'center-active-node-h' ||
                                    b.id === 'center-active-node-v' ||
                                    b.id === 'style-rules' ||
                                    b.id === 'space-between-cards' ||
                                    b.id === 'hidden-card-info'
                                )
                                    return false;

                                if (
                                    (b.id as string) === 'mandala-detail-sidebar'
                                ) {
                                    // Show in both 3x3 and 9x9 modes
                                    return true;
                                }

                                if ((b.id as string) === 'toggle-9x9-title-only') {
                                    if (mandalaMode !== '9x9') return false;
                                }
                            }
                            return !set.has(b.id);
                        }),
                    };
                })
                .filter((g) => g.buttons.length > 0);
        });
};
