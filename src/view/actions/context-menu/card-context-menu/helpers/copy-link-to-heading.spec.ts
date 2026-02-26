import { describe, expect, it } from 'vitest';
import { extractFirstHeadingFromMarkdown } from 'src/view/actions/context-menu/card-context-menu/helpers/copy-link-to-heading';

describe('extractFirstHeadingFromMarkdown', () => {
    it('extracts the first heading text', () => {
        const input = `
body
# 2026-02-26
more
`;
        expect(extractFirstHeadingFromMarkdown(input)).toBe('2026-02-26');
    });

    it('removes trailing closing hashes in heading', () => {
        const input = `
### title ###
body
`;
        expect(extractFirstHeadingFromMarkdown(input)).toBe('title');
    });

    it('skips empty heading and returns next valid heading', () => {
        const input = `
###    
## next heading
body
`;
        expect(extractFirstHeadingFromMarkdown(input)).toBe('next heading');
    });

    it('returns null when no heading exists', () => {
        const input = `
plain text
- list item
`;
        expect(extractFirstHeadingFromMarkdown(input)).toBeNull();
    });
});
