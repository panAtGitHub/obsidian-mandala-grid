import { describe, expect, it } from 'vitest';
import {
    buildNineByNineSectionIds,
    decorate9x9CellViewModels,
} from 'src/mandala-scenes/view-9x9/assemble-cell-view-model';

describe('buildNineByNineSectionIds', () => {
    it('returns only the sections addressable by the current 9x9 layout', () => {
        const sections = buildNineByNineSectionIds({
            selectedLayoutId: 'default',
            customLayouts: [],
            baseTheme: '5',
        });

        expect(sections).toContain('5');
        expect(sections).toContain('5.1');
        expect(
            sections.every(
                (section) => section === '5' || section.startsWith('5.'),
            ),
        ).toBe(true);
        expect(new Set(sections).size).toBe(sections.length);
    });
});

describe('decorate9x9CellViewModels', () => {
    it('uses the same custom section background input rule as standard cards', () => {
        const [cell] = decorate9x9CellViewModels({
            cells: [
                {
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
            ],
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
