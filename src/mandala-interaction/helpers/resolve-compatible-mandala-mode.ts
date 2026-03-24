import type { MandalaMode } from 'src/mandala-settings/state/settings-type';

export const resolveCompatibleMandalaMode = ({
    currentMode,
    canUseNx9Mode,
}: {
    currentMode: MandalaMode;
    canUseNx9Mode: boolean;
}): MandalaMode | null => {
    if (currentMode === 'nx9' && !canUseNx9Mode) {
        return '3x3';
    }

    return null;
};
