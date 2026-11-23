import { Setting } from 'obsidian';
import { tx } from 'src/lang/translate';
import { lang } from 'src/lang/lang';
import {
    createDefaultMandalaCellFormat,
    getMandalaCellFormatRule,
    type MandalaCellFormatBody,
    type MandalaCellFormatConfig,
    type MandalaCellFormatHeading,
} from 'src/mandala-settings/state/frontmatter/mandala-cell-format';
import type { SectionRangeLimit } from 'src/mandala-settings/state/settings-type';
import { applyCssProps } from 'src/shared/helpers/apply-css-props';

export type MandalaCellFormatSettingsState = {
    config: MandalaCellFormatConfig;
    maxDepth: SectionRangeLimit;
};

type RenderOptions = {
    parentEl: HTMLElement;
    state: MandalaCellFormatSettingsState;
    validationMessage?: string;
    createGroupContainer: (
        parentEl: HTMLElement,
        title: string,
        group: 'cell-format',
    ) => HTMLElement;
    onChanged: () => void;
    renderFooter?: (container: HTMLElement) => void;
};

const headingOptions: Record<string, string> = {
    none: tx('关闭标题'),
    '1': 'H1',
    '2': 'H2',
    '3': 'H3',
    '4': 'H4',
    '5': 'H5',
    '6': 'H6',
};

const bodyOptions: Record<string, string> = {
    paragraph: tx('普通段落'),
    'unordered-list': tx('无序列表'),
    'ordered-list': tx('有序列表'),
};

const cloneRule = (rule: ReturnType<typeof getMandalaCellFormatRule>) => ({
    ...rule,
});

const formatExample = (
    depth: number,
    heading: MandalaCellFormatHeading,
    body: MandalaCellFormatBody,
) => {
    const headingPrefix = heading === 'none' ? '' : `${'#'.repeat(heading)} `;
    const bodyPrefix =
        body === 'unordered-list' ? '- ' : body === 'ordered-list' ? '1. ' : '';
    const title = `${tx('示例标题')} ${depth}`;
    return bodyPrefix
        ? `${headingPrefix}${title}\n${bodyPrefix}${tx('示例内容')}`
        : `${headingPrefix}${title}\n${tx('示例内容')}`;
};

const visibleDepths = (state: MandalaCellFormatSettingsState) => {
    if (state.maxDepth !== 'unlimited') {
        return Array.from({ length: state.maxDepth }, (_, index) => index + 1);
    }
    const savedDepths = Object.keys(state.config.levels)
        .map(Number)
        .filter((depth) => Number.isInteger(depth) && depth > 0);
    const maxSavedDepth = Math.max(3, ...savedDepths);
    return Array.from({ length: maxSavedDepth }, (_, index) => index + 1);
};

export const renderMandalaCellFormatSettings = ({
    parentEl,
    state,
    validationMessage,
    createGroupContainer,
    onChanged,
    renderFooter,
}: RenderOptions) => {
    const container = createGroupContainer(
        parentEl,
        lang.settings_cell_format_section,
        'cell-format',
    );
    const description = container.createDiv({
        cls: 'mandala-cell-format-settings__description',
        text: lang.settings_cell_format_description,
    });
    applyCssProps(description, {
        color: 'var(--text-muted)',
        'font-size': 'var(--font-ui-smaller)',
        'line-height': '1.45',
        'margin-bottom': '8px',
    });
    if (validationMessage) {
        const warning = container.createDiv({
            cls: 'mandala-cell-format-settings__warning',
            text: validationMessage,
        });
        applyCssProps(warning, {
            color: 'var(--text-error)',
            'font-size': 'var(--font-ui-smaller)',
            'margin-bottom': '8px',
        });
    }

    const controls: Array<{ setDisabled: (disabled: boolean) => unknown }> = [];
    new Setting(container)
        .setName(lang.settings_cell_format_enabled)
        .setDesc(lang.settings_cell_format_enabled_desc)
        .addToggle((toggle) => {
            toggle.setValue(state.config.enabled).onChange((enabled) => {
                state.config.enabled = enabled;
                onChanged();
            });
        });

    const ensureRule = (depth: number) => {
        const key = String(depth);
        const existing = state.config.levels[key];
        if (existing) return existing;
        return cloneRule(
            getMandalaCellFormatRule(state.config, depth, state.maxDepth),
        );
    };

    const renderRule = (depth: number, rule: ReturnType<typeof ensureRule>) => {
        const setting = new Setting(container).setName(
            tx('第 {0} 层（例如 {1}）', depth, '1'.padEnd(depth * 2 - 1, '.1')),
        );
        setting.addDropdown((dropdown) =>
            dropdown
                .addOptions(headingOptions)
                .setValue(String(rule.heading))
                .onChange((value) => {
                    rule.heading =
                        value === 'none'
                            ? 'none'
                            : (Number(value) as MandalaCellFormatHeading);
                    state.config.levels[String(depth)] = rule;
                    onChanged();
                }),
        );
        setting.addDropdown((dropdown) =>
            dropdown
                .addOptions(bodyOptions)
                .setValue(rule.body)
                .onChange((value) => {
                    rule.body = value as MandalaCellFormatBody;
                    state.config.levels[String(depth)] = rule;
                    onChanged();
                }),
        );
        setting.setDesc(formatExample(depth, rule.heading, rule.body));
        controls.push(setting);
    };

    visibleDepths(state).forEach((depth) =>
        renderRule(depth, ensureRule(depth)),
    );

    if (state.maxDepth === 'unlimited') {
        const nextDepth = visibleDepths(state).length + 1;
        const addSetting = new Setting(container).setName(
            tx('第 {0} 层及之后', nextDepth),
        );
        addSetting.setDesc(lang.settings_cell_format_deeper_desc);
        addSetting.addDropdown((dropdown) =>
            dropdown
                .addOptions(headingOptions)
                .setValue(String(state.config.deeper.heading))
                .onChange((value) => {
                    state.config.deeper.heading =
                        value === 'none'
                            ? 'none'
                            : (Number(value) as MandalaCellFormatHeading);
                    onChanged();
                }),
        );
        addSetting.addDropdown((dropdown) =>
            dropdown
                .addOptions(bodyOptions)
                .setValue(state.config.deeper.body)
                .onChange((value) => {
                    state.config.deeper.body = value as MandalaCellFormatBody;
                    onChanged();
                }),
        );
        addSetting.addButton((button) =>
            button
                .setButtonText(tx('＋ 设置第 {0} 层', nextDepth))
                .onClick(() => {
                    state.config.levels[String(nextDepth)] = cloneRule(
                        state.config.deeper,
                    );
                    onChanged();
                }),
        );
        controls.push(addSetting);
    }

    new Setting(container).addButton((button) =>
        button.setButtonText(lang.settings_cell_format_reset).onClick(() => {
            const defaults = createDefaultMandalaCellFormat(
                state.maxDepth,
                state.config.enabled,
            );
            state.config.levels = defaults.levels;
            state.config.deeper = defaults.deeper;
            onChanged();
        }),
    );

    controls.forEach((control) => control.setDisabled(!state.config.enabled));
    renderFooter?.(container);
};
