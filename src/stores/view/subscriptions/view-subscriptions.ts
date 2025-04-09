import { LineageView } from 'src/view/view';
import { onViewMount } from 'src/stores/view/subscriptions/on-view-mount';
import { onViewStateUpdate } from 'src/stores/view/subscriptions/on-view-state-update';
import { onDocumentStateUpdate } from 'src/stores/view/subscriptions/on-document-state-update';
import { onPluginSettingsUpdate } from 'src/stores/view/subscriptions/on-plugin-settings-update';
import { onPluginStateUpdate } from 'src/stores/view/subscriptions/on-plugin-state-update';
import { onMetadataCache } from 'src/stores/view/subscriptions/on-metadata-cache';

export const viewSubscriptions = (view: LineageView) => {
    const unsubFromDocument = view.documentStore.subscribe(
        (documentState, action) => {
            if (!action) return;
            onDocumentStateUpdate(view, action);
        },
    );

    const localState = {
        previousActiveNode: '',
    };
    let onMountSubscriptions = new Set<() => void>();
    const unsubFromView = view.viewStore.subscribe(
        (viewState, action, initialRun) => {
            if (initialRun) {
                onMountSubscriptions = onViewMount(view);
            } else if (action) {
                onViewStateUpdate(view, action, localState);
            }
        },
    );

    const unsubFromDocuments = view.plugin.store.subscribe((_, action) => {
        if (!action) return;
        onPluginStateUpdate(view, action);
    });

    const unsubFromSettings = view.plugin.settings.subscribe(
        (state, action) => {
            if (!action) return;
            onPluginSettingsUpdate(view, state, action);
        },
    );

    const unsubFromCache = onMetadataCache(view);

    return () => {
        unsubFromDocument();
        unsubFromCache();
        unsubFromView();
        unsubFromSettings();
        unsubFromDocuments();
        view.rulesProcessor.onViewUnmount();
        for (const unsub of onMountSubscriptions) {
            unsub();
        }
    };
};
