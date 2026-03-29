import { describe, expect, it } from 'vitest';
import {
    decorateSimpleSummaryCellSurface,
    resolveCellSurfaceStyle,
} from 'src/mandala-cell/visual/cell-surface-visual';

describe('cell-surface-visual', () => {
    it('builds empty cell surface styles through the cell visual layer', () => {
        const style = resolveCellSurfaceStyle({
            section: '1.2',
            colorContext: {
                backgroundMode: 'custom',
                sectionColorsBySection: {
                    '1.2': '#677FEF',
                },
                sectionColorOpacity: 65,
            },
        });

        expect(style).toContain('background-color: rgba(103, 127, 239, 0.65);');
    });

    it('decorates summary cells through the same cell visual layer', () => {
        const cell = decorateSimpleSummaryCellSurface({
            cell: {
                row: 0,
                col: 0,
                section: '1.2',
                titleMarkdown: '',
                bodyMarkdown: '',
                nodeId: 'node-1',
                isCenter: false,
                isThemeCenter: false,
                isGrayBlock: false,
                background: null,
                textTone: null,
                style: null,
            },
            backgroundMode: 'custom',
            sectionColors: {
                '1.2': '#677FEF',
            },
            sectionColorOpacity: 65,
            themeTone: 'light',
            themeUnderlayColor: '#ffffff',
        });

        expect(cell.background).toBe('rgba(103, 127, 239, 0.65)');
        expect(cell.style).toContain(
            'background-color: rgba(103, 127, 239, 0.65);',
        );
    });
});
