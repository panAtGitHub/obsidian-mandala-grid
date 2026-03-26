import { describe, expect, it } from 'vitest';
import {
    buildNx9SceneProjection,
    buildNx9SceneProjectionProps,
} from 'src/mandala-scenes/view-nx9/build-scene-projection';

describe('build-nx9-scene-projection', () => {
    it('builds nx9 scene projection props from a theme snapshot', () => {
        expect(
            buildNx9SceneProjectionProps({
                themeSnapshot: {
                    themeTone: 'light',
                    themeUnderlayColor: '#fff',
                    activeThemeUnderlayColor: '#eee',
                },
                rowsPerPage: 5,
                sectionColors: { '1': '#111' },
                sectionColorOpacity: 60,
                backgroundMode: 'custom',
                showDetailSidebar: true,
                whiteThemeMode: false,
            }),
        ).toEqual({
            themeSnapshot: {
                themeTone: 'light',
                themeUnderlayColor: '#fff',
                activeThemeUnderlayColor: '#eee',
            },
            rowsPerPage: 5,
            sectionColors: { '1': '#111' },
            sectionColorOpacity: 60,
            backgroundMode: 'custom',
            showDetailSidebar: true,
            whiteThemeMode: false,
        });
    });

    it('wraps nx9 default scenes as a dedicated projection', () => {
        expect(
            buildNx9SceneProjection({
                viewKind: 'nx9',
                variant: 'default',
            }, {
                themeSnapshot: {
                    themeTone: 'light',
                    themeUnderlayColor: '#fff',
                    activeThemeUnderlayColor: '#eee',
                },
                rowsPerPage: 5,
                sectionColors: { '1': '#111' },
                sectionColorOpacity: 60,
                backgroundMode: 'custom',
                showDetailSidebar: true,
                whiteThemeMode: false,
            }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
            rendererKind: 'nx9-layout',
            props: {
                themeSnapshot: {
                    themeTone: 'light',
                    themeUnderlayColor: '#fff',
                    activeThemeUnderlayColor: '#eee',
                },
                rowsPerPage: 5,
                sectionColors: { '1': '#111' },
                sectionColorOpacity: 60,
                backgroundMode: 'custom',
                showDetailSidebar: true,
                whiteThemeMode: false,
            },
        });
    });
});
