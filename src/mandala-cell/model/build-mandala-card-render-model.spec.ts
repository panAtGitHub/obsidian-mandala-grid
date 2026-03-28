import { describe, expect, it } from 'vitest';
import { buildMandalaCardRenderModel } from 'src/mandala-cell/model/build-mandala-card-render-model';
import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';

const baseOptions = () => ({
    viewModel: {
        nodeId: 'node-1',
        section: '1',
        contentEnabled: true,
        style: undefined,
        sectionColor: null,
        metaAccentColor: null,
        displayPolicy: createDefaultCellDisplayPolicy(),
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

    it('exposes detached surface/body styles for inactive cards', () => {
        const model = buildMandalaCardRenderModel({
            ...baseOptions(),
        });

        expect(model.surfaceStyle).toContain(
            'background-color: var(--background-primary)',
        );
        expect(model.bodyStyle).toContain('opacity: var(--inactive-card-opacity)');
    });
});
