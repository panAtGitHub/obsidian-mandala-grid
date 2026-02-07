import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { cancelChanges } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/cancel-changes';
import { DefaultViewCommand } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
import { sectionAtCell9x9 } from 'src/view/helpers/mandala/mandala-grid';
import { MandalaView } from 'src/view/view';

export const editCommands = () => {
    const ensureNodeForSection = (view: MandalaView, section: string) => {
        const docState = view.documentStore.getValue();
        const existing = docState.sections.section_id[section];
        if (existing) return existing;

        const parts = section.split('.');
        if (parts.length === 0) return null;

        view.documentStore.dispatch({
            type: 'document/mandala/ensure-core-theme',
            payload: { theme: parts[0] },
        });

        let updated = view.documentStore.getValue();
        for (let depth = 1; depth < parts.length; depth++) {
            const parentSection = parts.slice(0, depth).join('.');
            const parentId = updated.sections.section_id[parentSection];
            if (!parentId) break;
            view.documentStore.dispatch({
                type: 'document/mandala/ensure-children',
                payload: { parentNodeId: parentId, count: 8 },
            });
            updated = view.documentStore.getValue();
        }

        return view.documentStore.getValue().sections.section_id[section] || null;
    };

    return [
        {
            name: 'enable_edit_mode',
            callback: (view, event) => {
                event.preventDefault();
                let showDetailSidebar =
                    view.plugin.settings.getValue().view
                        .showMandalaDetailSidebar;
                let nodeId = view.viewStore.getValue().document.activeNode;
                if (view.mandalaMode === '9x9' && view.mandalaActiveCell9x9) {
                    const orientation =
                        view.plugin.settings.getValue().view
                            .mandalaGridOrientation ?? 'left-to-right';
                    const baseTheme = '1';
                    const section = sectionAtCell9x9(
                        view.mandalaActiveCell9x9.row,
                        view.mandalaActiveCell9x9.col,
                        orientation,
                        baseTheme,
                    );
                    if (section) {
                        const existing =
                            view.documentStore.getValue().sections
                                .section_id[section];
                        nodeId =
                            existing ??
                            ensureNodeForSection(view, section) ??
                            nodeId;
                    }
                    if (!showDetailSidebar) {
                        view.plugin.settings.dispatch({
                            type: 'view/mandala-detail-sidebar/toggle',
                        });
                        showDetailSidebar = true;
                    }
                }
                view.viewStore.dispatch({
                    type: 'view/editor/enable-main-editor',
                    payload: {
                        nodeId,
                        isInSidebar: showDetailSidebar,
                    },
                });
            },
            hotkeys: [
                { key: 'Enter', modifiers: [], editorState: 'editor-off' },
            ],
        },
        /*
        {
            name: 'enable_edit_mode_and_place_cursor_at_start',
            callback: (view, event) => {
                event.preventDefault();
                const nodeId = view.viewStore.getValue().document.activeNode;
                view.inlineEditor.setNodeCursor(nodeId, { line: 0, ch: 0 });
                const showDetailSidebar =
                    view.plugin.settings.getValue().view
                        .showMandalaDetailSidebar;
                view.viewStore.dispatch({
                    type: 'view/editor/enable-main-editor',
                    payload: {
                        nodeId: nodeId,
                        isInSidebar: showDetailSidebar,
                    },
                });
            },
            hotkeys: [
                {
                    key: 'Enter',
                    modifiers: ['Shift'],
                    editorState: 'editor-off',
                },
            ],
        },
        {
            name: 'enable_edit_mode_and_place_cursor_at_end',
            callback: (view, event) => {
                event.preventDefault();
                const nodeId = view.viewStore.getValue().document.activeNode;
                view.inlineEditor.deleteNodeCursor(nodeId);
                const showDetailSidebar =
                    view.plugin.settings.getValue().view
                        .showMandalaDetailSidebar;
                view.viewStore.dispatch({
                    type: 'view/editor/enable-main-editor',
                    payload: {
                        nodeId: nodeId,
                        isInSidebar: showDetailSidebar,
                    },
                });
            },
            hotkeys: [
                { key: 'Enter', modifiers: ['Alt'], editorState: 'editor-off' },
            ],
        },
        */
        {
            name: 'save_changes_and_exit_card',
            callback: (view) => {
                saveNodeContent(view);
            },
            hotkeys: [
                {
                    key: 'Enter',
                    modifiers: ['Shift', 'Mod'],
                    editorState: 'editor-on',
                },
            ],
        },

        {
            name: 'disable_edit_mode',
            callback: (view) => {
                cancelChanges(view);
            },
            hotkeys: [
                { key: 'Escape', modifiers: [], editorState: 'editor-on' },
            ],
        },
    ] satisfies DefaultViewCommand[];
};
