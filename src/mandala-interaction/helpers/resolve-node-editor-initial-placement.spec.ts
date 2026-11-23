import { describe, expect, it } from 'vitest';
import {
    resolveNodeEditorCommitContent,
    resolveNodeEditorInitialPlacement,
} from 'src/mandala-interaction/helpers/resolve-node-editor-initial-placement';

describe('resolveNodeEditorInitialPlacement', () => {
    it('prepares a heading and unordered-list prefix for an empty cell', () => {
        const placement = resolveNodeEditorInitialPlacement({
            content: '',
            isDayPlanScene: false,
            cellFormat: { heading: 3, body: 'unordered-list' },
        });

        expect(placement.content).toBe('### \n- ');
        expect(placement.cursor).toEqual({ line: 0, ch: 4 });
    });

    it('starts an ordered list without a heading at the list prefix', () => {
        const placement = resolveNodeEditorInitialPlacement({
            content: '',
            isDayPlanScene: false,
            cellFormat: { heading: 'none', body: 'ordered-list' },
        });

        expect(placement.content).toBe('1. ');
        expect(placement.cursor).toEqual({ line: 0, ch: 3 });
    });

    it('leaves a paragraph body line after a generated heading', () => {
        const placement = resolveNodeEditorInitialPlacement({
            content: '',
            isDayPlanScene: false,
            cellFormat: { heading: 4, body: 'paragraph' },
        });

        expect(placement.content).toBe('#### \n');
        expect(placement.cursor).toEqual({ line: 0, ch: 5 });
    });

    it('removes generated placeholders when only the title is saved', () => {
        const placement = resolveNodeEditorInitialPlacement({
            content: '',
            isDayPlanScene: false,
            cellFormat: { heading: 2, body: 'ordered-list' },
        });

        expect(
            resolveNodeEditorCommitContent({
                currentContent: '## 计划\n1. ',
                originalContent: '',
                preparedContent: placement.content,
                generatedCellFormat: placement.generatedCellFormat,
            }),
        ).toBe('## 计划');
    });

    it('removes generated placeholders even with a trailing editor newline', () => {
        const placement = resolveNodeEditorInitialPlacement({
            content: '',
            isDayPlanScene: false,
            cellFormat: { heading: 2, body: 'unordered-list' },
        });

        expect(
            resolveNodeEditorCommitContent({
                currentContent: `${placement.content}\n`,
                originalContent: '',
                preparedContent: placement.content,
                generatedCellFormat: placement.generatedCellFormat,
            }),
        ).toBe('');
    });

    it('removes an empty heading when the paragraph body is filled', () => {
        const placement = resolveNodeEditorInitialPlacement({
            content: '',
            isDayPlanScene: false,
            cellFormat: { heading: 2, body: 'paragraph' },
        });

        expect(
            resolveNodeEditorCommitContent({
                currentContent: '## \n\n正文',
                originalContent: '',
                preparedContent: placement.content,
                generatedCellFormat: placement.generatedCellFormat,
            }),
        ).toBe('正文');
    });

    it('places non-day-plan content at the document end', () => {
        expect(
            resolveNodeEditorInitialPlacement({
                content: 'plain\ntext',
                isDayPlanScene: false,
            }),
        ).toEqual({
            content: 'plain\ntext',
            cursor: { line: 1, ch: 4 },
        });
    });

    it('adds a body line below a day-plan heading when only the heading exists', () => {
        expect(
            resolveNodeEditorInitialPlacement({
                content: '## 2026-05-28 周四',
                isDayPlanScene: true,
            }),
        ).toEqual({
            content: '## 2026-05-28 周四\n',
            cursor: { line: 1, ch: 0 },
        });
    });

    it('keeps the cursor on the first body line when only blank lines follow', () => {
        expect(
            resolveNodeEditorInitialPlacement({
                content: '## 2026-05-28 周四\n\n\n',
                isDayPlanScene: true,
            }),
        ).toEqual({
            content: '## 2026-05-28 周四\n\n\n',
            cursor: { line: 1, ch: 0 },
        });
    });

    it('places the first day-plan cursor at the last non-empty body line end', () => {
        expect(
            resolveNodeEditorInitialPlacement({
                content: '## 9-12 深度工作\n第一段\n\n最后一段\n',
                isDayPlanScene: true,
            }),
        ).toEqual({
            content: '## 9-12 深度工作\n第一段\n\n最后一段\n',
            cursor: { line: 3, ch: 4 },
        });
    });

    it('ignores a valid historical cursor for day-plan content', () => {
        expect(
            resolveNodeEditorInitialPlacement({
                content: '## 9-12 深度工作\n正文',
                isDayPlanScene: true,
                historyCursor: { line: 1, ch: 1 },
            }),
        ).toEqual({
            content: '## 9-12 深度工作\n正文',
            cursor: { line: 1, ch: 2 },
        });
    });

    it('ignores a day-plan historical cursor on the heading line', () => {
        expect(
            resolveNodeEditorInitialPlacement({
                content: '### 习惯打卡',
                isDayPlanScene: true,
                historyCursor: { line: 0, ch: 7 },
            }),
        ).toEqual({
            content: '### 习惯打卡\n',
            cursor: { line: 1, ch: 0 },
        });
    });

    it('keeps a valid historical cursor for non-day-plan content', () => {
        expect(
            resolveNodeEditorInitialPlacement({
                content: 'plain\ntext',
                isDayPlanScene: false,
                historyCursor: { line: 0, ch: 2 },
            }),
        ).toEqual({
            content: 'plain\ntext',
            cursor: { line: 0, ch: 2 },
        });
    });
});
