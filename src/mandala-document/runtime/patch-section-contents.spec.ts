import { describe, expect, it } from 'vitest';
import { patchSectionContents } from 'src/mandala-document/runtime/patch-section-contents';

describe('patchSectionContents', () => {
    const original =
        '---\nkey: keep\n---\n<!--section: 1-->\none\n<!--section: 2-->\ntwo';

    it('preserves unrelated changes from another view', () => {
        const latest = original.replace('one', 'changed elsewhere');
        expect(
            patchSectionContents(latest, [
                { sectionId: '2', before: 'two', after: 'edited' },
            ]),
        ).toBe(latest.replace('two', 'edited'));
    });

    it('rejects conflicting and missing sections', () => {
        expect(() =>
            patchSectionContents(original, [
                { sectionId: '1', before: 'old', after: 'new' },
            ]),
        ).toThrow();
        expect(() =>
            patchSectionContents(original, [
                { sectionId: '3', before: '', after: 'new' },
            ]),
        ).toThrow();
    });

    it('rejects an entire batch when one section conflicts', () => {
        expect(() =>
            patchSectionContents(original, [
                { sectionId: '1', before: 'one', after: 'new one' },
                { sectionId: '2', before: 'old two', after: 'new two' },
            ]),
        ).toThrow();
        expect(original).toContain('one');
        expect(original).toContain('two');
    });

    it('allows an already-applied update and preserves its bytes', () => {
        expect(
            patchSectionContents(original, [
                { sectionId: '1', before: 'old', after: 'one' },
            ]),
        ).toBe(original);
    });

    it('does not overwrite an external change when there is no local change', () => {
        const latest = original.replace('one', 'external');
        expect(
            patchSectionContents(latest, [
                { sectionId: '1', before: 'one', after: 'one' },
            ]),
        ).toBe(latest);
    });

    it('preserves CRLF and other sections when clearing content', () => {
        const source = '<!--section: 1-->\r\none\r\n<!--section: 2-->\r\ntwo';
        expect(
            patchSectionContents(source, [
                { sectionId: '1', before: 'one', after: '' },
            ]),
        ).toBe('<!--section: 1-->\r\n<!--section: 2-->\r\ntwo');
    });

    it('rejects duplicate markers and edits that introduce markers', () => {
        expect(() =>
            patchSectionContents('<!--section: 1-->x\n<!--section: 1-->y', [
                { sectionId: '1', before: 'x', after: 'z' },
            ]),
        ).toThrow();
        expect(() =>
            patchSectionContents('<!--section: 1-->x', [
                { sectionId: '1', before: 'x', after: 'x\n<!--section: 2-->y' },
            ]),
        ).toThrow();
    });
});
