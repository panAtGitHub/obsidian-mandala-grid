import { describe, expect, it } from 'vitest';
import { createMandalaMarkdownTemplate } from 'src/lib/mandala/create-mandala-markdown-template';

describe('createMandalaMarkdownTemplate', () => {
    it('creates a root mandala section with 8 direct slots', () => {
        expect(createMandalaMarkdownTemplate()).toBe(
            [
                '---',
                'mandala: true',
                '---',
                '<!--section: 1-->',
                '<!--section: 1.1-->',
                '<!--section: 1.2-->',
                '<!--section: 1.3-->',
                '<!--section: 1.4-->',
                '<!--section: 1.5-->',
                '<!--section: 1.6-->',
                '<!--section: 1.7-->',
                '<!--section: 1.8-->',
            ].join('\n'),
        );
    });
});
