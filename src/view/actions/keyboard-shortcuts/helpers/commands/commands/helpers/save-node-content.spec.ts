import { describe, expect, it, vi } from 'vitest';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';

const createView = (activeNodeId: string | null, isInSidebar = false) => ({
    inlineEditor: {
        nodeId: null as string | null,
        requestSave: vi.fn(async () => true),
        unloadNode: vi.fn(),
    },
    viewStore: {
        getValue: vi.fn(() => ({
            document: {
                editing: { activeNodeId, isInSidebar },
            },
        })),
        dispatch: vi.fn(),
    },
});

describe('saveNodeContent', () => {
    it('does not treat a stale inline editor node as active editing', async () => {
        const view = createView(null);
        view.inlineEditor.nodeId = 'stale-node';

        await saveNodeContent(view as never);

        expect(view.inlineEditor.requestSave).not.toHaveBeenCalled();
        expect(view.viewStore.dispatch).not.toHaveBeenCalled();
    });

    it('uses Store editing state to save and disable the main editor', async () => {
        const view = createView('node-1');

        await saveNodeContent(view as never, true);

        expect(view.inlineEditor.requestSave).toHaveBeenCalledTimes(1);
        expect(view.viewStore.dispatch).toHaveBeenCalledWith({
            type: 'view/editor/disable-main-editor',
            context: { modKey: true },
        });
    });

    it('disables the sidebar editor from Store editing state', async () => {
        const view = createView('node-1', true);

        await saveNodeContent(view as never);

        expect(view.viewStore.dispatch).toHaveBeenCalledWith({
            type: 'view/editor/disable-sidebar-editor',
            context: { modKey: false },
        });
    });
});
