import { describe, expect, it } from 'vitest';
import {
    resolveFileEditorPlacement,
    resolveNodeEditorCommitContent,
    resolveNodeEditorInitialPlacement,
} from 'src/mandala-interaction/helpers/resolve-node-editor-initial-placement';

describe('daily body drafts', () => {
    const frontmatter = [
        'mandala_day_plan:',
        '  enabled: true',
        '  year: 2026',
        '  slots: {"1": 阅读}',
        'mandala_cell_format:',
        '  enabled: true',
    ].join('\n');
    const open = (section: string, content: string, yaml: string) =>
        resolveFileEditorPlacement(
            { content, isDayPlanScene: false },
            yaml,
            section,
            () => 2,
        );

    it.each([
        ['paragraph', ''],
        ['unordered-list', '- '],
        ['ordered-list', '1. '],
    ])('opens and commits all three kinds of cell as %s', (body, marker) => {
        for (const [section, heading] of [
            ['1', '## 2026-01-01 周四'],
            ['1.1', '### 阅读'],
            ['1.8', ''],
        ]) {
            const draft = open(
                section,
                heading,
                frontmatter + '\n  dayPlanBody: ' + body,
            );
            const prefix = heading ? heading + '\n' : '';
            expect(draft.content).toBe(prefix + marker);
            expect(draft.cursor).toEqual({
                line: heading ? 1 : 0,
                ch: marker.length,
            });
            const commit = (currentContent: string) =>
                resolveNodeEditorCommitContent({
                    currentContent,
                    originalContent: heading,
                    preparedContent: draft.content,
                    generatedCellFormat: draft.generatedCellFormat,
                });
            expect(commit(draft.content)).toBe(heading);
            expect(commit(draft.content + '\n')).toBe(heading);
            expect(commit(draft.content + '读书')).toBe(
                prefix + marker + '读书',
            );
            expect(commit(prefix + '手写段落')).toBe(prefix + '手写段落');
        }
    });

    it('preserves the exact heading and trailing whitespace on a no-op edit', () => {
        const content = '\r\n  ### 阅读  \r\n\r\n';
        const draft = open('1.1', content, frontmatter);
        expect(draft.content).toBe('\r\n  ### 阅读  \r\n- \r\n');
        expect(
            resolveNodeEditorCommitContent({
                originalContent: content,
                currentContent: draft.content.replace(/\r/g, ''),
                preparedContent: draft.content,
                generatedCellFormat: draft.generatedCellFormat,
            }),
        ).toBe(content);
    });

    it.each([
        ['1', '## 2026-01-02'],
        ['1.1', '### 旧模板'],
        ['1.8', '### 自定义'],
        ['1.1', '### 阅读\n- [ ] 一章'],
        ['1.8', '- '],
        ['366', ''],
        ['1.9', ''],
        ['1.2.1', ''],
    ])(
        'leaves existing or unrecognised content alone (%s %s)',
        (section, content) => {
            expect(open(section, content, frontmatter).content).toBe(content);
        },
    );

    it('does not seed a paused or malformed day plan or an invalid format', () => {
        for (const yaml of [
            frontmatter.replace('true', 'false'),
            frontmatter.replace('2026', 'broken'),
            frontmatter + '\n  dayPlanBody: invalid',
        ]) {
            expect(open('1.8', '', yaml).content).toBe('');
        }
    });
});

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
