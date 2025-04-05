import { getView } from 'src/view/components/container/context';
import { FontSize } from 'src/view/actions/settings/components/font-size';
import { BackgroundColor } from 'src/view/actions/settings/components/background-color';
import { ActiveBranchBackground } from 'src/view/actions/settings/components/active-branch-background';
import { CardWidth } from 'src/view/actions/settings/components/card-width';
import { LimitCardHeight } from 'src/view/actions/settings/components/limit-card-height';
import { DefaultDocumentFormat } from 'src/view/actions/settings/components/default-document-format';
import { CardsGap } from 'src/view/actions/settings/components/cards-gap';
import { CardIndentationWidth } from 'src/view/actions/settings/components/card-indentation-width';
import { MaintainEditMode } from 'src/view/actions/settings/components/maintain-edit-mode';
import { InactiveCardOpacity } from 'src/view/actions/settings/components/inactive-card-opacity';
import { ActiveBranchColor } from 'src/view/actions/settings/components/active-branch-color';
import { AlwaysShowCardButtons } from 'src/view/actions/settings/components/always-show-card-buttons';
import { ControlsBarButtons } from 'src/view/actions/settings/components/controls-bar-buttons/controls-bar-buttons';
import { HeadingsFontSize } from 'src/view/actions/settings/components/headings-font-size';
import { LinkPaneType } from 'src/view/actions/settings/components/link-pane-type';
import { LineageView } from 'src/view/view';

export type SettingsTab = 'General' | 'Appearance' | 'Layout';
type Tab = { element: HTMLDivElement; name: SettingsTab };

const setVisibleTab = (tabs: Tab[], activeTab: SettingsTab) => {
    for (const tab of tabs) {
        if (tab.name === activeTab) {
            tab.element.style.visibility = 'visible';
        } else {
            tab.element.style.visibility = 'hidden';
        }
    }
};

const render = (view: LineageView, element: HTMLElement, tabs: Tab[]) => {
    const settingsStore = view.plugin.settings;
    const generalTab = activeDocument.createElement('div');
    const appearanceTab = activeDocument.createElement('div');
    const layoutTab = activeDocument.createElement('div');

    tabs.push({ element: generalTab, name: 'General' });
    tabs.push({ element: appearanceTab, name: 'Appearance' });
    tabs.push({ element: layoutTab, name: 'Layout' });

    // general
    DefaultDocumentFormat(generalTab, settingsStore);
    LinkPaneType(generalTab, settingsStore);
    MaintainEditMode(generalTab, settingsStore);
    AlwaysShowCardButtons(generalTab, settingsStore);
    ControlsBarButtons(generalTab, view);

    // appearance
    BackgroundColor(appearanceTab, settingsStore);
    ActiveBranchBackground(appearanceTab, settingsStore);
    ActiveBranchColor(appearanceTab, settingsStore);
    InactiveCardOpacity(appearanceTab, settingsStore);
    FontSize(appearanceTab, settingsStore);
    HeadingsFontSize(appearanceTab, settingsStore);

    // layout
    CardWidth(layoutTab, settingsStore);
    CardsGap(layoutTab, settingsStore);
    CardIndentationWidth(layoutTab, settingsStore);
    LimitCardHeight(layoutTab, settingsStore);

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
