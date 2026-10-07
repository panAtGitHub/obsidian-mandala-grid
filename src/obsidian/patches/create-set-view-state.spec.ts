import { describe, expect, it, vi } from 'vitest';
import type MandalaGrid from 'src/main';
import type { WorkspaceLeaf } from 'obsidian';

vi.mock('src/view/view', () => ({ MANDALA_VIEW_TYPE: 'mandala-grid' }));

import { createSetViewState } from 'src/obsidian/patches/create-set-view-state';

describe('createSetViewState', () => {
    it.each([false, true])(
        'preserves the receiver, ephemeral state and completion (inline editor: %s)',
        async (inlineEditor) => {
            const promise = Promise.resolve();
            const leaf = {} as WorkspaceLeaf;
            const next = vi.fn(function (this: WorkspaceLeaf) {
                expect(this).toBe(leaf);
                return promise;
            });
            const plugin = {
                viewType: { 'note.md': { viewType: 'mandala-grid' } },
            } as unknown as MandalaGrid;
            const state = {
                type: 'markdown',
                state: { file: 'note.md', inlineEditor },
            };
            const ephemeralState = { line: 12 };
            const wrapped = createSetViewState(plugin)(next);

            await expect(
                wrapped.call(leaf, state, ephemeralState),
            ).resolves.toBeUndefined();
            expect(next).toHaveBeenCalledWith(
                { ...state, type: inlineEditor ? 'markdown' : 'mandala-grid' },
                ephemeralState,
            );
        },
    );
});
