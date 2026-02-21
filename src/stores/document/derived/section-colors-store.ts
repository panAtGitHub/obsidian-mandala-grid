import { derived, readable } from 'svelte/store';
import { MandalaView } from 'src/view/view';
import {
    createSectionColorIndex,
    parseSectionColorsFromPersistedState,
    SECTION_COLOR_PALETTE,
} from 'src/view/helpers/mandala/section-colors';

export const SectionColorBySectionStore = (view: MandalaView) =>
    derived(
        [
            view.plugin.settings,
            readable(0, (set) => {
                let tick = 0;
                const unsub = view.documentStore.subscribe(
                    (_state, action, firstRun) => {
                        if (
                            firstRun ||
                            action?.type === 'document/file/load-from-disk'
                        ) {
                            tick += 1;
                            set(tick);
                        }
                    },
                );
                return unsub;
            }),
        ],
        ([settings]) => {
        const path = view.file?.path;
        const preferences = path ? settings.documents[path] : null;
        const map = parseSectionColorsFromPersistedState(
            preferences?.mandalaView?.sectionColors,
        );
        const index = createSectionColorIndex(map);
        const result: Record<string, string> = {};
        for (const [section, key] of Object.entries(index)) {
            result[section] = SECTION_COLOR_PALETTE[key];
        }
        return result;
        },
    );
