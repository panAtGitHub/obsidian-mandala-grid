import { LineageView } from 'src/view/view';
import { Settings } from 'src/stores/settings/settings-type';
import { SettingsActions } from 'src/stores/settings/settings-reducer';
import { applyFontSize } from 'src/stores/view/subscriptions/effects/css-variables/apply-font-size';
import { applyCssColor } from 'src/stores/view/subscriptions/effects/css-variables/apply-css-color';
import { applyCardWidth } from 'src/stores/view/subscriptions/effects/css-variables/apply-card-width';
import { applyZoomLevel } from './effects/css-variables/apply-zoom-level';
import { applyCardsGap } from 'src/stores/view/subscriptions/effects/css-variables/apply-cards-gap';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
import { applyCardIndentationWidth } from 'src/stores/view/subscriptions/effects/css-variables/apply-card-indentation-width';
import { applyInactiveNodeOpacity } from 'src/stores/view/subscriptions/effects/css-variables/apply-inactive-node-opacity';
import { getUsedHotkeys } from 'src/obsidian/helpers/get-used-hotkeys';

export const onPluginSettingsUpdate = (
    view: LineageView,
    state: Settings,
    action: SettingsActions,
) => {
    if (!view.container) return;
    const type = action.type;
    if (type === 'SET_FONT_SIZE') {
        applyFontSize(view, state.view.fontSize);
    } else if (type === 'SET_CONTAINER_BG') {
        applyCssColor(view, 'containerBg');
    } else if (type === 'SET_ACTIVE_BRANCH_BG') {
        applyCssColor(view, 'activeBranchBg');
    } else if (type === 'SET_CARD_WIDTH') {
        applyCardWidth(view, state.view.cardWidth);
    } else if (type === 'SET_CARDS_GAP') {
        applyCardsGap(view, state.view.cardsGap);
    } else if (action.type === 'UI/CHANGE_ZOOM_LEVEL') {
        applyZoomLevel(view, state.view.zoomLevel);
        view.zoomFactor = state.view.zoomLevel;
    } else if (action.type === 'SET_DOCUMENT_TYPE') {
        view.saveDocument();
    } else if (type === 'settings/view/set-node-indentation-width') {
        applyCardIndentationWidth(view, state.view.nodeIndentationWidth);
    } else if (type === 'settings/view/theme/set-inactive-node-opacity') {
        applyInactiveNodeOpacity(view, state.view.theme.inactiveNodeOpacity);
    } else if (type === 'settings/view/theme/set-active-branch-color') {
        applyCssColor(view, 'activeBranchColor');
    } else if (
        type === 'settings/hotkeys/reset-all' ||
        type === 'settings/hotkeys/apply-preset' ||
        type === 'settings/hotkeys/reset-custom-hotkey' ||
        type === 'settings/hotkeys/set-custom-hotkey' ||
        type === 'settings/hotkeys/set-blank'
    ) {
        view.viewStore.dispatch({
            type: 'view/hotkeys/update-conflicts',
            payload: {
                conflicts: getUsedHotkeys(view.plugin),
            },
        });
    } else if (type === 'settings/view/modes/toggle-outline-mode') {
        if (state.view.outlineMode) {
            view.viewStore.dispatch({
                type: 'view/outline/refresh-collapsed-nodes',
            });
        }
    }

    const shouldAlign =
        type === 'view/left-sidebar/toggle' ||
        type === 'view/left-sidebar/set-width' ||
        type === 'UI/CHANGE_ZOOM_LEVEL' ||
        type === 'SET_CARD_WIDTH' ||
        type === 'SET_LIMIT_PREVIEW_HEIGHT' ||
        type === 'VIEW/TOGGLE_MINIMAP' ||
        type === 'VIEW/SCROLLING/TOGGLE_SCROLLING_MODE' ||
        type === 'settings/view/scrolling/toggle-vertical-scrolling-mode' ||
        type === 'SET_CARDS_GAP' ||
        type === 'view/modes/gap-between-cards/toggle' ||
        type === 'settings/view/set-node-indentation-width';
    if (shouldAlign) {
        view.alignBranch.align(action);
    }
    if (view.isActive && type === 'UI/CHANGE_ZOOM_LEVEL') {
        focusContainer(view);
    }

    const shouldUpdateStyleRules =
        type === 'settings/style-rules/add' ||
        type === 'settings/style-rules/update' ||
        type === 'settings/style-rules/delete' ||
        type === 'settings/style-rules/update-condition' ||
        type === 'settings/style-rules/enable-rule' ||
        type === 'settings/style-rules/disable-rule' ||
        type === 'settings/style-rules/move' ||
        type === 'settings/style-rules/update-style' ||
        type === 'settings/style-rules/toggle-global';
    if (shouldUpdateStyleRules) {
        view.rulesProcessor.onRulesUpdate();
    }
};
