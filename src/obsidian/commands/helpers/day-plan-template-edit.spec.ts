import { describe, expect, it } from 'vitest';
import { updateDayPlanTemplateMarkdown } from './day-plan-template-edit';

const markdown = `---
mandala: true
id: user-id
mandala_day_plan:
  enabled: true
  year: 2026
  slots:
    "1": Old
---
<!--section: 1-->
## 2026-01-01 四
<!--section: 1.1-->
### Old
Past body
<!--section: 2-->
## 2026-01-02 五
<!--section: 2.1-->
### Old
Today body
<!--section: 3-->
## 2026-01-03 六
<!--section: 3.1-->
### Old
Future body
<!--section: 4-->
## 2026-01-04 日
`;
const slots = ['New', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

describe('daily template edit scope', () => {
    it('saves the template and updates today and later dates while preserving history and body', () => {
        const next = updateDayPlanTemplateMarkdown(markdown, {
            slots,
            start: '2026-01-02',
            end: '2026-12-31',
        });
        expect(next).toContain('### Old\nPast body');
        expect(next).toContain('### New\nToday body');
        expect(next).toContain('### New\nFuture body');
        expect(next).toContain('id: user-id');
        expect(next).not.toContain('<!--section: 4.1-->');
    });
    it('applies the saved template only to the selected historical range', () => {
        const saved = updateDayPlanTemplateMarkdown(markdown, {
            slots,
            start: '2026-01-02',
            end: '2026-12-31',
        });
        const next = updateDayPlanTemplateMarkdown(saved, {
            start: '2026-01-01',
            end: '2026-01-01',
        });
        expect(next).toContain('### New\nPast body');
        expect(next).toContain('### New\nToday body');
        expect(next).not.toContain('<!--section: 1.2-->');
    });
    it('rejects reversed ranges and dates outside the file year', () => {
        expect(() =>
            updateDayPlanTemplateMarkdown(markdown, {
                start: '2026-02-01',
                end: '2026-01-01',
            }),
        ).toThrow();
        expect(() =>
            updateDayPlanTemplateMarkdown(markdown, {
                start: '2025-12-31',
                end: '2026-01-01',
            }),
        ).toThrow();
    });
    it('rejects incomplete titles before updating any content', () => {
        expect(() =>
            updateDayPlanTemplateMarkdown(markdown, {
                slots: [''],
                start: '2026-01-01',
                end: '2026-12-31',
            }),
        ).toThrow('八个标题');
    });
});
