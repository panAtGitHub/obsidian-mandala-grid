import { describe, expect, it } from 'vitest';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';

describe('shared/grid-style', () => {
    it('builds a shared detached card policy for immersive card mode', () => {
        expect(
            resolveCardGridStyle({
                whiteThemeMode: false,
            }),
        ).toMatchObject({
            compactMode: false,
            selectionStyle: 'node-active',
            cellDisplayPolicy: {
                sectionIndicatorVariant: 'section-capsule',
                preserveActiveBackground: false,
                contentLayout: 'fill',
                hoverBehavior: 'none',
                inactiveSurfaceMode: 'detached',
            },
        });
    });

    it('switches to white-theme card meta and preserved active backgrounds when needed', () => {
        expect(
            resolveCardGridStyle({
                whiteThemeMode: true,
            }),
        ).toMatchObject({
            selectionStyle: 'cell-outline',
            cellDisplayPolicy: {
                sectionIndicatorVariant: 'plain-with-pin',
                preserveActiveBackground: true,
                inactiveSurfaceMode: 'detached',
            },
        });
    });

    it('enables compact density without changing the shared detached card behavior', () => {
        expect(
            resolveCardGridStyle({
                whiteThemeMode: false,
                compactMode: true,
            }),
        ).toMatchObject({
            compactMode: true,
            selectionStyle: 'node-active',
            cellDisplayPolicy: {
                density: 'compact',
                scrollbarMode: 'interaction',
                hoverBehavior: 'none',
                inactiveSurfaceMode: 'detached',
            },
        });
    });

    it('keeps card-mode active highlighting aligned across scenes', () => {
        const threeByThree = resolveCardGridStyle({
            whiteThemeMode: false,
        });
        const nx9 = resolveCardGridStyle({
            whiteThemeMode: false,
        });

        expect(threeByThree.selectionStyle).toBe('node-active');
        expect(nx9.selectionStyle).toBe('node-active');
        expect(threeByThree.cellDisplayPolicy.preserveActiveBackground).toBe(
            false,
        );
        expect(nx9.cellDisplayPolicy.preserveActiveBackground).toBe(false);
        expect(threeByThree.cellDisplayPolicy.inactiveSurfaceMode).toBe(
            'detached',
        );
        expect(nx9.cellDisplayPolicy.inactiveSurfaceMode).toBe('detached');
        expect(threeByThree.cellDisplayPolicy.hoverBehavior).toBe('none');
        expect(nx9.cellDisplayPolicy.hoverBehavior).toBe('none');
    });

    it('reuses cached style objects for the same view combination', () => {
        const first = resolveCardGridStyle({
            whiteThemeMode: true,
            compactMode: true,
        });
        const second = resolveCardGridStyle({
            whiteThemeMode: true,
            compactMode: true,
        });

        expect(second).toBe(first);
    });
});
