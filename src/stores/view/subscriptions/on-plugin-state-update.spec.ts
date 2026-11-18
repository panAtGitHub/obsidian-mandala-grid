import { expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { EditSessionService } from 'src/view/edit-session/edit-session-service';
import { onPluginStateUpdate } from './on-plugin-state-update';

it('discards an unsubmitted draft when its pane loses activation', () => {
    const commit = vi.fn();
    const session = new EditSessionService(commit);
    session.startSession('node-1', true, 'original');
    session.updateBuffer('unsaved');
    const view = {
        container: {},
        isActive: false,
        viewStore: {
            getValue: () => ({
                document: {
                    editing: { activeNodeId: 'node-1', isInSidebar: true },
                },
            }),
            dispatch: vi.fn(),
        },
        inlineEditor: { unloadNode: () => session.endSession() },
    };

    onPluginStateUpdate(view as never, {
        type: 'plugin/echo/workspace/active-leaf-change',
    });

    expect(get(session.stateStore).activeNodeId).toBeNull();
    expect(get(session.stateStore).bufferContent).toBe('');
    expect(commit).not.toHaveBeenCalled();
    expect(view.viewStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'view/editor/disable-sidebar-editor' }),
    );
});
