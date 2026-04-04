import { describe, expect, it } from 'vitest';
import { applyDayPlanSlotTitles } from 'src/obsidian/commands/helpers/apply-day-plan-slot-titles';

describe('applyDayPlanSlotTitles', () => {
    it('seeds slot headings for the first core and the target day core', () => {
        const body = [
            '<!--section: 1-->',
            '## 2027-01-01 周五',
            '<!--section: 2-->',
            '## 2027-01-02 周六',
            '',
        ].join('\n');

        const next = applyDayPlanSlotTitles(
            body,
            ['1', '2'],
            [
                '接收太阳的能量，开心一天',
                '09-12',
                '12-14',
                '14-16',
                '16-18',
                '18-19',
                '19-21',
                '睡觉准备',
            ],
        );

        expect(next).toContain(
            '<!--section: 1.1-->\n### 接收太阳的能量，开心一天',
        );
        expect(next).toContain('<!--section: 1.8-->\n### 睡觉准备');
        expect(next).toContain(
            '<!--section: 2.1-->\n### 接收太阳的能量，开心一天',
        );
        expect(next).toContain('<!--section: 2.8-->\n### 睡觉准备');
    });
});
