import { Notice } from 'obsidian';
import { createClearEmptyMandalaSubgridsPlan } from 'src/mandala-display/logic/clear-empty-subgrids';
import type { MandalaView } from 'src/view/view';
import {
    applyTemplateToCurrentThemeAction,
    openTemplatesFileFromPathAction,
    pickTemplatesFileAction,
    saveCurrentThemeAsTemplateAction,
} from './view-options-template-actions';

type CreateViewOptionsDocumentActionsArgs = {
    view: MandalaView;
    getTemplatesFilePath: () => string | null | undefined;
    closeMenu: () => void;
};

export const createViewOptionsDocumentActions = ({
    view,
    getTemplatesFilePath,
    closeMenu,
}: CreateViewOptionsDocumentActionsArgs) => {
    return {
        clearEmptySubgrids() {
            const state = view.documentStore.getValue();
            if (!state.meta.isMandala) {
                new Notice('当前文档不是九宫格格式。');
                closeMenu();
                return;
            }

            const theme =
                view.viewStore.getValue().ui.mandala.subgridTheme ?? '1';
            const centerNodeId = state.sections.section_id[theme];
            if (!centerNodeId) {
                new Notice('未找到当前主题中心格子。');
                closeMenu();
                return;
            }

            view.viewStore.dispatch({
                type: 'view/set-active-node/document',
                payload: { id: centerNodeId },
            });
            view.viewStore.dispatch({
                type: 'view/selection/set-selection',
                payload: { ids: [centerNodeId] },
            });
            view.alignBranch.align({ type: 'view/align-branch/center-node' });

            const plan = createClearEmptyMandalaSubgridsPlan(
                state.document,
                state.sections,
            );
            if (plan.parentIds.length === 0 && plan.rootNodeIds.length === 0) {
                new Notice('没有可清空的空白九宫格。');
                closeMenu();
                return;
            }
            const nextActiveNodeId = plan.rootNodeIds.includes(centerNodeId)
                ? state.sections.section_id['1'] ?? centerNodeId
                : centerNodeId;

            view.documentStore.dispatch({
                type: 'document/mandala/clear-empty-subgrids',
                payload: {
                    parentIds: plan.parentIds,
                    rootNodeIds: plan.rootNodeIds,
                    activeNodeId: nextActiveNodeId,
                },
            });

            new Notice(
                `已清理 ${plan.parentIds.length} 个空白九宫格、${plan.rootSections.length} 个尾部空核心，共删除 ${plan.nodesToRemove.length} 个格子。`,
            );
            closeMenu();
        },

        openTemplatesFileFromPath() {
            return openTemplatesFileFromPathAction(
                view,
                getTemplatesFilePath(),
                closeMenu,
            );
        },

        pickTemplatesFile() {
            return pickTemplatesFileAction(view);
        },

        saveCurrentThemeAsTemplate() {
            return saveCurrentThemeAsTemplateAction(
                view,
                getTemplatesFilePath(),
                closeMenu,
            );
        },

        applyTemplateToCurrentTheme() {
            return applyTemplateToCurrentThemeAction(
                view,
                getTemplatesFilePath(),
                closeMenu,
            );
        },

        openHotkeysModal() {
            view.viewStore.dispatch({ type: 'view/hotkeys/toggle-modal' });
            closeMenu();
        },
    };
};
