/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import {
    applyMandalaEmbedResponsiveSizingSnapshot,
    MANDALA_EMBED_ROOT_DENSITY_COMPACT_CLASS,
    MANDALA_EMBED_ROOT_DENSITY_ULTRA_CLASS,
    resolveMandalaEmbedResponsiveSizing,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/apply-mandala-embed-responsive-sizing';

describe('applyMandalaEmbedResponsiveSizing', () => {
    it('resolves sizing metrics from container width', () => {
        const sizing = resolveMandalaEmbedResponsiveSizing(300);

        expect(sizing).not.toBeNull();
        expect(sizing?.cellSize).toBe(100);
        expect(sizing?.isCompactDensity).toBe(false);
        expect(sizing?.isUltraDensity).toBe(false);
        expect(sizing?.contentFontSize).toBe(13);
    });

    it('applies sizing snapshot before the grid is inserted', () => {
        const root = document.createElement('div');
        const grid = document.createElement('div');

        const applied = applyMandalaEmbedResponsiveSizingSnapshot({
            rootEl: root,
            gridEl: grid,
            width: 210,
        });

        expect(applied).toBe(true);
        expect(grid.style.getPropertyValue('--mandala-embed-cell-size')).toBe(
            '70px',
        );
        expect(grid.classList.contains('is-density-ultra')).toBe(true);
        expect(grid.classList.contains('is-density-compact')).toBe(true);
        expect(
            root.classList.contains(MANDALA_EMBED_ROOT_DENSITY_ULTRA_CLASS),
        ).toBe(true);
        expect(
            root.classList.contains(MANDALA_EMBED_ROOT_DENSITY_COMPACT_CLASS),
        ).toBe(true);
    });

    it('does not apply sizing when width is not positive', () => {
        const root = document.createElement('div');
        const grid = document.createElement('div');

        const applied = applyMandalaEmbedResponsiveSizingSnapshot({
            rootEl: root,
            gridEl: grid,
            width: 0,
        });

        expect(applied).toBe(false);
        expect(grid.style.getPropertyValue('--mandala-embed-cell-size')).toBe(
            '',
        );
        expect(
            root.classList.contains(MANDALA_EMBED_ROOT_DENSITY_COMPACT_CLASS),
        ).toBe(false);
    });
});
