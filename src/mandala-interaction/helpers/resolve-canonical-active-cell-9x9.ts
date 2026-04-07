import { posOfSection9x9 } from 'src/mandala-display/logic/mandala-grid';
import { getSectionCore } from 'src/mandala-display/logic/mandala-topology';
import type { MandalaCustomLayout } from 'src/mandala-settings/state/settings-type';

type GridCell9x9 = { row: number; col: number } | null;

export const resolveCanonicalActiveCell9x9 = ({
    section,
    selectedLayoutId,
    customLayouts,
    fallbackCell = null,
}: {
    section: string | null | undefined;
    selectedLayoutId: string;
    customLayouts: MandalaCustomLayout[];
    fallbackCell?: GridCell9x9;
}): GridCell9x9 => {
    if (!section) {
        return fallbackCell;
    }

    return (
        posOfSection9x9(
            section,
            selectedLayoutId,
            getSectionCore(section) ?? '1',
            customLayouts,
        ) ?? fallbackCell
    );
};
