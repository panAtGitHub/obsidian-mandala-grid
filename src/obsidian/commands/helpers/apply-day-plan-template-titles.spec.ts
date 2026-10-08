import { describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import { applyDayPlanTemplateTitles } from './apply-day-plan-template-titles';

const fixture = () => {
    let markdown = `---
mandala: true
mandala_day_plan:
  enabled: true
  year: 2026
  slots:
    "1": New title
---
<!--section: 1-->
## 2026-01-01 四
<!--section: 1.1-->
### Old title
Past body
<!--section: 2-->
## 2026-01-02 五
<!--section: 2.1-->
### Other old title
Current body
<!--section: 3-->
## 2026-01-03 六
`;
    const file = new TFile();
    const setViewData = vi.fn();
    const view = {
        file,
        setViewData,
        ensureFullHydrated: vi.fn(),
        documentStore: {
            getValue: () => ({ sections: { id_section: { active: '2.1' } } }),
        },
        viewStore: { getValue: () => ({ document: { activeNode: 'active' } }) },
        plugin: {
            app: {
                vault: {
                    process: vi.fn(
                        async (
                            _file: TFile,
                            update: (raw: string) => string,
                        ) => {
                            markdown = update(markdown);
                            return markdown;
                        },
                    ),
                },
            },
        },
    } as unknown as MandalaView;
    return { view, setViewData, markdown: () => markdown };
};

describe('explicit daily template title application', () => {
    it('applies only to the current date and preserves historical titles and body', async () => {
        const f = fixture();
        await applyDayPlanTemplateTitles(f.view, 'current');
        expect(f.markdown()).toContain('### Old title\nPast body');
        expect(f.markdown()).toContain('### New title\nCurrent body');
        expect(f.markdown()).not.toContain('<!--section: 3.1-->');
        expect(f.setViewData).toHaveBeenCalledWith(f.markdown());
    });

    it('synchronizes existing dates without adding missing slots or losing body', async () => {
        const f = fixture();
        await applyDayPlanTemplateTitles(f.view, 'existing');
        expect(f.markdown()).toContain('### New title\nPast body');
        expect(f.markdown()).toContain('### New title\nCurrent body');
        expect(f.markdown()).not.toContain('<!--section: 3.1-->');
        expect(f.markdown()).not.toContain('<!--section: 1.2-->');
    });
});
