import { MandalaMode } from 'src/stores/settings/settings-type';

export const resolveCompatibleMandalaMode = ({
    currentMode,
    canUseWeekPlanMode,
    canUseNx9Mode,
}: {
    currentMode: MandalaMode;
    canUseWeekPlanMode: boolean;
    canUseNx9Mode: boolean;
}): MandalaMode | null => {
    if (currentMode === 'week-7x9' && !canUseWeekPlanMode) {
        return canUseNx9Mode ? 'nx9' : '3x3';
    }

    if (currentMode === 'nx9' && !canUseNx9Mode) {
        return canUseWeekPlanMode ? 'week-7x9' : '3x3';
    }

    return null;
};
