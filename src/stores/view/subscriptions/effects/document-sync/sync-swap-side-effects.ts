import { MandalaView } from 'src/view/view';
import { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';
import {
    serializeSectionColorMapForSettings,
    swapSectionSubtreeColors,
} from 'src/mandala-display/palette/section-colors';
import { getCurrentFileSectionColorMap } from 'src/mandala-settings/state/current-file/current-file-preferences';
import { persistPinnedNodes } from 'src/stores/view/subscriptions/actions/persist-pinned-nodes';

export const syncSwapSideEffects = (
    view: MandalaView,
    action: Extract<DocumentStoreAction, { type: 'document/mandala/swap' }>,
) => {
    if (!view.file) return;

    const documentState = view.documentStore.getValue();
    const sourceSection =
        documentState.sections.id_section[action.payload.sourceNodeId];
    const targetSection =
        documentState.sections.id_section[action.payload.targetNodeId];

    if (sourceSection && targetSection) {
        const sectionColorMap = getCurrentFileSectionColorMap(view);
        const nextMap = swapSectionSubtreeColors(
            sectionColorMap,
            sourceSection,
            targetSection,
        );
        const currentSerialized = JSON.stringify(
            serializeSectionColorMapForSettings(sectionColorMap),
        );
        const nextSerialized = JSON.stringify(
            serializeSectionColorMapForSettings(nextMap),
        );

        if (currentSerialized !== nextSerialized) {
            view.plugin.settings.dispatch({
                type: 'settings/documents/persist-mandala-section-colors',
                payload: {
                    path: view.file.path,
                    map: serializeSectionColorMapForSettings(nextMap),
                },
            });
        }
    }

    persistPinnedNodes(view);
};
