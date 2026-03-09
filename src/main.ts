import { Plugin, WorkspaceLeaf } from 'obsidian';
import { type Extension } from '@codemirror/state';
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
import { migrateSettings } from 'src/stores/settings/migrations/migrate-settings';
import { toggleFileViewType } from 'src/obsidian/events/workspace/effects/toggle-file-view-type';
import { getActiveFile } from 'src/obsidian/commands/helpers/get-active-file';
import { createMandalaGridDocument } from 'src/obsidian/events/workspace/effects/create-mandala-document';
import {
    createRenderMandalaEmbedPostProcessor,
    MANDALA_EMBED_POSTPROCESSOR_SORT_ORDER,
} from 'src/obsidian/markdown-post-processors/mandala-embed/render-mandala-embed';
import { createMandalaSourceEmbedExtension } from 'src/obsidian/editor-extensions/mandala-source-embed/create-mandala-source-embed-extension';
import {
    refreshOpenManagedMandalaEmbedsByTargetPaths,
    getOpenMandalaEmbedRefreshViews,
    registerMandalaEmbedRefreshEvents,
    rerenderMarkdownPreviewsBySourcePaths,
    rerenderOpenMarkdownPreviews,
    resolveMandalaEmbedRefreshPlan,
} from 'src/obsidian/events/workspace/register-mandala-embed-refresh-events';
import {
    statusBarWorker,
} from 'src/workers/worker-instances';
import { onVaultEvent } from 'src/stores/plugin/subscriptions/on-vault-event';
import { onWorkspaceEvent } from 'src/stores/plugin/subscriptions/on-workspace-event';
import { SettingsActions } from 'src/stores/settings/settings-store-actions';
import { lang } from 'src/lang/lang';

export type SettingsStore = Store<Settings, SettingsActions>;
export type PluginStore = Store<PluginState, PluginStoreActions>;

export default class MandalaGrid extends Plugin {
    settings: SettingsStore;
    store: PluginStore;
    statusBar: StatusBar;
    private timeoutReferences: Set<ReturnType<typeof setTimeout>> = new Set();
    private saveSettingsTimeout: ReturnType<typeof setTimeout> | null = null;
    private refreshMandalaEmbedTimeout: ReturnType<typeof setTimeout> | null = null;
    private isSavingSettings = false;
    private hasPendingSettingsSave = false;
    private pendingMandalaEmbedRefreshAll = false;
    private pendingMandalaEmbedChangedPaths = new Set<string>();
    private mandalaEmbedRefreshEpoch = 0;
    private readonly mandalaSourceEmbedExtensions: Extension[] = [];
    private lastMandalaGridOrientation: string | null = null;
    viewType: DocumentsPreferences = {};

    async onload() {
        await this.loadSettings();
        this.store = new Store<PluginState, PluginStoreActions>(
            DefaultPluginState(),
            pluginReducer,
            onPluginError,
        );
        this.lastMandalaGridOrientation =
            this.settings.getValue().view.mandalaGridOrientation;
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
            createRenderMandalaEmbedPostProcessor(this),
            MANDALA_EMBED_POSTPROCESSOR_SORT_ORDER,
        );
        this.replaceMandalaSourceEmbedExtensions();
        this.registerEditorExtension(this.mandalaSourceEmbedExtensions);
        this.app.workspace.updateOptions();
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
            const nextOrientation =
                this.settings.getValue().view.mandalaGridOrientation;
            if (this.lastMandalaGridOrientation !== nextOrientation) {
                this.lastMandalaGridOrientation = nextOrientation;
                this.scheduleMandalaEmbedRefresh({
                    forceAll: true,
                });
            }
            this.queueSettingsSave();
        });
        settingsSubscriptions(this);
    }

    getMandalaEmbedRefreshEpoch() {
        return this.mandalaEmbedRefreshEpoch;
    }

    scheduleMandalaEmbedRefresh({
        delay_ms = 120,
        changedPaths = [],
        forceAll = false,
    }: {
        delay_ms?: number;
        changedPaths?: Iterable<string>;
        forceAll?: boolean;
    } = {}) {
        if (forceAll) {
            this.pendingMandalaEmbedRefreshAll = true;
        } else {
            for (const path of changedPaths) {
                if (path.trim().length === 0) continue;
                this.pendingMandalaEmbedChangedPaths.add(path);
            }
        }

        if (this.refreshMandalaEmbedTimeout) {
            clearTimeout(this.refreshMandalaEmbedTimeout);
        }

        this.refreshMandalaEmbedTimeout = setTimeout(() => {
            this.refreshMandalaEmbedTimeout = null;
            const forceAllRefresh = this.pendingMandalaEmbedRefreshAll;
            const changedPathSet = new Set(this.pendingMandalaEmbedChangedPaths);
            this.pendingMandalaEmbedRefreshAll = false;
            this.pendingMandalaEmbedChangedPaths.clear();

            if (forceAllRefresh) {
                this.mandalaEmbedRefreshEpoch += 1;
                this.replaceMandalaSourceEmbedExtensions();
                this.app.workspace.updateOptions();
                rerenderOpenMarkdownPreviews(this);
                return;
            }

            const refreshPlan = resolveMandalaEmbedRefreshPlan(
                this,
                getOpenMandalaEmbedRefreshViews(this),
                changedPathSet,
            );
            if (
                !refreshPlan.refreshEditors &&
                refreshPlan.previewSourcePaths.size === 0 &&
                refreshPlan.previewTargetPaths.size === 0
            ) {
                return;
            }

            if (refreshPlan.refreshEditors) {
                this.mandalaEmbedRefreshEpoch += 1;
                this.replaceMandalaSourceEmbedExtensions();
                this.app.workspace.updateOptions();
            }

            if (refreshPlan.previewSourcePaths.size > 0) {
                rerenderMarkdownPreviewsBySourcePaths(
                    this,
                    refreshPlan.previewSourcePaths,
                );
            }

            if (refreshPlan.previewTargetPaths.size > 0) {
                void refreshOpenManagedMandalaEmbedsByTargetPaths(
                    refreshPlan.previewTargetPaths,
                );
            }
        }, delay_ms);
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
        onVaultEvent(this);
        onWorkspaceEvent(this);
        registerMandalaEmbedRefreshEvents(this);
    }

    private replaceMandalaSourceEmbedExtensions() {
        this.mandalaSourceEmbedExtensions.splice(
            0,
            this.mandalaSourceEmbedExtensions.length,
            createMandalaSourceEmbedExtension(this),
        );
    }

    registerTimeout(timeout: ReturnType<typeof setTimeout>) {
        this.timeoutReferences.add(timeout);
    }

    private registerPatches() {
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
            lang.cmd_toggle_mandala_view,
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
        this.statusBar?.clear();
        if (this.saveSettingsTimeout) {
            clearTimeout(this.saveSettingsTimeout);
            this.saveSettingsTimeout = null;
        }
        if (this.refreshMandalaEmbedTimeout) {
            clearTimeout(this.refreshMandalaEmbedTimeout);
            this.refreshMandalaEmbedTimeout = null;
        }
        if (this.hasPendingSettingsSave) {
            void this.saveSettings();
        }
        for (const timeout of this.timeoutReferences) {
            clearTimeout(timeout);
        }
        statusBarWorker.terminate();
    }
}
