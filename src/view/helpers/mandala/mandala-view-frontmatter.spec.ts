import { describe, expect, it, vi } from 'vitest';
import { parseYaml } from 'obsidian';
import {
    parseMandalaViewFrontmatterState,
    upsertMandalaViewFrontmatterRecord,
} from 'src/view/helpers/mandala/mandala-view-frontmatter';

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

    it('upserts mandala_view record', () => {
        const frontmatterRecord: Record<string, unknown> = {
            mandala: true,
        };

        const changed = upsertMandalaViewFrontmatterRecord(frontmatterRecord, {
            gridOrientation: 'bottom-to-top',
            lastActiveSection: '3.1',
        });

        expect(changed).toBe(true);
        expect(frontmatterRecord).toEqual({
            mandala: true,
            mandala_view: {
                grid_orientation: 'bottom-to-top',
                last_active_section: '3.1',
            },
        });
    });

    it('returns false when upsert has no effective change', () => {
        const frontmatterRecord: Record<string, unknown> = {
            mandala_view: {
                grid_orientation: 'left-to-right',
                last_active_section: '1.2',
            },
        };

        const changed = upsertMandalaViewFrontmatterRecord(frontmatterRecord, {
            gridOrientation: 'left-to-right',
            lastActiveSection: '1.2',
        });

        expect(changed).toBe(false);
    });

    it('removes last_active_section when next state is null', () => {
        const frontmatterRecord: Record<string, unknown> = {
            mandala_view: {
                grid_orientation: 'left-to-right',
                last_active_section: '1.2',
                custom: true,
            },
        };

        const changed = upsertMandalaViewFrontmatterRecord(frontmatterRecord, {
            gridOrientation: 'south-start',
            lastActiveSection: null,
        });

        expect(changed).toBe(true);
        expect(frontmatterRecord).toEqual({
            mandala_view: {
                grid_orientation: 'south-start',
                custom: true,
            },
        });
    });
});
