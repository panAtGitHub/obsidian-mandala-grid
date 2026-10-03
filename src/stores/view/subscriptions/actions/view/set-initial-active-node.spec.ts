import { describe, expect, it, vi } from 'vitest';

vi.mock('src/view/view', () => ({}));

import { setInitialActiveNode } from 'src/stores/view/subscriptions/actions/view/set-initial-active-node';

const createView = (bootstrapTarget: unknown) => {
    const dispatch = vi.fn();
    const setContext = vi.fn();
    return {
        getInitialBootstrapTarget: () => bootstrapTarget,
        viewStore: { dispatch, setContext },
        documentStore: {
            getValue: () => ({
                document: { columns: [] },
                sections: {
                    section_id: { '1': 'node-1' },
                    id_section: { 'node-1': '1' },
                },
                history: { context: { activeSection: null } },
            }),
        },
        plugin: {
            settings: {
                getValue: () => ({
                    documents: { 'daily.md': { activeSection: '1' } },
                }),
            },
        },
        file: { path: 'daily.md' },
    };
};

describe('setInitialActiveNode', () => {
    it('does not overwrite the active node after fast bootstrap', () => {
        const view = createView({
            centerSection: '1',
            activeSection: '1',
            source: 'explicit-jump',
        });

        setInitialActiveNode(view as never);

        expect(view.viewStore.dispatch).not.toHaveBeenCalled();
        expect(view.viewStore.setContext).not.toHaveBeenCalled();
    });

    it('keeps persisted active restoration for non-bootstrap loads', () => {
        const view = createView(null);

        setInitialActiveNode(view as never);

        expect(view.viewStore.dispatch).toHaveBeenCalledWith({
            type: 'view/set-active-node/document',
            payload: { id: 'node-1' },
        });
        expect(view.viewStore.setContext).toHaveBeenCalledOnce();
    });
});
