import { LineageView } from 'src/view/view';
import { isEmptyDocument } from 'src/stores/view/subscriptions/helpers/is-empty-document';
import { enableEditMode } from 'src/stores/view/subscriptions/actions/enable-edit-mode';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
import { applyFontSize } from 'src/stores/view/subscriptions/effects/css-variables/apply-font-size';
import { applyCssColor } from 'src/stores/view/subscriptions/effects/css-variables/apply-css-color';
import { applyCardWidth } from 'src/stores/view/subscriptions/effects/css-variables/apply-card-width';
import { applyZoomLevel } from './effects/css-variables/apply-zoom-level';
import { setInitialActiveNode } from 'src/stores/view/subscriptions/actions/view/set-initial-active-node';
import { markUnresolvedLinks } from 'src/stores/view/subscriptions/effects/mark-unresolved-links/mark-unresolved-links';
import { attachHoverPreviewListener } from 'src/stores/view/subscriptions/event-listeners/attach-hover-preview-listener';
import { attachWheelScrollListener } from 'src/stores/view/subscriptions/event-listeners/attach-wheel-scroll-listener';
import { applyCardsGap } from 'src/stores/view/subscriptions/effects/css-variables/apply-cards-gap';
import { loadPinnedNodesToDocument } from 'src/stores/view/subscriptions/actions/load-pinned-nodes-to-document';
import { attachCloseModalsListener } from 'src/stores/view/subscriptions/attach-close-modals-listener';
import { applyCardIndentationWidth } from 'src/stores/view/subscriptions/effects/css-variables/apply-card-indentation-width';
import { attachCheckboxListener } from 'src/stores/view/subscriptions/effects/checkbox-listener/attach-checkbox-listener';
import { watchViewSize } from 'src/stores/view/subscriptions/effects/view-size/watch-view-size';
import { applyInactiveNodeOpacity } from 'src/stores/view/subscriptions/effects/css-variables/apply-inactive-node-opacity';
import { loadCollapsedSectionsFromSettings } from 'src/stores/view/subscriptions/actions/view/load-collapsed-sections-from-settings';
import { applyHeadingsFontSize } from 'src/stores/view/subscriptions/effects/css-variables/apply-headings-font-size';

const applySettingsToView = (view: LineageView) => {
    const state = view.plugin.settings.getValue();
    applyFontSize(view, state.view.fontSize);
    applyHeadingsFontSize(view, state.view.h1FontSize_em);
    applyInactiveNodeOpacity(view, state.view.theme.inactiveNodeOpacity);
    applyCssColor(view, 'containerBg');
    applyCssColor(view, 'activeBranchBg');
    applyCssColor(view, 'activeBranchColor');
    applyCardWidth(view, state.view.cardWidth);
    applyCardIndentationWidth(view, state.view.nodeIndentationWidth);
    applyCardsGap(view, state.view.cardsGap);
    if (!view.container) return;
    applyZoomLevel(view, state.view.zoomLevel);
    attachCheckboxListener(view);
};

export const onViewMount = (view: LineageView) => {
    const subscriptions: Set<() => void> = new Set();
    const documentStore = view.documentStore;
    const documentState = documentStore.getValue();
    const viewStore = view.viewStore;
    // actions
    if (!view.file) return subscriptions;
    setInitialActiveNode(view);
    loadCollapsedSectionsFromSettings(view);
    if (view.isActive && isEmptyDocument(documentState.document.content)) {
        enableEditMode(viewStore, documentState);
    }
    view.plugin.statusBar.updateAll(view);
    // effects
    if (view.isActive) focusContainer(view);

    loadPinnedNodesToDocument(view);
    markUnresolvedLinks(view);
    applySettingsToView(view);
    attachHoverPreviewListener(view);
    attachWheelScrollListener(view);
    documentStore.dispatch({ type: 'document/meta/refresh-group-parent-ids' });
    attachCloseModalsListener(view);
    view.rulesProcessor.onRulesUpdate();
    view.zoomFactor = view.plugin.settings.getValue().view.zoomLevel;

    subscriptions.add(watchViewSize(view));
    return subscriptions;
};
