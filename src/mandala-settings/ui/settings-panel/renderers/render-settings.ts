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
import { MandalaView } from 'src/view/view';
import { lang } from 'src/lang/lang';

export type SettingsTab = 'General' | 'Appearance' | 'Layout';
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

    tabs.push({ element: generalTab, name: 'General' });
    tabs.push({ element: appearanceTab, name: 'Appearance' });
    tabs.push({ element: layoutTab, name: 'Layout' });

    // general
    LinkPaneType(generalTab, settingsStore);
    MandalaEmbedDebug(generalTab, settingsStore);
    ControlsBarButtons(
        generalTab,
        view,
        isMandala ? '顶部工具栏按钮管理' : undefined,
    );

    // appearance
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

    // layout
    if (!isMandala) {
        CardWidth(layoutTab, settingsStore);
    }
    if (!isMandala) {
        CardsGap(layoutTab, settingsStore);
    }
    if (!isMandala) {
        LimitCardHeight(layoutTab, settingsStore);
    }

    element.append(generalTab, appearanceTab, layoutTab);
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
