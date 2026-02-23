import { describe, expect, it } from 'vitest';
import { createMandalaEmbedGridModel } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';

const buildMandalaMarkdown = () => `---
mandala: true
---
<!--section: 1-->
# Core
Core body line
<!--section: 1.1-->
## Theme A
- [ ] Task A
[[Target|Shown]]
<!--section: 1.2-->
Theme B text
<!--section: 1.3-->
Theme C text
<!--section: 1.4-->
Theme D text
<!--section: 1.5-->
Theme E text
<!--section: 1.6-->
Theme F text
<!--section: 1.7-->
Theme G text
<!--section: 1.8-->
Theme H text
<!--section: 1.1.1-->
Child A1
<!--section: 1.1.2-->
Child A2
<!--section: 1.1.3-->
Child A3
<!--section: 1.1.4-->
Child A4
<!--section: 1.1.5-->
Child A5
<!--section: 1.1.6-->
Child A6
<!--section: 1.1.7-->
Child A7
<!--section: 1.1.8-->
Child A8
`;

describe('createMandalaEmbedGridModel', () => {
    it('returns null for non-mandala markdown', () => {
        const model = createMandalaEmbedGridModel('# note', 'left-to-right');
        expect(model).toBeNull();
    });

    it('builds 3x3 rows with mandala slot sections', () => {
        const model = createMandalaEmbedGridModel(
            buildMandalaMarkdown(),
            'left-to-right',
        );
        expect(model).not.toBeNull();
        if (!model) return;

        expect(model.rows).toHaveLength(3);
        expect(model.rows[0]).toHaveLength(3);
        expect(model.rows[0][0].section).toBe('1.1');
        expect(model.rows[1][1].section).toBe('1');
    });

    it('normalizes heading/link markdown in cell preview', () => {
        const model = createMandalaEmbedGridModel(
            buildMandalaMarkdown(),
            'left-to-right',
        );
        expect(model).not.toBeNull();
        if (!model) return;

        expect(model.rows[0][0].title).toBe('Theme A');
        expect(model.rows[0][0].body).toContain('Task A');
        expect(model.rows[0][0].body).toContain('Shown');
    });

    it('maps positions based on orientation', () => {
        const model = createMandalaEmbedGridModel(
            buildMandalaMarkdown(),
            'south-start',
        );
        expect(model).not.toBeNull();
        if (!model) return;

        expect(model.rows[0][0].section).toBe('1.6');
    });

    it('supports marker-based mandala markdown without frontmatter', () => {
        const markdown = `
<!--section: 1-->
Core
<!--section: 1.1-->
A
<!--section: 1.2-->
B
<!--section: 1.3-->
C
<!--section: 1.4-->
D
<!--section: 1.5-->
E
<!--section: 1.6-->
F
<!--section: 1.7-->
G
<!--section: 1.8-->
H
`;
        const model = createMandalaEmbedGridModel(markdown, 'left-to-right');
        expect(model).not.toBeNull();
    });

    it('keeps rendering empty mandala templates', () => {
        const markdown = `---
mandala: true
---
<!--section: 1-->

<!--section: 1.1-->

<!--section: 1.2-->

<!--section: 1.3-->

<!--section: 1.4-->

<!--section: 1.5-->

<!--section: 1.6-->

<!--section: 1.7-->

<!--section: 1.8-->
`;
        const model = createMandalaEmbedGridModel(markdown, 'left-to-right');
        expect(model).not.toBeNull();
    });

    it('supports custom center section for subgrid embeds', () => {
        const model = createMandalaEmbedGridModel(
            buildMandalaMarkdown(),
            'left-to-right',
            '1.1',
        );
        expect(model).not.toBeNull();
        if (!model) return;

        expect(model.rows[1][1].section).toBe('1.1');
        expect(model.rows[0][0].section).toBe('1.1.1');
        expect(model.rows[0][0].title.startsWith('Child A')).toBe(true);
    });

    it('falls back to root center when custom center is missing', () => {
        const model = createMandalaEmbedGridModel(
            buildMandalaMarkdown(),
            'left-to-right',
            '3.1',
        );
        expect(model).not.toBeNull();
        if (!model) return;

        expect(model.rows[1][1].section).toBe('1');
    });
});
