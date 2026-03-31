import { getView } from 'src/mandala-scenes/shared/shell/context';
import { FontSize } from 'src/mandala-settings/ui/settings-panel/fields/font-size';
import { BackgroundColor } from 'src/mandala-settings/ui/settings-panel/fields/background-color';
import { ActiveBranchBackground } from 'src/mandala-settings/ui/settings-panel/fields/active-branch-background';
import { CardWidth } from 'src/mandala-settings/ui/settings-panel/fields/card-width';
import { LimitCardHeight } from 'src/mandala-settings/ui/settings-panel/fields/limit-card-height';
import { CardsGap } from 'src/mandala-settings/ui/settings-panel/fields/cards-gap';
import { InactiveCardOpacity } from 'src/mandala-settings/ui/settings-panel/fields/inactive-card-opacity';
import { ActiveBranchColor } from 'src/mandala-settings/ui/settings-panel/fields/active-branch-color';
import { ControlsBarButtons } from 'src/mandala-settings/ui/settings-panel/fields/controls-bar-buttons/controls-bar-buttons';
import { HeadingsFontSize } from 'src/mandala-settings/ui/settings-panel/fields/headings-font-size';
import { MandalaFontSizes } from 'src/mandala-settings/ui/settings-panel/fields/mandala-font-sizes';
import { LinkPaneType } from 'src/mandala-settings/ui/settings-panel/fields/link-pane-type';
import { MandalaEmbedDebug } from 'src/mandala-settings/ui/settings-panel/fields/mandala-embed-debug';
import { Features3x3 } from 'src/mandala-settings/ui/settings-panel/fields/features/features-3x3';
import { Features9x9 } from 'src/mandala-settings/ui/settings-panel/fields/features/features-9x9';
import { FeaturesGeneral } from 'src/mandala-settings/ui/settings-panel/fields/features/features-general';
import { DayWeekPlanSettings } from 'src/mandala-settings/ui/settings-panel/fields/day-week-plan/day-week-plan';
import { MandalaView } from 'src/view/view';
import { lang } from 'src/lang/lang';

export type SettingsTab = 'General' | 'Appearance' | 'Layout' | 'Features' | 'Day/Week Plan';
type Tab = { element: HTMLDivElement; name: SettingsTab };

const setVisibleTab = (tabs: Tab[], activeTab: SettingsTab) => {
    for (const tab of tabs) {
        if (tab.name === activeTab) {
            tab.element.setCssProps({ visibility: 'visible' });
        } else {
            tab.element.setCssProps({ visibility: 'hidden' });
        }
    }
};

const render = (view: MandalaView, element: HTMLElement, tabs: Tab[]) => {
    const settingsStore = view.plugin.settings;
    const isMandala = view.getViewType() === 'mandala-grid';

    const generalTab = activeDocument.createElement('div');
    const appearanceTab = activeDocument.createElement('div');
    const layoutTab = activeDocument.createElement('div');
    const featuresTab = activeDocument.createElement('div');
    const dayWeekPlanTab = activeDocument.createElement('div');

    tabs.push({ element: generalTab, name: 'General' });
    tabs.push({ element: appearanceTab, name: 'Appearance' });
    tabs.push({ element: layoutTab, name: 'Layout' });
    tabs.push({ element: featuresTab, name: 'Features' });
    tabs.push({ element: dayWeekPlanTab, name: 'Day/Week Plan' });

    // ── General Tab ──
    LinkPaneType(generalTab, settingsStore);
    MandalaEmbedDebug(generalTab, settingsStore);
    ControlsBarButtons(
        generalTab,
        view,
        isMandala ? '顶部工具栏按钮管理' : undefined,
    );

    // ── Appearance Tab ──
    if (!isMandala) {
        BackgroundColor(appearanceTab, settingsStore);
        ActiveBranchBackground(appearanceTab, settingsStore);
        ActiveBranchColor(appearanceTab, settingsStore);
        InactiveCardOpacity(appearanceTab, settingsStore);
    }
    const fontDetails = appearanceTab.createEl('details', {
        cls: 'mandala-font-settings',
    });
    fontDetails.open = false;
    fontDetails.createEl('summary', {
        text: lang.settings_appearance_font_sizes_group,
    });
    const fontContent = fontDetails.createEl('div', {
        cls: 'mandala-font-settings__content',
    });
    if (isMandala) {
        MandalaFontSizes(fontContent, settingsStore);
        HeadingsFontSize(fontContent, settingsStore);
    } else {
        FontSize(fontContent, settingsStore);
        HeadingsFontSize(fontContent, settingsStore);
    }

    // ── Layout Tab ──
    if (!isMandala) {
        CardWidth(layoutTab, settingsStore);
    }
    if (!isMandala) {
        CardsGap(layoutTab, settingsStore);
    }
    if (!isMandala) {
        LimitCardHeight(layoutTab, settingsStore);
    }

    // ── Features Tab ──
    if (isMandala) {
        const section3x3 = featuresTab.createEl('details', {
            cls: 'mandala-features-section',
        });
        section3x3.open = true;
        section3x3.createEl('summary', { text: '3×3 视图' });
        Features3x3(section3x3.createEl('div'), settingsStore);

        const section9x9 = featuresTab.createEl('details', {
            cls: 'mandala-features-section',
        });
        section9x9.open = true;
        section9x9.createEl('summary', { text: '9×9 视图' });
        Features9x9(section9x9.createEl('div'), settingsStore);

        const sectionGeneral = featuresTab.createEl('details', {
            cls: 'mandala-features-section',
        });
        sectionGeneral.open = true;
        sectionGeneral.createEl('summary', { text: '通用' });
        FeaturesGeneral(sectionGeneral.createEl('div'), settingsStore);
    }

    // ── Day/Week Plan Tab ──
    DayWeekPlanSettings(dayWeekPlanTab, settingsStore);

    element.append(generalTab, appearanceTab, layoutTab, featuresTab, dayWeekPlanTab);
};

export const renderSettings = (element: HTMLElement, tab: SettingsTab) => {
    const tabs: Tab[] = [];
    const view = getView();
    render(view, element, tabs);
    setVisibleTab(tabs, tab);
    return {
        update: (tab: SettingsTab) => {
            setVisibleTab(tabs, tab);
        },
    };
};
