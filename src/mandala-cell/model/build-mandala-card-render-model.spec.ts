import { describe, expect, it } from 'vitest';
import { buildMandalaCardRenderModel } from 'src/mandala-cell/model/build-mandala-card-render-model';
import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';
import { buildCellInteractionPolicy } from 'src/mandala-cell/viewmodel/policies/cell-interaction-policy';

const baseOptions = () => ({
    viewModel: {
        nodeId: 'node-1',
        section: '1',
        contentEnabled: true,
        style: undefined,
        sectionColor: null,
        metaAccentColor: null,
        displayPolicy: createDefaultCellDisplayPolicy(),
        interactionPolicy: buildCellInteractionPolicy({
            preset: 'grid-nx9',
        }),
        gridCell: null,
    },
    uiState: {
        active: false,
        editing: false,
        selected: false,
        pinned: false,
    },
    previewDialogOpen: false,
    previewDialogNodeId: null,
    showDetailSidebar: false,
    isMobile: false,
    themeTone: 'light' as const,
});

describe('buildMandalaCardRenderModel', () => {
    it('hides markdown content when content hydration is disabled', () => {
        const model = buildMandalaCardRenderModel({
            ...baseOptions(),
            viewModel: {
                ...baseOptions().viewModel,
                contentEnabled: false,
            },
        });

        expect(model.showInlineEditor).toBe(false);
        expect(model.showContent).toBe(false);
    });

    it('still hides content when inline editor owns the card', () => {
        const model = buildMandalaCardRenderModel({
            ...baseOptions(),
            uiState: {
                ...baseOptions().uiState,
                active: true,
                editing: true,
            },
        });

        expect(model.showInlineEditor).toBe(true);
        expect(model.showContent).toBe(false);
    });

    it('keeps active editor semantics when visual active surface is disabled', () => {
        const model = buildMandalaCardRenderModel({
            ...baseOptions(),
            uiState: {
                ...baseOptions().uiState,
                active: true,
                editing: true,
            },
            visualActive: false,
        });

        expect(model.showInlineEditor).toBe(true);
        expect(model.showContent).toBe(false);
        expect(model.cardStyle).toBeUndefined();
    });
});
