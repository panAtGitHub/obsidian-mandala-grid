import { describe, expect, it } from 'vitest';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';

describe('shared/grid-style', () => {
    it('builds a shared detached card policy for node-active grids', () => {
        expect(
            resolveCardGridStyle({
                whiteThemeMode: false,
                selectionStyle: 'node-active',
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
                selectionStyle: 'cell-outline',
            }),
        ).toMatchObject({
            cellDisplayPolicy: {
                sectionIndicatorVariant: 'plain-with-pin',
                preserveActiveBackground: true,
                inactiveSurfaceMode: 'detached',
            },
        });
    });

    it('enables compact density without changing the shared detached surface behavior', () => {
        expect(
            resolveCardGridStyle({
                whiteThemeMode: false,
                compactMode: true,
                selectionStyle: 'cell-outline',
            }),
        ).toMatchObject({
            compactMode: true,
            cellDisplayPolicy: {
                density: 'compact',
                scrollbarMode: 'hidden',
                hoverBehavior: 'none',
                inactiveSurfaceMode: 'detached',
            },
        });
    });

    it('keeps the inactive surface strategy aligned between 3x3 and nx9-style grids', () => {
        const threeByThree = resolveCardGridStyle({
            whiteThemeMode: false,
            selectionStyle: 'node-active',
        });
        const nx9 = resolveCardGridStyle({
            whiteThemeMode: false,
            selectionStyle: 'cell-outline',
        });

        expect(threeByThree.cellDisplayPolicy.inactiveSurfaceMode).toBe(
            'detached',
        );
        expect(nx9.cellDisplayPolicy.inactiveSurfaceMode).toBe('detached');
        expect(threeByThree.cellDisplayPolicy.hoverBehavior).toBe('none');
        expect(nx9.cellDisplayPolicy.hoverBehavior).toBe('none');
    });
});
