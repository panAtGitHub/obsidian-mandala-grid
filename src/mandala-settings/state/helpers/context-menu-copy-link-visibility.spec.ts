import { describe, expect, it } from 'vitest';
import { normalizeContextMenuCopyLinkVisibility } from 'src/mandala-settings/state/helpers/context-menu-copy-link-visibility';

describe('normalizeContextMenuCopyLinkVisibility', () => {
    it('defaults all variants to true when value is missing', () => {
        expect(normalizeContextMenuCopyLinkVisibility(undefined)).toEqual({
            'block-plain': true,
            'block-embed': true,
            'heading-plain': true,
            'heading-embed': true,
            'heading-embed-dollar': true,
        });
    });

    it('keeps provided values and falls back for missing keys', () => {
        expect(
            normalizeContextMenuCopyLinkVisibility({
                'block-plain': false,
                'heading-embed': false,
                'heading-embed-dollar': false,
            }),
        ).toEqual({
            'block-plain': false,
            'block-embed': true,
            'heading-plain': true,
            'heading-embed': false,
            'heading-embed-dollar': false,
        });
    });
});
