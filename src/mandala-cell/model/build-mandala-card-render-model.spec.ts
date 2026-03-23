import { describe, expect, it } from 'vitest';
import { buildMandalaCardRenderModel } from 'src/mandala-cell/model/build-mandala-card-render-model';
import { createDefaultCellDisplayPolicy } from 'src/mandala-cell/model/default-cell-display-policy';

const baseOptions = () => ({
    nodeId: 'node-1',
    section: '1',
    active: false,
    editing: false,
    contentEnabled: true,
    pinned: false,
    style: undefined,
    sectionColor: null,
    metaAccentColor: null,
    displayPolicy: createDefaultCellDisplayPolicy(),
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
            contentEnabled: false,
        });

        expect(model.showInlineEditor).toBe(false);
        expect(model.showContent).toBe(false);
    });

    it('still hides content when inline editor owns the card', () => {
        const model = buildMandalaCardRenderModel({
            ...baseOptions(),
            active: true,
            editing: true,
            contentEnabled: true,
        });

        expect(model.showInlineEditor).toBe(true);
        expect(model.showContent).toBe(false);
    });
});
