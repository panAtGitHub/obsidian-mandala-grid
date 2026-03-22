import { describe, expect, it } from 'vitest';
import { convertToMandalaMarkdown } from 'src/mandala-display/logic/mandala-conversion';

describe('convertToMandalaMarkdown', () => {
    it('creates only section 1 and its direct slots for plain markdown', () => {
        const markdown = 'alpha\nbeta\n';

        const result = convertToMandalaMarkdown(
            markdown,
            'template-with-content',
        );

        expect(result).toContain('<!--section: 1-->\nalpha\nbeta');
        expect(result).toContain('<!--section: 1.1-->');
        expect(result).toContain('<!--section: 1.8-->');
        expect(result).not.toContain('<!--section: 2-->');
        expect(result).not.toContain('<!--section: 9-->');
    });

    it('normalizes legacy section 1 files by adding only section 1 children', () => {
        const markdown = [
            '---',
            'mandala: true',
            '---',
            '<!--section: 1-->',
            'center',
        ].join('\n');

        const result = convertToMandalaMarkdown(markdown, 'normalize-core');

        expect(result).toContain('<!--section: 1-->\ncenter');
        expect(result).toContain('<!--section: 1.1-->');
        expect(result).toContain('<!--section: 1.8-->');
        expect(result).not.toContain('<!--section: 2-->');
        expect(result).not.toContain('<!--section: 9-->');
    });
});
