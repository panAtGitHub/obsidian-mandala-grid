import { Plugin, WorkspaceLeaf } from 'obsidian';
import { MANDALA_VIEW_TYPE, MandalaView } from './view/view';
import { createSetViewState } from 'src/obsidian/patches/create-set-view-state';
import { around } from 'monkey-around';
import { settingsReducer } from 'src/stores/settings/settings-reducer';
import { deepMerge } from 'src/helpers/deep-merge';
import { DEFAULT_SETTINGS } from 'src/stores/settings/default-settings';
import { Store } from 'src/lib/store/store';
import {
    DocumentsPreferences,
    Settings,
} from 'src/stores/settings/settings-type';
import { Settings_0_5_4 } from 'src/stores/settings/migrations/old-settings-type';
import { registerFileMenuEvent } from 'src/obsidian/events/workspace/register-file-menu-event';
import { addCommands } from 'src/obsidian/commands/add-commands';
import { settingsSubscriptions } from 'src/stores/settings/subscriptions/settings-subscriptions';
import { PluginState } from 'src/stores/plugin/plugin-state-type';
import { PluginStoreActions } from 'src/stores/plugin/plugin-store-actions';
import { pluginReducer } from 'src/stores/plugin/plugin-reducer';
import { DefaultPluginState } from 'src/stores/plugin/default-plugin-state';
import { StatusBar } from 'src/obsidian/status-bar/status-bar';
import { onPluginError } from 'src/lib/store/on-plugin-error';
import { customIcons, loadCustomIcons } from 'src/helpers/load-custom-icons';
import { setActiveLeaf } from 'src/obsidian/patches/set-active-leaf';
import { migrateSettings } from 'src/stores/settings/migrations/migrate-settings';
import { toggleFileViewType } from 'src/obsidian/events/workspace/effects/toggle-file-view-type';
import { getActiveFile } from 'src/obsidian/commands/helpers/get-active-file';
import { createMandalaGridDocument } from 'src/obsidian/events/workspace/effects/create-mandala-document';
import { registerFilesMenuEvent } from 'src/obsidian/events/workspace/register-files-menu-event';
import { removeHtmlElementMarkerInPreviewMode } from 'src/obsidian/markdown-post-processors/remove-html-element-marker-in-preview-mode';
import {
    minimapWorker,
    rulesWorker,
    statusBarWorker,
} from 'src/workers/worker-instances';
import { onVaultEvent } from 'src/stores/plugin/subscriptions/on-vault-event';
import { onWorkspaceEvent } from 'src/stores/plugin/subscriptions/on-workspace-event';
import { SettingsActions } from 'src/stores/settings/settings-store-actions';

export type SettingsStore = Store<Settings, SettingsActions>;
export type PluginStore = Store<PluginState, PluginStoreActions>;

export default class MandalaGrid extends Plugin {
    settings: SettingsStore;
    store: PluginStore;
    statusBar: StatusBar;
    private timeoutReferences: Set<ReturnType<typeof setTimeout>> = new Set();
    private saveSettingsTimeout: ReturnType<typeof setTimeout> | null = null;
    private isSavingSettings = false;
    private hasPendingSettingsSave = false;
    viewType: DocumentsPreferences = {};

    async onload() {
        await this.loadSettings();
        this.store = new Store<PluginState, PluginStoreActions>(
            DefaultPluginState(),
            pluginReducer,
            onPluginError,
        );
        loadCustomIcons();
        this.registerView(
            MANDALA_VIEW_TYPE,
            (leaf) => new MandalaView(leaf, this),
        );
        addCommands(this);
        this.registerPatches();
        this.registerEvents();
        this.statusBar = new StatusBar(this);
        this.loadRibbonIcon();
        this.registerMarkdownPostProcessor(
            removeHtmlElementMarkerInPreviewMode,
        );
    }

    async saveSettings() {
        this.hasPendingSettingsSave = true;
        if (this.isSavingSettings) return;

        this.isSavingSettings = true;
        try {
            while (this.hasPendingSettingsSave) {
                this.hasPendingSettingsSave = false;
                await this.saveData(this.settings.getValue());
            }
        } finally {
            this.isSavingSettings = false;
        }
    }

    async loadSettings() {
        const loaded: unknown = await this.loadData();
        const rawSettings =
            loaded && typeof loaded === 'object'
                ? (loaded as Settings | Settings_0_5_4)
                : {};
        const settings = deepMerge(rawSettings, DEFAULT_SETTINGS()) as Settings;
        migrateSettings(settings);
        this.settings = new Store<Settings, SettingsActions>(
            settings,
            settingsReducer,
            onPluginError,
        );
        this.settings.subscribe((_state, _action, initialRun) => {
            if (initialRun) return;
            this.queueSettingsSave();
        });
        settingsSubscriptions(this);
    }

    private queueSettingsSave(delay_ms: number = 250) {
        this.hasPendingSettingsSave = true;
        if (this.saveSettingsTimeout) {
            clearTimeout(this.saveSettingsTimeout);
        }
        this.saveSettingsTimeout = setTimeout(() => {
            this.saveSettingsTimeout = null;
            void this.saveSettings();
        }, delay_ms);
    }

    private registerEvents() {
        registerFileMenuEvent(this);
        registerFilesMenuEvent(this);
        onVaultEvent(this);
        onWorkspaceEvent(this);
    }

    registerTimeout(timeout: ReturnType<typeof setTimeout>) {
        this.timeoutReferences.add(timeout);
    }

    private registerPatches() {
        this.register(around(this.app.workspace, { setActiveLeaf }));
        const setViewState = createSetViewState(this);
        const workspaceLeafPrototype = WorkspaceLeaf.prototype as unknown as Record<
            string,
            (...params: unknown[]) => unknown
        >;
        const setViewStateWrapper =
            setViewState as unknown as (
                next: (...params: unknown[]) => unknown,
            ) => (...params: unknown[]) => unknown;
        this.register(
            around(workspaceLeafPrototype, {
                setViewState: setViewStateWrapper,
            }),
        );
    }

    private loadRibbonIcon() {
        this.addRibbonIcon(
            customIcons.mandalaGrid.name,
            'Open mandala grid',
            () => {
                const file = getActiveFile(this);
                if (file) {
                    void toggleFileViewType(this, file, undefined);
                } else {
                    void createMandalaGridDocument(this);
                }
            },
        );
    }

    onunload() {
        super.onunload();
        if (this.saveSettingsTimeout) {
            clearTimeout(this.saveSettingsTimeout);
            this.saveSettingsTimeout = null;
        }
        if (this.hasPendingSettingsSave) {
            void this.saveSettings();
        }
        for (const timeout of this.timeoutReferences) {
            clearTimeout(timeout);
        }
        minimapWorker.terminate();
        rulesWorker.terminate();
        statusBarWorker.terminate();
    }
}
