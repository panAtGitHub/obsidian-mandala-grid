import { LineageView } from 'src/view/view';
import { HiddenVerticalToolbarButtons } from 'src/stores/settings/derived/view-settings-store';
import { derived } from 'svelte/store';
import { ToolbarButton } from 'src/view/modals/vertical-toolbar-buttons/vertical-toolbar-buttons';
import { lang } from 'src/lang/lang';
import {
    Minus as ZoomOut,
    PanelRightInactive as PanelRight,
    Plus as ZoomIn,
    RotateCcw,
    ScanSearch,
} from 'lucide-svelte';
import { CustomIcon } from 'src/helpers/load-custom-icons';
import { VerticalToolbarActions } from 'src/view/components/container/toolbar-vertical/vertical-toolbar-actions';

export type ToolbarButtonsGroup = {
    id: string;
    buttons: {
        label: string;
        onClick: (e: MouseEvent) => void;
        icon: typeof PanelRight | CustomIcon;
        id: ToolbarButton;
    }[];
};

export const ZoomButtonsList = (
    view: LineageView,
    restoreZoom: () => void,
    showZoomPopupMenu: (event: MouseEvent) => void,
) => {
    const hiddenControlsBarButtons = HiddenVerticalToolbarButtons(view.plugin);
    const h = new VerticalToolbarActions(view);

    return derived([hiddenControlsBarButtons], ([hiddenControlsBarButtons]) => {
        const set = new Set(hiddenControlsBarButtons);
        const buttons: ToolbarButtonsGroup[] = [
            {
                id: 'zoom',
                buttons: [
                    {
                        label: lang.controls_zoom_in,
                        onClick: h.zoomIn,
                        icon: ZoomIn,
                        id: 'zoom-in',
                    },
                    {
                        label: lang.controls_zoom_reset,
                        onClick: restoreZoom,
                        icon: RotateCcw,
                        id: 'zoom-reset',
                    },
                    {
                        label: lang.controls_zoom_presets,
                        onClick: showZoomPopupMenu,
                        icon: ScanSearch,
                        id: 'zoom-presets',
                    },
                    {
                        label: lang.controls_zoom_out,
                        onClick: h.zoomOut,
                        icon: ZoomOut,
                        id: 'zoom-out',
                    },
                ],
            },
        ];

        return buttons
            .map((group) => {
                return {
                    id: group.id,
                    buttons: group.buttons.filter((b) => !set.has(b.id)),
                };
            })
            .filter((g) => g.buttons.length > 0);
    });
};
