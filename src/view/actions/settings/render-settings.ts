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
import { ControlsBarButtons } from 'src/view/actions/settings/components/controls-bar-buttons/controls-bar-buttons';
import { HeadingsFontSize } from 'src/view/actions/settings/components/headings-font-size';
import { MandalaFontSizes } from 'src/view/actions/settings/components/mandala-font-sizes';
import { LinkPaneType } from 'src/view/actions/settings/components/link-pane-type';
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
    DefaultDocumentFormat(generalTab, settingsStore);
    LinkPaneType(generalTab, settingsStore);
    MaintainEditMode(
        generalTab,
        settingsStore,
        isMandala ? '自动聚焦详情编辑' : undefined,
    );
    /*AlwaysShowCardButtons(
        generalTab,
        settingsStore,
        isMandala ? '始终显示格子操作图标' : undefined,
    );*/
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
        CardIndentationWidth(layoutTab, settingsStore);
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
