// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElementInDocument } from 'src/obsidian/helpers/create-element-in-document';

describe('createElementInDocument', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('uses the Obsidian helper and keeps new elements detached', () => {
        const factory = vi.fn((tag: string) => document.createElement(tag));
        vi.stubGlobal('createEl', factory);
        const element = createElementInDocument('button');

        expect(factory).toHaveBeenCalledWith('button');
        expect(element.ownerDocument).toBe(document);
        expect(element.parentNode).toBe(null);
        expect(element.tagName).toBe('BUTTON');
    });

    it('adopts elements into the active popout document', () => {
        const popoutDocument = document.implementation.createHTMLDocument();
        vi.stubGlobal('activeDocument', popoutDocument);

        const element = createElementInDocument('div');

        expect(element.ownerDocument).toBe(popoutDocument);
        expect(element.parentNode).toBe(null);
    });

    it('allows a caller to preserve an existing container document', () => {
        const containerDocument = document.implementation.createHTMLDocument();

        const element = createElementInDocument('span', containerDocument);

        expect(element.ownerDocument).toBe(containerDocument);
        expect(element.tagName).toBe('SPAN');
    });
});
