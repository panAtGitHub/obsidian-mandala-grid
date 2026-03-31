import type { MandalaMode } from 'src/mandala-settings/state/settings-type';

export const resolveCompatibleMandalaMode = ({
    currentMode,
    canUse9x9Mode,
    canUseNx9Mode,
}: {
    currentMode: MandalaMode;
    canUse9x9Mode: boolean;
    canUseNx9Mode: boolean;
}): MandalaMode | null => {
    if (currentMode === '9x9' && !canUse9x9Mode) {
        return '3x3';
    }

    if (currentMode === 'nx9' && !canUseNx9Mode) {
        return canUse9x9Mode ? '9x9' : '3x3';
    }

    return null;
};
