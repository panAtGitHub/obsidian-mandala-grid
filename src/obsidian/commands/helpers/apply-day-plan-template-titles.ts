import { Notice } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import {
    syncDayPlanTitlesInMarkdown,
    syncDayPlanTitlesBySections,
} from 'src/mandala-display/logic/sync-day-plan-titles';

export const applyDayPlanTemplateTitles = async (
    view: MandalaView,
    scope: 'current' | 'existing',
) => {
    const file = view.file;
    if (!file) return;
    view.ensureFullHydrated('day-plan-template');
    const state = view.documentStore.getValue();
    const activeId = view.viewStore.getValue().document.activeNode;
    const core = state.sections.id_section[activeId]?.split('.')[0];
    if (scope === 'current' && !core) {
        new Notice('未找到当前日期。');
        return;
    }
    let changed = false;
    const markdown = await view.plugin.app.vault.process(file, (raw) => {
        const result =
            scope === 'existing'
                ? syncDayPlanTitlesInMarkdown(raw)
                : syncDayPlanTitlesBySections(
                      raw,
                      Array.from(
                          { length: 8 },
                          (_, index) => `${core}.${index + 1}`,
                      ),
                  );
        changed = result.changed;
        return result.markdown;
    });
    if (view.file === file && changed) view.setViewData(markdown);
    new Notice(
        changed
            ? '已同步模板标题，保留原有正文；未补建其他日期的空格子。'
            : '已有标题无需更新。',
    );
};
