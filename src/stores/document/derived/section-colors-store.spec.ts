import { describe, expect, it } from 'vitest';
import { Store } from 'src/lib/store/store';
import { DEFAULT_SETTINGS } from 'src/stores/settings/default-settings';
import { settingsReducer } from 'src/stores/settings/settings-reducer';
import {
    DocumentPreferences,
    Settings,
} from 'src/stores/settings/settings-type';
import { SettingsActions } from 'src/stores/settings/settings-store-actions';
import { CurrentFileSectionColorMapStore } from 'src/stores/document/derived/section-colors-store';
import { MandalaView } from 'src/view/view';
import { parseSectionColorsFromPersistedState } from 'src/view/helpers/mandala/section-colors';

type DocumentAction = { type: string };

const createDocumentPreferences = (
    sectionColors: NonNullable<DocumentPreferences['mandalaView']['sectionColors']>,
): DocumentPreferences => ({
    viewType: 'mandala-grid',
    activeSection: null,
    outline: null,
    mandalaView: {
        gridOrientation: null,
        lastActiveSection: null,
        subgridTheme: null,
        pinnedSections: [],
        sectionColors,
    },
});

const createTestContext = (initialPath = 'a.md') => {
    const settings = DEFAULT_SETTINGS();
    settings.documents['a.md'] = createDocumentPreferences({
        '2_rose': ['2'],
    });
    settings.documents['b.md'] = createDocumentPreferences({
        '3_amber': ['3'],
    });
    const settingsStore = new Store<Settings, SettingsActions>(
        settings,
        settingsReducer,
    );
    const documentStore = new Store<Record<string, never>, DocumentAction>({});
    const view = {
        file: { path: initialPath },
        plugin: { settings: settingsStore },
        documentStore,
    } as unknown as MandalaView;
    return { view, settingsStore, documentStore };
};

const parseEmittedMap = (raw: string) => {
    const parsed: unknown = JSON.parse(raw);
    return parseSectionColorsFromPersistedState(parsed);
};

describe('CurrentFileSectionColorMapStore', () => {
    it('ignores unrelated settings updates but reacts to section color updates', () => {
        const { view, settingsStore } = createTestContext('a.md');
        const store = CurrentFileSectionColorMapStore(view);
        const emissions: string[] = [];
        const unsubscribe = store.subscribe((map) => {
            emissions.push(JSON.stringify(map));
        });

        expect(emissions.length).toBe(1);

        settingsStore.dispatch({
            type: 'settings/document/persist-active-section',
            payload: {
                path: 'a.md',
                sectionNumber: '2',
            },
        });
        expect(emissions.length).toBe(1);

        settingsStore.dispatch({
            type: 'settings/documents/persist-mandala-section-colors',
            payload: {
                path: 'a.md',
                map: {
                    '2_rose': ['2', '2.1'],
                },
            },
        });
        expect(emissions.length).toBe(2);
        expect(parseEmittedMap(emissions[1])['2_rose']).toEqual(['2', '2.1']);
        unsubscribe();
    });

    it('updates when active file changes and load-from-disk is emitted', () => {
        const { view, documentStore } = createTestContext('a.md');
        const store = CurrentFileSectionColorMapStore(view);
        const emissions: string[] = [];
        const unsubscribe = store.subscribe((map) => {
            emissions.push(JSON.stringify(map));
        });

        expect(parseEmittedMap(emissions[0])['2_rose']).toEqual(['2']);
        const file = view.file;
        if (!file) {
            throw new Error('Expected test view to have an active file');
        }
        file.path = 'b.md';
        documentStore.dispatch({
            type: 'document/file/load-from-disk',
        });
        expect(emissions.length).toBe(2);
        expect(parseEmittedMap(emissions[1])['3_amber']).toEqual(['3']);
        unsubscribe();
    });

    it('detects in-place section color mutations when settings notify without action', () => {
        const { view, settingsStore } = createTestContext('a.md');
        const store = CurrentFileSectionColorMapStore(view);
        const emissions: string[] = [];
        const unsubscribe = store.subscribe((map) => {
            emissions.push(JSON.stringify(map));
        });

        expect(emissions.length).toBe(1);
        settingsStore.update((state) => {
            const colors = state.documents['a.md'].mandalaView.sectionColors as
                | Record<string, string[]>
                | undefined;
            if (colors) {
                colors['4_yellow'] = ['4'];
            }
            return state;
        });

        expect(emissions.length).toBe(2);
        expect(parseEmittedMap(emissions[1])['4_yellow']).toEqual(['4']);
        unsubscribe();
    });
});
