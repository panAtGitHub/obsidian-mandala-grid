import { describe, expect, it } from 'vitest';
import { resolveNodeEditorInitialPlacement } from 'src/mandala-interaction/helpers/resolve-node-editor-initial-placement';

describe('resolveNodeEditorInitialPlacement', () => {
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

    it('keeps a valid historical cursor for day-plan content', () => {
        expect(
            resolveNodeEditorInitialPlacement({
                content: '## 9-12 深度工作\n正文',
                isDayPlanScene: true,
                historyCursor: { line: 1, ch: 1 },
            }),
        ).toEqual({
            content: '## 9-12 深度工作\n正文',
            cursor: { line: 1, ch: 1 },
        });
    });
});
