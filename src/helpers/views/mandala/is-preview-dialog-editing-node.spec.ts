import { describe, expect, it } from 'vitest';
import { isPreviewDialogEditingNode } from 'src/helpers/views/mandala/is-preview-dialog-editing-node';

describe('is-preview-dialog-editing-node', () => {
    it('returns true only when the preview dialog owns editing for the same node', () => {
        expect(
            isPreviewDialogEditingNode({
                previewDialogOpen: true,
                previewDialogNodeId: 'node-1',
                editingActiveNodeId: 'node-1',
                editingIsInSidebar: false,
                nodeId: 'node-1',
            }),
        ).toBe(true);
    });

    it('returns false when the preview dialog is closed', () => {
        expect(
            isPreviewDialogEditingNode({
                previewDialogOpen: false,
                previewDialogNodeId: 'node-1',
                editingActiveNodeId: 'node-1',
                editingIsInSidebar: false,
                nodeId: 'node-1',
            }),
        ).toBe(false);
    });

    it('returns false when editing belongs to another node or another surface', () => {
        expect(
            isPreviewDialogEditingNode({
                previewDialogOpen: true,
                previewDialogNodeId: 'node-1',
                editingActiveNodeId: 'node-2',
                editingIsInSidebar: false,
                nodeId: 'node-1',
            }),
        ).toBe(false);

        expect(
            isPreviewDialogEditingNode({
                previewDialogOpen: true,
                previewDialogNodeId: 'node-1',
                editingActiveNodeId: 'node-1',
                editingIsInSidebar: true,
                nodeId: 'node-1',
            }),
        ).toBe(false);
    });
});
