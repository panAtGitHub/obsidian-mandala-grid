import { describe, expect, it } from 'vitest';
import { patchSectionContents } from 'src/mandala-document/runtime/patch-section-contents';
import { planMandalaCellFormatNormalization } from 'src/mandala-display/logic/plan-mandala-cell-format-normalization';
import { createDefaultMandalaCellFormat } from 'src/mandala-settings/state/frontmatter/mandala-cell-format';

describe('planMandalaCellFormatNormalization', () => {
    it('plans all sections while preserving section ids', () => {
        const config = createDefaultMandalaCellFormat('unlimited', true);
        config.levels['1'] = { heading: 2, body: 'paragraph' };
        const markdown = [
            '---',
            'mandala: true',
            '---',
            '<!--section: 1-->主题\n正文',
            '<!--section: 1.1-->周边\n- 内容',
        ].join('\n');

        const plan = planMandalaCellFormatNormalization(markdown, config);

        expect(plan.sectionIds).toEqual(['1', '1.1']);
        expect(plan.edits).toEqual([
            {
                sectionId: '1',
                before: '主题\n正文',
                after: '## 主题\n正文',
            },
            {
                sectionId: '1.1',
                before: '周边\n- 内容',
                after: '### 周边\n- 内容',
            },
        ]);
    });

    it('formats only simple daily bodies, preserving titles and skipping unsafe records', () => {
        const config = createDefaultMandalaCellFormat('unlimited', true);
        const markdown = [
            '---',
            'mandala: true',
            'mandala_day_plan:',
            '  enabled: true',
            '  year: 2026',
            '  slots: {"1": 阅读}',
            '---',
            '<!--section: 1-->## 2026-01-01\n记录',
            '<!--section: 1.1-->### 阅读\n1. 内容',
            '<!--section: 1.2-->没有标题的正文',
            '<!--section: 1.3-->- [ ] 任务',
            '<!--section: 1.4-->### 历史标题\n正文',
            '<!--section: 1.5-->列表\n  - 嵌套',
            '<!--section: 1.6-->---',
            '<!--section: 2-->## 2026-01-02',
        ].join('\n');

        const plan = planMandalaCellFormatNormalization(markdown, config);

        expect(
            plan.edits.map(({ sectionId, after }) => [sectionId, after]),
        ).toEqual([
            ['1', '## 2026-01-01\n- 记录'],
            ['1.1', '### 阅读\n- 内容'],
            ['1.2', '- 没有标题的正文'],
        ]);
        expect(plan.skippedCount).toBe(4);
        const updated = patchSectionContents(markdown, plan.edits);
        expect(
            planMandalaCellFormatNormalization(updated, config).edits,
        ).toEqual([]);
        expect(() =>
            patchSectionContents(
                markdown.replace('没有标题的正文', '其他窗格的修改'),
                plan.edits,
            ),
        ).toThrow();
    });

    it('uses the file max depth when resolving an omitted rule', () => {
        const config = createDefaultMandalaCellFormat('unlimited', true);
        config.deeper = { heading: 1, body: 'ordered-list' };
        const markdown = [
            '<!--section: 1-->',
            '<!--section: 1.1-->',
            '<!--section: 1.1.1-->',
            '<!--section: 1.1.1.1-->标题\n正文',
        ].join('\n');

        const finitePlan = planMandalaCellFormatNormalization(
            markdown,
            config,
            5,
        );
        const unlimitedPlan = planMandalaCellFormatNormalization(
            markdown,
            config,
            'unlimited',
        );

        expect(finitePlan.edits[0]?.after).toBe('##### 标题\n- 正文');
        expect(unlimitedPlan.edits[0]?.after).toBe('# 标题\n1. 正文');
    });
});
