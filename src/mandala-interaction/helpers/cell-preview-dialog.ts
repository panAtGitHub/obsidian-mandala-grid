import { Platform } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import { resolveCellPreviewNodeId } from 'src/mandala-interaction/helpers/resolve-cell-preview-node-id';
import {
    getMandalaActiveCell9x9,
    getMandalaActiveCellNx9,
    getMandalaActiveCellWeek7x9,
    getMandalaWeekAnchorDate,
} from 'src/mandala-scenes/shared/scene-runtime';

const isCellQuickPreviewEnabled = (view: MandalaView) =>
    Platform.isMobile
        ? !!view.plugin.settings.getValue().view
              .showCellQuickPreviewDialogMobile
        : !!view.plugin.settings.getValue().view
              .showCellQuickPreviewDialogDesktop;

export const openCellPreviewDialog = (view: MandalaView, nodeId: string) => {
    if (!nodeId || Platform.isMobile || !isCellQuickPreviewEnabled(view)) {
        return false;
    }
    view.viewStore.dispatch({
        type: 'view/preview-dialog/open',
        payload: { nodeId },
    });
    return true;
};

export const closeCellPreviewDialog = (view: MandalaView) => {
    if (Platform.isMobile) return;
    view.viewStore.dispatch({
        type: 'view/preview-dialog/close',
    });
};

export const toggleCellPreviewDialog = (view: MandalaView) => {
    if (Platform.isMobile || !isCellQuickPreviewEnabled(view)) return false;

    const viewState = view.viewStore.getValue();
    if (viewState.ui.previewDialog.open) {
        closeCellPreviewDialog(view);
        return true;
    }

    const documentState = view.documentStore.getValue();
    const settings = view.plugin.settings.getValue();
    const nodeId = resolveCellPreviewNodeId({
        mode: view.mandalaMode,
        variant: view.getMandalaSceneKey(documentState.file.frontmatter).variant,
        activeNodeId: viewState.document.activeNode,
        activeNodeSection:
            documentState.sections.id_section[viewState.document.activeNode] ??
            null,
        activeCell9x9: getMandalaActiveCell9x9(viewState),
        activeCellNx9: getMandalaActiveCellNx9(viewState),
        activeCellWeek7x9: getMandalaActiveCellWeek7x9(viewState),
        sectionIdMap: documentState.sections.section_id,
        documentContent: documentState.document.content,
        nx9RowsPerPage: view.getCurrentNx9RowsPerPage(settings),
        selectedLayoutId: view.getCurrentMandalaLayoutId(settings),
        customLayouts: settings.view.mandalaGridCustomLayouts ?? [],
        frontmatter: documentState.file.frontmatter,
        weekAnchorDate: getMandalaWeekAnchorDate(viewState),
        weekStart: settings.general.weekStart,
    });

    if (!nodeId) return false;
    return openCellPreviewDialog(view, nodeId);
};
