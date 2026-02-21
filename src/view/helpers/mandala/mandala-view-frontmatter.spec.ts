import { describe, expect, it, vi } from 'vitest';
import { parseYaml } from 'obsidian';
import { parseMandalaViewFrontmatterState } from 'src/view/helpers/mandala/mandala-view-frontmatter';

vi.mock('obsidian', () => ({
    parseYaml: vi.fn(),
}));

describe('mandala-view-frontmatter', () => {
    it('parses empty frontmatter as null state', () => {
        expect(parseMandalaViewFrontmatterState('')).toEqual({
            gridOrientation: null,
            lastActiveSection: null,
        });
    });

    it('parses valid mandala_view state', () => {
        const frontmatter = `---
mandala: true
mandala_view:
  grid_orientation: south-start
  last_active_section: "2.3"
---
`;
        vi.mocked(parseYaml).mockReturnValue({
            mandala: true,
            mandala_view: {
                grid_orientation: 'south-start',
                last_active_section: '2.3',
            },
        });

        expect(parseMandalaViewFrontmatterState(frontmatter)).toEqual({
            gridOrientation: 'south-start',
            lastActiveSection: '2.3',
        });
    });

    it('ignores invalid values', () => {
        const frontmatter = `---
mandala_view:
  grid_orientation: diagonal
  last_active_section: abc
---
`;
        vi.mocked(parseYaml).mockReturnValue({
            mandala_view: {
                grid_orientation: 'diagonal',
                last_active_section: 'abc',
            },
        });

        expect(parseMandalaViewFrontmatterState(frontmatter)).toEqual({
            gridOrientation: null,
            lastActiveSection: null,
        });
    });
});
