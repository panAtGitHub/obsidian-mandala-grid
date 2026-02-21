import { derived, readable } from 'svelte/store';
import { MandalaView } from 'src/view/view';
import {
    getCurrentFileSectionColorMap,
    getCurrentFileSectionColorsSource,
} from 'src/lib/mandala/current-file-mandala-settings';
import {
    createSectionColorIndex,
    SectionColorMap,
    SECTION_COLOR_PALETTE,
} from 'src/view/helpers/mandala/section-colors';

type SectionColorSourceSnapshot = {
    path: string | null;
    source: unknown;
};

const readSectionColorSourceSnapshot = (
    view: MandalaView,
): SectionColorSourceSnapshot => ({
    path: view.file?.path ?? null,
    source: getCurrentFileSectionColorsSource(view),
});

const sameSectionColorSourceSnapshot = (
    a: SectionColorSourceSnapshot,
    b: SectionColorSourceSnapshot,
) => a.path === b.path && a.source === b.source;

export const CurrentFileSectionColorMapStore = (view: MandalaView) =>
    readable<SectionColorMap>(getCurrentFileSectionColorMap(view), (set) => {
        let snapshot = readSectionColorSourceSnapshot(view);
        const emitIfChanged = () => {
            const nextSnapshot = readSectionColorSourceSnapshot(view);
            if (sameSectionColorSourceSnapshot(snapshot, nextSnapshot)) return;
            snapshot = nextSnapshot;
            set(getCurrentFileSectionColorMap(view));
        };
        const unsubscribeFromSettings = view.plugin.settings.subscribe(() => {
            emitIfChanged();
        });
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
