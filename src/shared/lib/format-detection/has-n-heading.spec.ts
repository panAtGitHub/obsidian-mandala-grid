import { describe, expect, it } from 'vitest';
import { hasNHeadings } from 'src/shared/lib/format-detection/has-n-headings';

describe('hasHeading', () => {
    it('should return false for an empty string', () => {
        expect(hasNHeadings('')).toBe(false);
    });

    it('should return false if there are no headings', () => {
        const input = `This is a test
with multiple lines
but no headings.`;
        expect(hasNHeadings(input)).toBe(false);
    });

    it('should return false if there is only one heading', () => {
        const input = `# Heading 1
This is some text.`;
        expect(hasNHeadings(input)).toBe(false);
    });

    it('should return true if there are two headings', () => {
        const input = `# Heading 1
This is some text.
## Heading 2`;
        expect(hasNHeadings(input)).toBe(true);
    });

    it('should return true if there are more than two headings', () => {
        const input = `# Heading 1
This is some text.
## Heading 2
More text.
### Heading 3`;
        expect(hasNHeadings(input)).toBe(true);
    });

    it('should ignore lines without a proper heading format', () => {
        const input = `###Heading without space
# Proper Heading
Some text.`;
        expect(hasNHeadings(input)).toBe(false);
    });

    it('should handle a single line with multiple headings', () => {
        const input = `# Heading 1 ## Heading 2`;
        expect(hasNHeadings(input)).toBe(false);
    });

    it('should return true if the heading is in an outline', () => {
        const input = `- # Heading 1
  This is some text.
\t- ## Heading 2`;
        expect(hasNHeadings(input)).toBe(true);
    });
});
