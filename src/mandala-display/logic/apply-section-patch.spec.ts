import { expect, it } from 'vitest';
import {
    applySectionPatch,
    getSectionContentBySection,
} from './apply-section-patch';

it.each(['', '\n'])(
    'edits the full daily title and body with separator %j',
    (separator) => {
        const before =
            '<!--section: 1.1-->' +
            separator +
            '### 阅读\n\n<!--section: 1.2-->别的记录';
        expect(getSectionContentBySection(before, '1.1')).toBe('### 阅读\n');
        expect(
            applySectionPatch(before, '1.1', '### 阅读\n1. 第一章')?.markdown,
        ).toBe(before.replace('### 阅读\n', '### 阅读\n1. 第一章'));
    },
);
