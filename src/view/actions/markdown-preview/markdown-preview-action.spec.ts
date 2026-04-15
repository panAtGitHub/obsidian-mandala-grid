import { writable } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    renderMarkdownContent: vi.fn(() => undefined),
}));

vi.mock('src/view/actions/markdown-preview/helpers/render-markdown-content', () => ({
    renderMarkdownContent: mocks.renderMarkdownContent,
}));

import { createMarkdownPreviewAction } from 'src/view/actions/markdown-preview/markdown-preview-action';

describe('markdown-preview-action', () => {
    beforeEach(() => {
        mocks.renderMarkdownContent.mockReset();
    });

    it('renders committed content by default and supports contentOverride including empty string', () => {
        const content = writable('committed');
        const runtime = {
            app: {} as never,
            component: {} as never,
            getSourcePath: () => 'mock.md',
            contentForNode: vi.fn(() => content),
        };
        const action = createMarkdownPreviewAction(runtime);
        const element = {} as HTMLElement;

        const binding = action(element, 'node-1');

        expect(runtime.contentForNode).toHaveBeenCalledWith('node-1');
        expect(mocks.renderMarkdownContent).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'committed' }),
        );

        binding?.update?.({
            nodeId: 'node-1',
            contentOverride: '',
        });

        expect(mocks.renderMarkdownContent).toHaveBeenCalledWith(
            expect.objectContaining({ content: '' }),
        );

        binding?.update?.('node-1');
        content.set('next committed');

        expect(mocks.renderMarkdownContent).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'next committed' }),
        );
    });
});
