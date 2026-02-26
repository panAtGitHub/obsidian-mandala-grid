type MobileDoubleTapDetectorOptions = {
    windowMs?: number;
    minIntervalMs?: number;
    maxDistancePx?: number;
};

type RegisterTapInput = {
    x: number;
    y: number;
    key?: string;
    time?: number;
};

type TapState = {
    at: number;
    x: number;
    y: number;
    key?: string;
};

const DEFAULT_WINDOW_MS = 360;
const DEFAULT_MIN_INTERVAL_MS = 80;
const DEFAULT_MAX_DISTANCE_PX = 32;

export const createMobileDoubleTapDetector = (
    options: MobileDoubleTapDetectorOptions = {},
) => {
    const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    const minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
    const maxDistancePx = options.maxDistancePx ?? DEFAULT_MAX_DISTANCE_PX;

    let lastTap: TapState | null = null;

    const reset = () => {
        lastTap = null;
    };

    const registerTap = ({
        x,
        y,
        key,
        time = Date.now(),
    }: RegisterTapInput): boolean => {
        const currentTap: TapState = {
            at: time,
            x,
            y,
            key,
        };

        if (!lastTap) {
            lastTap = currentTap;
            return false;
        }

        const delta = currentTap.at - lastTap.at;
        const distance = Math.hypot(currentTap.x - lastTap.x, currentTap.y - lastTap.y);
        const sameKey =
            currentTap.key === undefined ||
            lastTap.key === undefined ||
            currentTap.key === lastTap.key;

        const isDoubleTap =
            delta >= minIntervalMs &&
            delta <= windowMs &&
            distance <= maxDistancePx &&
            sameKey;

        if (isDoubleTap) {
            reset();
            return true;
        }

        lastTap = currentTap;
        return false;
    };

    return {
        registerTap,
        reset,
    };
};
