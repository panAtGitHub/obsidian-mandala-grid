import {
    ensureSectionChildren,
    getSectionContent,
    replaceSectionContent,
} from 'src/mandala-display/logic/day-plan-sections';
import { describe, expect, it } from 'vitest';

const base = `<!--section: 1-->\nold-center\n<!--section: 2-->\nother`;

describe('day-plan sections helpers', () => {
    it('reads section content', () => {
        expect(getSectionContent(base, '1')).toBe('old-center');
        expect(getSectionContent(base, '9')).toBeNull();
    });

    it('replaces section content', () => {
        const next = replaceSectionContent(base, '1', '## 2026-02-10');
        expect(next).toContain('<!--section: 1-->\n## 2026-02-10\n<!--section: 2-->');
    });

    it('ensures 8 children under section 1', () => {
        const withChildren = ensureSectionChildren(base, '1', 8);
        expect(withChildren).toContain('<!--section: 1.1-->');
        expect(withChildren).toContain('<!--section: 1.8-->');
    });
});
