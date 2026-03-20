import { Notice } from 'obsidian';
import { isEmptyMandalaContent } from 'src/lib/mandala/is-empty-mandala-content';
import type { MandalaView } from 'src/view/view';
import {
    resolveNx9Context,
    type Nx9CellWithPage,
} from 'src/view/helpers/mandala/nx9/context';
import { setActiveCellNx9 } from 'src/view/helpers/mandala/nx9/set-active-cell';

const resolveFallbackCell = (
    nextCoreSection: string,
    cell: Nx9CellWithPage | null,
): Nx9CellWithPage => {
    if (cell) return cell;
    const rowIndex = Math.max(Number(nextCoreSection) - 1, 0);
    return {
        page: 0,
        row: rowIndex,
        col: 0,
    };
};

export const createNextNx9Core = (
    view: MandalaView,
    nextCoreSection: string,
) => {
    const previousCoreNumber = Number(nextCoreSection) - 1;
    if (previousCoreNumber >= 1) {
        const previousCoreSection = String(previousCoreNumber);
        const documentState = view.documentStore.getValue();
        const previousCoreNodeId =
            documentState.sections.section_id[previousCoreSection];
        const previousCoreContent = previousCoreNodeId
            ? documentState.document.content[previousCoreNodeId]?.content ?? ''
            : '';

        if (isEmptyMandalaContent(previousCoreContent)) {
            new Notice(
                `请先填写核心 ${previousCoreSection} 的中心格内容，再创建新的核心九宫格。`,
            );
            return false;
        }
    }

    view.documentStore.dispatch({
        type: 'document/mandala/ensure-core-theme',
        payload: { theme: nextCoreSection },
    });

    const documentState = view.documentStore.getValue();
    const nextNodeId = documentState.sections.section_id[nextCoreSection];
    if (!nextNodeId) return false;

    const context = resolveNx9Context({
        sectionIdMap: documentState.sections.section_id,
        documentContent: documentState.document.content,
        rowsPerPage: view.getCurrentNx9RowsPerPage(),
        activeSection: nextCoreSection,
    });
    const nextCell = resolveFallbackCell(
        nextCoreSection,
        context.posForSection(nextCoreSection),
    );

    setActiveCellNx9(view, nextCell);
    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: nextNodeId },
    });
    return true;
};
