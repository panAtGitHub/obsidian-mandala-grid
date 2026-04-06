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
    showViewPresets?: boolean;
    showTimePlanEnabledToggle?: boolean;
    showTimePlanSection?: boolean;
    showTimePlanDefaults?: boolean;
    renderTimePlanFooter?: (containerEl: HTMLElement) => void;
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

type GlobalViewPresetId =
    | 'single-81'
    | 'multi-81'
    | 'multi-3x3'
    | 'single-infinite'
    | 'multi-infinite'
    | 'custom';

type GlobalViewPreset = {
    id: GlobalViewPresetId;
    label: string;
    view: {
        enable9x9View: boolean;
        enableNx9View: boolean;
        coreSectionMax: SectionRangeLimit;
        subgridMaxDepth: SectionRangeLimit;
    };
};

const GLOBAL_VIEW_PRESETS: GlobalViewPreset[] = [
    {
        id: 'single-81',
        label: '一页81宫格',
        view: {
            enable9x9View: true,
            enableNx9View: false,
            coreSectionMax: 1,
            subgridMaxDepth: 3,
        },
    },
    {
        id: 'multi-81',
        label: 'n页81宫格',
        view: {
            enable9x9View: true,
            enableNx9View: true,
            coreSectionMax: 'unlimited',
            subgridMaxDepth: 3,
        },
    },
    {
        id: 'multi-3x3',
        label: 'n页九宫格',
        view: {
            enable9x9View: false,
            enableNx9View: true,
            coreSectionMax: 'unlimited',
            subgridMaxDepth: 2,
        },
    },
    {
        id: 'single-infinite',
        label: '一页无限九宫格',
        view: {
            enable9x9View: false,
            enableNx9View: false,
            coreSectionMax: 1,
            subgridMaxDepth: 'unlimited',
        },
    },
    {
        id: 'multi-infinite',
        label: 'n页无限九宫格',
        view: {
            enable9x9View: false,
            enableNx9View: true,
            coreSectionMax: 'unlimited',
            subgridMaxDepth: 'unlimited',
        },
    },
    {
        id: 'custom',
        label: '自定义',
        view: {
            enable9x9View: false,
            enableNx9View: true,
            coreSectionMax: 'unlimited',
            subgridMaxDepth: 'unlimited',
        },
    },
];

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

const viewPresetMatches = (
    preset: GlobalViewPreset,
    value: {
        enable9x9View: boolean;
        enableNx9View: boolean;
        coreSectionMax: SectionRangeLimit;
        subgridMaxDepth: SectionRangeLimit;
    },
) =>
    preset.view.enable9x9View === value.enable9x9View &&
    preset.view.enableNx9View === value.enableNx9View &&
    preset.view.coreSectionMax === value.coreSectionMax &&
    preset.view.subgridMaxDepth === value.subgridMaxDepth;

const resolveGlobalViewPresetId = (value: {
    enable9x9View: boolean;
    enableNx9View: boolean;
    coreSectionMax: SectionRangeLimit;
    subgridMaxDepth: SectionRangeLimit;
}): GlobalViewPresetId =>
    GLOBAL_VIEW_PRESETS.find(
        (preset) =>
            preset.id !== 'custom' && viewPresetMatches(preset, value),
    )?.id ?? 'custom';

const toRangeInputValue = (value: SectionRangeLimit) =>
    value === 'unlimited' ? '' : String(value);

export const renderMandalaCoreSettings = ({
    parentEl,
    state,
    handlers,
    createGroupContainer,
    showDescriptions,
    showViewPresets = false,
    showTimePlanEnabledToggle = true,
    showTimePlanSection = true,
    showTimePlanDefaults = true,
    renderTimePlanFooter,
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

    let currentEnable9x9View = state.view.enable9x9View;
    let currentEnableNx9View = state.view.enableNx9View;
    let currentCoreSectionMax = state.view.coreSectionMax;
    let currentSubgridMaxDepth = state.view.subgridMaxDepth;
    let coreSectionError: string | null = null;
    let subgridDepthError: string | null = null;
    let currentPresetId: GlobalViewPresetId = resolveGlobalViewPresetId({
        enable9x9View: currentEnable9x9View,
        enableNx9View: currentEnableNx9View,
        coreSectionMax: currentCoreSectionMax,
        subgridMaxDepth: currentSubgridMaxDepth,
    });
    let applyingPreset = false;

    let enable9x9Toggle:
        | {
              setValue: (value: boolean) => unknown;
          }
        | undefined;
    let enableNx9Toggle:
        | {
              setValue: (value: boolean) => unknown;
          }
        | undefined;
    let coreSectionInput:
        | {
              setValue: (value: string) => unknown;
          }
        | undefined;
    let subgridDepthInput:
        | {
              setValue: (value: string) => unknown;
          }
        | undefined;
    const presetButtons = new Map<GlobalViewPresetId, HTMLButtonElement>();

    const syncPresetButtons = () => {
        presetButtons.forEach((button, presetId) => {
            const selected = presetId === currentPresetId;
            const label = button.dataset.label ?? '';
            button.setText(`${selected ? '●' : '○'} ${label}`);
            button.setCssProps({
                border: selected
                    ? '1px solid var(--interactive-accent)'
                    : '1px solid var(--background-modifier-border)',
                'background-color': selected
                    ? 'color-mix(in srgb, var(--interactive-accent) 12%, var(--background-secondary))'
                    : 'var(--background-secondary)',
                color: selected ? 'var(--text-normal)' : 'var(--text-muted)',
            });
        });
    };

    const syncPresetFromCurrentValues = () => {
        currentPresetId = resolveGlobalViewPresetId({
            enable9x9View: currentEnable9x9View,
            enableNx9View: currentEnableNx9View,
            coreSectionMax: currentCoreSectionMax,
            subgridMaxDepth: currentSubgridMaxDepth,
        });
        syncPresetButtons();
    };

    const applyPreset = (presetId: GlobalViewPresetId) => {
        const preset = GLOBAL_VIEW_PRESETS.find((item) => item.id === presetId);
        if (!preset || preset.id === 'custom') return;

        applyingPreset = true;
        currentEnable9x9View = preset.view.enable9x9View;
        currentEnableNx9View = preset.view.enableNx9View;
        currentCoreSectionMax = preset.view.coreSectionMax;
        currentSubgridMaxDepth = preset.view.subgridMaxDepth;
        coreSectionError = null;
        subgridDepthError = null;

        state.view.enable9x9View = currentEnable9x9View;
        state.view.enableNx9View = currentEnableNx9View;
        handlers.setEnable9x9View(currentEnable9x9View);
        handlers.setEnableNx9View(currentEnableNx9View);
        handlers.setCoreSectionMax(currentCoreSectionMax);
        handlers.setSubgridMaxDepth(currentSubgridMaxDepth);

        enable9x9Toggle?.setValue(currentEnable9x9View);
        enableNx9Toggle?.setValue(currentEnableNx9View);
        coreSectionInput?.setValue(toRangeInputValue(currentCoreSectionMax));
        subgridDepthInput?.setValue(toRangeInputValue(currentSubgridMaxDepth));

        currentPresetId = preset.id;
        updateRangeHints();
        syncPresetButtons();
        applyingPreset = false;
    };

    if (showViewPresets) {
        const presetSection = globalViewContainer.createDiv({
            cls: 'mandala-settings-view-presets',
        });
        presetSection.setCssProps({
            'margin-bottom': showDescriptions ? '8px' : '4px',
        });
        presetSection.createDiv({ text: '预设模式' }).setCssProps({
            'font-size': 'var(--font-ui-medium)',
            'font-weight': 'var(--font-semibold)',
            'margin-bottom': '8px',
        });
        const presetGrid = presetSection.createDiv({
            cls: 'mandala-settings-view-presets__grid',
        });
        presetGrid.setCssProps({
            display: 'grid',
            'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
            gap: '6px 8px',
            'margin-bottom': showDescriptions ? '6px' : '2px',
        });

        GLOBAL_VIEW_PRESETS.forEach((preset) => {
            const button = presetGrid.createEl('button', {
                cls: 'mod-muted',
                attr: { type: 'button' },
            });
            button.dataset.label = preset.label;
            button.setCssProps({
                'text-align': 'left',
                padding: '8px 10px',
                'border-radius': '12px',
                'font-size': 'var(--font-ui-small)',
                'font-weight': 'var(--font-medium)',
                'line-height': '1.2',
                margin: '0',
            });
            button.addEventListener('click', () => applyPreset(preset.id));
            presetButtons.set(preset.id, button);
        });

        if (showDescriptions) {
            presetSection.createDiv({
                text: '提示：选择预设后，下方参数会自动联动；若手动修改参数，预设自动切换为「自定义」。',
            }).setCssProps({
                'font-size': 'var(--font-ui-smaller)',
                color: 'var(--text-muted)',
                'line-height': '1.45',
            });
        }

        syncPresetButtons();
    }

    new Setting(globalViewContainer)
        .setName(texts?.enable9x9View ?? lang.settings_global_enable_9x9_view)
        .addToggle((toggle) => {
            enable9x9Toggle = toggle;
            toggle.setValue(currentEnable9x9View).onChange((enabled) => {
                currentEnable9x9View = enabled;
                state.view.enable9x9View = enabled;
                handlers.setEnable9x9View(enabled);
                if (!applyingPreset) syncPresetFromCurrentValues();
            });
        });

    new Setting(globalViewContainer)
        .setName(texts?.enableNx9View ?? lang.settings_global_enable_nx9_view)
        .addToggle((toggle) => {
            enableNx9Toggle = toggle;
            toggle.setValue(currentEnableNx9View).onChange((enabled) => {
                currentEnableNx9View = enabled;
                state.view.enableNx9View = enabled;
                handlers.setEnableNx9View(enabled);
                if (!applyingPreset) syncPresetFromCurrentValues();
            });
        });

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

    coreSectionSetting.addText((text) => {
        coreSectionInput = text;
        text.setPlaceholder('留空表示不限')
            .setValue(toRangeInputValue(currentCoreSectionMax))
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
                if (!applyingPreset) syncPresetFromCurrentValues();
            });
    });

    subgridDepthSetting.addText((text) => {
        subgridDepthInput = text;
        text.setPlaceholder('留空表示不限')
            .setValue(toRangeInputValue(currentSubgridMaxDepth))
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
                if (!applyingPreset) syncPresetFromCurrentValues();
            });
    });

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

    renderTimePlanFooter?.(timePlanContainer);
};
