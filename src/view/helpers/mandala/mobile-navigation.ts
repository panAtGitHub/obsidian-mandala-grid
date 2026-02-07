import { MandalaView } from 'src/view/view';
import { Notice } from 'obsidian';
import { findChildGroup } from 'src/lib/tree-utils/find/find-child-group';

export const enterSubgridForNode = (view: MandalaView, nodeId: string) => {
    if (view.mandalaMode !== '3x3') return;

    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return;

    const section = docState.sections.id_section[nodeId];
    if (!section) return;
    const currentTheme = view.viewStore.getValue().ui.mandala.subgridTheme ?? '1';

    if (section === currentTheme && !currentTheme.includes('.')) {
        const content = docState.document.content[nodeId]?.content ?? '';
        if (!content.trim()) {
            new Notice('请先填写内容，再进入下一核心九宫');
            return;
        }
        const nextTheme = String(Number(currentTheme) + 1);
        view.documentStore.dispatch({
            type: 'document/mandala/ensure-core-theme',
            payload: { theme: nextTheme },
        });
        const nextNodeId =
            view.documentStore.getValue().sections.section_id[nextTheme];
        if (nextNodeId) {
            view.viewStore.dispatch({
                type: 'view/set-active-node/mouse-silent',
                payload: { id: nextNodeId },
            });
            view.viewStore.dispatch({
                type: 'view/mandala/subgrid/enter',
                payload: { theme: nextTheme },
            });
        }
        return;
    }

    const childGroup = findChildGroup(
        docState.document.columns,
        nodeId,
    );
    const childCount = childGroup?.nodes.length ?? 0;

    if (childCount < 8) {
        if (childCount === 0) {
            const content =
                docState.document.content[nodeId]?.content ?? '';
            if (!content.trim()) {
                new Notice('请先填写内容，再展开九宫格');
                return;
            }
        }

        view.documentStore.dispatch({
            type: 'document/mandala/ensure-children',
            payload: { parentNodeId: nodeId, count: 8 },
        });
    }

    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: nodeId },
    });
    view.viewStore.dispatch({
        type: 'view/mandala/subgrid/enter',
        payload: { theme: section },
    });
};

export const exitCurrentSubgrid = (view: MandalaView) => {
    if (view.mandalaMode !== '3x3') return;

    const state = view.viewStore.getValue();
    const theme = state.ui.mandala.subgridTheme;
    if (!theme) return;

    const lastDot = theme.lastIndexOf('.');
    const parentTheme = lastDot === -1 ? null : theme.slice(0, lastDot);
    const themeNumber = Number(theme);

    const docState = view.documentStore.getValue();

    if (parentTheme) {
        view.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: parentTheme },
        });
    } else if (!Number.isNaN(themeNumber) && themeNumber > 1) {
        const previousTheme = String(themeNumber - 1);
        view.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: previousTheme },
        });
    } else {
        view.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: '1' },
        });
    }

    const focusTheme =
        // For nested themes like 1.1 or 1.1.1:
        // after exiting, keep focus on the original center theme in the parent grid.
        parentTheme
            ? theme
            : !Number.isNaN(themeNumber) && themeNumber > 1
              ? String(themeNumber - 1)
              : '1';
    const focusNodeId = docState.sections.section_id[focusTheme];
    if (focusNodeId) {
        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse-silent',
            payload: { id: focusNodeId },
        });
    }
};

export const isGridCenter = (view: MandalaView, nodeId: string, section: string) => {
    const theme = view.viewStore.getValue().ui.mandala.subgridTheme;
    // 如果没有子主题前缀，则 '1' 是中心；如果有，则 section === theme 是中心
    return section === (theme ?? '1');
};
