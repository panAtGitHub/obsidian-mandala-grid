import { describe, expect, it } from 'vitest';
import { normalizeMandalaCellFormatContent } from 'src/mandala-display/logic/normalize-mandala-cell-format';

const rule = (
    heading: 1 | 2 | 3 | 4 | 5 | 6 | 'none',
    body: 'paragraph' | 'unordered-list' | 'ordered-list',
) => ({ heading, body });

describe('normalizeMandalaCellFormatContent', () => {
    it('changes heading depth and normalizes list markers', () => {
        const result = normalizeMandalaCellFormatContent(
            '## 计划\n- 第一项\n- 第二项',
            rule(4, 'ordered-list'),
        );

        expect(result).toEqual({
            changed: true,
            skipped: false,
            content: '#### 计划\n1. 第一项\n1. 第二项',
        });
    });

    it('moves a heading into the body when headings are disabled', () => {
        const result = normalizeMandalaCellFormatContent(
            '### 计划\n正文',
            rule('none', 'paragraph'),
        );

        expect(result.skipped).toBe(false);
        expect(result.content).toBe('计划\n\n正文');
    });

    it('skips nested or multi-line blocks', () => {
        const result = normalizeMandalaCellFormatContent(
            '## 计划\n- 父项\n  - 子项',
            rule(2, 'ordered-list'),
        );

        expect(result.skipped).toBe(true);
        expect(result.content).toContain('父项');
    });

    it('is idempotent for normalized content', () => {
        const result = normalizeMandalaCellFormatContent(
            '#### 计划\n1. 第一项\n1. 第二项',
            rule(4, 'ordered-list'),
        );

        expect(result).toEqual({
            changed: false,
            skipped: false,
            content: '#### 计划\n1. 第一项\n1. 第二项',
        });
    });

    it('preserves an already matching list marker', () => {
        const result = normalizeMandalaCellFormatContent(
            '## 计划\n* 第一项\n* 第二项',
            rule(2, 'unordered-list'),
        );

        expect(result).toEqual({
            changed: false,
            skipped: false,
            content: '## 计划\n* 第一项\n* 第二项',
        });
    });

    it('skips a list-to-paragraph conversion that would create a heading', () => {
        const result = normalizeMandalaCellFormatContent(
            '- # 不是标题',
            rule('none', 'paragraph'),
        );

        expect(result.skipped).toBe(true);
    });

    it('renumbers ordered items when a heading becomes the first item', () => {
        const result = normalizeMandalaCellFormatContent(
            '## 计划\n2) 第二项',
            rule('none', 'ordered-list'),
        );

        expect(result.skipped).toBe(false);
        expect(result.content).toBe('1. 计划\n1. 第二项');
    });

    it('skips a heading-to-paragraph conversion that would create a block', () => {
        const result = normalizeMandalaCellFormatContent(
            '## > 引用',
            rule('none', 'paragraph'),
        );

        expect(result.skipped).toBe(true);
    });
});
