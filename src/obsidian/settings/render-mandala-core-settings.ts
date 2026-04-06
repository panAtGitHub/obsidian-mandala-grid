import { Setting } from 'obsidian';
import { lang } from 'src/lang/lang';
import {
    parsePositiveIntegerInput,
    resolveMaxSectionExample,
} from 'src/mandala-settings/state/helpers/section-range';
import type {
    DayPlanDateHeadingFormat,
    SectionRangeLimit,
    WeekStart,
} from 'src/mandala-settings/state/settings-type';
import type { EffectiveMandalaSettings } from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';

export type MandalaCoreSettingsState = EffectiveMandalaSettings;

export type MandalaCoreSettingsHandlers = {
    setEnable9x9View: (enabled: boolean) => void;
    setEnableNx9View: (enabled: boolean) => void;
    setCoreSectionMax: (max: SectionRangeLimit) => void;
    setSubgridMaxDepth: (depth: SectionRangeLimit) => void;
    setTimePlanEnabled?: (enabled: boolean) => void;
    setWeekStart: (weekStart: WeekStart) => void;
    setDayPlanDateHeadingFormat: (format: DayPlanDateHeadingFormat) => void;
    setDayPlanDateHeadingCustomTemplate: (template: string) => void;
};

type RenderMandalaCoreSettingsOptions = {
    parentEl: HTMLElement;
    state: MandalaCoreSettingsState;
    handlers: MandalaCoreSettingsHandlers;
    createGroupContainer: (
        parentEl: HTMLElement,
        title: string,
        group: 'global-view' | 'time-plan',
    ) => HTMLElement;
    showDescriptions: boolean;
    showTimePlanEnabledToggle?: boolean;
    showTimePlanSection?: boolean;
    showTimePlanDefaults?: boolean;
    texts?: Partial<{
        sectionGlobalView: string;
        sectionTimePlan: string;
        enable9x9View: string;
        enableNx9View: string;
        coreSectionMax: string;
        subgridMaxDepth: string;
        rangePreviewTitle: string;
        timePlanEnabled: string;
        weekStart: string;
        dayPlanDateHeadingFormat: string;
        dayPlanDateHeadingCustomTemplate: string;
    }>;
};

const createMaybeDescriptionSetting = (
    setting: Setting,
    description: string | null,
    showDescriptions: boolean,
) => {
    if (showDescriptions && description) {
        setting.setDesc(description);
    }
    return setting;
};

export const renderMandalaCoreSettings = ({
    parentEl,
    state,
    handlers,
    createGroupContainer,
    showDescriptions,
    showTimePlanEnabledToggle = true,
    showTimePlanSection = true,
    showTimePlanDefaults = true,
    texts,
}: RenderMandalaCoreSettingsOptions) => {
    const globalViewContainer = createGroupContainer(
        parentEl,
        texts?.sectionGlobalView ?? lang.settings_section_global_view,
        'global-view',
    );
    const timePlanContainer = showTimePlanSection
        ? createGroupContainer(
              parentEl,
              texts?.sectionTimePlan ?? lang.settings_section_time_plan,
              'time-plan',
          )
        : null;

    new Setting(globalViewContainer)
        .setName(texts?.enable9x9View ?? lang.settings_global_enable_9x9_view)
        .addToggle((toggle) =>
            toggle
                .setValue(state.view.enable9x9View)
                .onChange((enabled) => handlers.setEnable9x9View(enabled)),
        );

    new Setting(globalViewContainer)
        .setName(texts?.enableNx9View ?? lang.settings_global_enable_nx9_view)
        .addToggle((toggle) =>
            toggle
                .setValue(state.view.enableNx9View)
                .onChange((enabled) => handlers.setEnableNx9View(enabled)),
        );

    let currentCoreSectionMax = state.view.coreSectionMax;
    let currentSubgridMaxDepth = state.view.subgridMaxDepth;
    let coreSectionError: string | null = null;
    let subgridDepthError: string | null = null;

    const coreSectionSetting = new Setting(globalViewContainer).setName(
        texts?.coreSectionMax ?? lang.settings_global_core_section_max,
    );
    const subgridDepthSetting = new Setting(globalViewContainer).setName(
        texts?.subgridMaxDepth ?? lang.settings_global_subgrid_max_depth,
    );
    const previewContainer = showDescriptions
        ? globalViewContainer.createDiv({
              cls: 'mandala-settings-range-preview',
          })
        : null;
    const previewTitleEl = previewContainer?.createDiv({
        cls: 'mandala-settings-range-preview__title',
        text:
            texts?.rangePreviewTitle ??
            lang.settings_global_range_preview_title,
    });
    const previewCoreEl = previewContainer?.createDiv({
        cls: 'mandala-settings-range-preview__line',
    });
    const previewDepthEl = previewContainer?.createDiv({
        cls: 'mandala-settings-range-preview__line',
    });
    const previewSectionEl = previewContainer?.createDiv({
        cls: 'mandala-settings-range-preview__line',
    });
    const previewBehaviorEl = previewContainer?.createDiv({
        cls: 'mandala-settings-range-preview__line',
    });

    const updateRangeHints = () => {
        const coreText =
            coreSectionError ??
            (currentCoreSectionMax === 'unlimited'
                ? `实时提示：${lang.settings_global_range_input_empty}`
                : `实时提示：当前仅允许核心编号 1 ~ ${currentCoreSectionMax}。`);
        const depthText =
            subgridDepthError ??
            (currentSubgridMaxDepth === 'unlimited'
                ? `实时提示：${lang.settings_global_range_input_empty}`
                : `实时提示：当前最大层级 = ${currentSubgridMaxDepth}，最大 section 可到 ${resolveMaxSectionExample(currentSubgridMaxDepth)}。`);
        coreSectionSetting.setDesc(coreText);
        subgridDepthSetting.setDesc(depthText);

        if (!previewContainer) return;
        if (previewTitleEl) {
            previewTitleEl.setText(
                texts?.rangePreviewTitle ??
                    lang.settings_global_range_preview_title,
            );
        }
        previewCoreEl?.setText(
            currentCoreSectionMax === 'unlimited'
                ? '核心范围：1 ~ n（不设上限）'
                : `核心范围：1 ~ ${currentCoreSectionMax}`,
        );
        previewDepthEl?.setText(
            currentSubgridMaxDepth === 'unlimited'
                ? '子九宫层级：n 层（不设上限）'
                : `子九宫层级：${currentSubgridMaxDepth} 层（含核心层）`,
        );
        previewSectionEl?.setText(
            `最大 section 示例：${resolveMaxSectionExample(currentSubgridMaxDepth)}`,
        );
        previewBehaviorEl?.setText(
            lang.settings_global_range_preview_limit_behavior,
        );
    };

    coreSectionSetting.addText((text) =>
        text
            .setPlaceholder('留空表示不限')
            .setValue(
                currentCoreSectionMax === 'unlimited'
                    ? ''
                    : String(currentCoreSectionMax),
            )
            .onChange((value) => {
                const parsed = parsePositiveIntegerInput(value);
                if (!parsed.valid) {
                    coreSectionError = lang.settings_global_range_input_invalid;
                    updateRangeHints();
                    return;
                }
                coreSectionError = null;
                currentCoreSectionMax = parsed.value;
                handlers.setCoreSectionMax(parsed.value);
                updateRangeHints();
            }),
    );

    subgridDepthSetting.addText((text) =>
        text
            .setPlaceholder('留空表示不限')
            .setValue(
                currentSubgridMaxDepth === 'unlimited'
                    ? ''
                    : String(currentSubgridMaxDepth),
            )
            .onChange((value) => {
                const parsed = parsePositiveIntegerInput(value);
                if (!parsed.valid) {
                    subgridDepthError =
                        lang.settings_global_range_input_invalid;
                    updateRangeHints();
                    return;
                }
                subgridDepthError = null;
                currentSubgridMaxDepth = parsed.value;
                handlers.setSubgridMaxDepth(parsed.value);
                updateRangeHints();
            }),
    );

    updateRangeHints();

    if (
        timePlanContainer &&
        showTimePlanEnabledToggle &&
        handlers.setTimePlanEnabled
    ) {
        createMaybeDescriptionSetting(
            new Setting(timePlanContainer).setName(
                texts?.timePlanEnabled ??
                    lang.settings_general_time_plan_enabled,
            ),
            lang.settings_general_time_plan_enabled_desc,
            showDescriptions,
        ).addToggle((toggle) =>
            toggle
                .setValue(
                    state.general.dayPlanEnabled &&
                        state.general.weekPlanEnabled,
                )
                .onChange((enabled) => handlers.setTimePlanEnabled?.(enabled)),
        );
    }

    if (!timePlanContainer) return;
    const isTimePlanEnabled =
        state.general.dayPlanEnabled && state.general.weekPlanEnabled;
    if (!isTimePlanEnabled) return;
    if (!showTimePlanDefaults) return;

    if (state.general.weekPlanEnabled) {
        new Setting(timePlanContainer)
            .setName(texts?.weekStart ?? '周计划起始日')
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        monday: '周一开始',
                        sunday: '周日开始',
                    } satisfies Record<WeekStart, string>)
                    .setValue(state.general.weekStart)
                    .onChange((value) =>
                        handlers.setWeekStart(value as WeekStart),
                    ),
            );
    }

    createMaybeDescriptionSetting(
        new Setting(timePlanContainer).setName(
            texts?.dayPlanDateHeadingFormat ??
                lang.settings_general_day_plan_date_heading_format,
        ),
        lang.settings_general_day_plan_date_heading_format_desc,
        showDescriptions,
    ).addDropdown((dropdown) =>
        dropdown
            .addOptions({
                'date-only':
                    lang.settings_general_day_plan_date_heading_format_date_only,
                'zh-full':
                    lang.settings_general_day_plan_date_heading_format_zh_full,
                'zh-short':
                    lang.settings_general_day_plan_date_heading_format_zh_short,
                'en-short':
                    lang.settings_general_day_plan_date_heading_format_en_short,
                custom: lang.settings_general_day_plan_date_heading_format_custom,
            } satisfies Record<DayPlanDateHeadingFormat, string>)
            .setValue(state.general.dayPlanDateHeadingFormat)
            .onChange((value) =>
                handlers.setDayPlanDateHeadingFormat(
                    value as DayPlanDateHeadingFormat,
                ),
            ),
    );

    if (state.general.dayPlanDateHeadingFormat === 'custom') {
        createMaybeDescriptionSetting(
            new Setting(timePlanContainer).setName(
                texts?.dayPlanDateHeadingCustomTemplate ??
                    lang.settings_general_day_plan_date_heading_custom_template,
            ),
            lang.settings_general_day_plan_date_heading_custom_template_desc,
            showDescriptions,
        ).addText((text) =>
            text
                .setPlaceholder('## {date} {cn}')
                .setValue(state.general.dayPlanDateHeadingCustomTemplate)
                .onChange((value) =>
                    handlers.setDayPlanDateHeadingCustomTemplate(value),
                ),
        );
    }
};
