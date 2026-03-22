import { derived, readable } from 'svelte/store';
import { MandalaView } from 'src/view/view';
import { SettingsActions } from 'src/mandala-settings/state/settings-store-actions';
import {
    getCurrentFileSectionColorMap,
} from 'src/mandala-settings/state/current-file/current-file-preferences';
import {
    createSectionColorIndex,
    SectionColorMap,
    SECTION_COLOR_PALETTE,
    SECTION_COLOR_KEYS,
} from 'src/mandala-display/logic/section-colors';

type SectionColorSnapshot = {
    path: string | null;
    serialized: string;
    map: SectionColorMap;
};

const RELEVANT_SETTINGS_ACTIONS = new Set<SettingsActions['type']>([
    'settings/documents/persist-mandala-section-colors',
    'settings/documents/delete-document-preferences',
    'settings/documents/update-document-path',
    'settings/documents/remove-stale-documents',
]);

const serializeSectionColorMap = (map: SectionColorMap) =>
    JSON.stringify(SECTION_COLOR_KEYS.map((key) => map[key]));

const readSectionColorSnapshot = (view: MandalaView): SectionColorSnapshot => {
    const map = getCurrentFileSectionColorMap(view);
    return {
        path: view.file?.path ?? null,
        serialized: serializeSectionColorMap(map),
        map,
    };
};

const sameSectionColorSnapshot = (
    a: SectionColorSnapshot,
    b: SectionColorSnapshot,
) => a.path === b.path && a.serialized === b.serialized;

export const CurrentFileSectionColorMapStore = (view: MandalaView) =>
    readable<SectionColorMap>(getCurrentFileSectionColorMap(view), (set) => {
        let snapshot = readSectionColorSnapshot(view);
        const emitIfChanged = () => {
            const nextSnapshot = readSectionColorSnapshot(view);
            if (sameSectionColorSnapshot(snapshot, nextSnapshot)) return;
            snapshot = nextSnapshot;
            set(nextSnapshot.map);
        };
        const unsubscribeFromSettings = view.plugin.settings.subscribe(
            (_settings, action, firstRun) => {
                if (
                    firstRun ||
                    !action ||
                    RELEVANT_SETTINGS_ACTIONS.has(action.type)
                ) {
                    emitIfChanged();
                }
            },
        );
        const unsubscribeFromDocument = view.documentStore.subscribe(
            (_state, action, firstRun) => {
                if (
                    firstRun ||
                    action?.type === 'document/file/load-from-disk'
                ) {
                    emitIfChanged();
                }
            },
        );

        return () => {
            unsubscribeFromSettings();
            unsubscribeFromDocument();
        };
    });

export const SectionColorBySectionStore = (view: MandalaView) =>
    derived(CurrentFileSectionColorMapStore(view), (map) => {
        const index = createSectionColorIndex(map);
        const result: Record<string, string> = {};
        for (const [section, key] of Object.entries(index)) {
            result[section] = SECTION_COLOR_PALETTE[key];
        }
        return result;
    });
