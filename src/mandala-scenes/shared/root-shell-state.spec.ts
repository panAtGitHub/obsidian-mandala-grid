import { describe, expect, it } from 'vitest';
import {
    resolveDesktopSquareSize,
    resolveSceneThemeSnapshot,
} from 'src/mandala-scenes/shared/root-shell-state';

describe('root-shell-state', () => {
    it('reads the scene theme snapshot from body classes and css variables', () => {
        const snapshot = resolveSceneThemeSnapshot(
            {
                classList: {
                    contains: (className: string) => className === 'theme-dark',
                },
            } as HTMLElement,
            {
                getPropertyValue: (name: string) => {
                    if (name === '--background-active-parent') {
                        return ' #111 ';
                    }
                    if (name === '--background-active-node') {
                        return ' #222 ';
                    }
                    if (name === '--background-primary') {
                        return ' #333 ';
                    }
                    return '';
                },
            } as CSSStyleDeclaration,
        );

        expect(snapshot).toStrictEqual({
            themeTone: 'dark',
            themeUnderlayColor: '#111',
            activeThemeUnderlayColor: '#222',
        });
    });

    it('falls back to the primary background when the active parent color is unset', () => {
        const snapshot = resolveSceneThemeSnapshot(
            {
                classList: {
                    contains: () => false,
                },
            } as unknown as HTMLElement,
            {
                getPropertyValue: (name: string) => {
                    if (name === '--background-primary') {
                        return '#333';
                    }
                    return '';
                },
            } as CSSStyleDeclaration,
        );

        expect(snapshot).toStrictEqual({
            themeTone: 'light',
            themeUnderlayColor: '#333',
            activeThemeUnderlayColor: '#333',
        });
    });

    it('computes desktop square size from wrapper bounds and sidebar width', () => {
        expect(
            resolveDesktopSquareSize({
                isMobile: false,
                squareLayout: true,
                wrapperWidth: 900,
                wrapperHeight: 640,
                showDetailSidebar: true,
                detailSidebarWidth: 280,
            }),
        ).toBe(620);
    });

    it('returns zero when square sizing is disabled or mobile-only', () => {
        expect(
            resolveDesktopSquareSize({
                isMobile: true,
                squareLayout: true,
                wrapperWidth: 900,
                wrapperHeight: 640,
                showDetailSidebar: false,
                detailSidebarWidth: 0,
            }),
        ).toBe(0);
        expect(
            resolveDesktopSquareSize({
                isMobile: false,
                squareLayout: false,
                wrapperWidth: 900,
                wrapperHeight: 640,
                showDetailSidebar: false,
                detailSidebarWidth: 0,
            }),
        ).toBe(0);
    });
});
