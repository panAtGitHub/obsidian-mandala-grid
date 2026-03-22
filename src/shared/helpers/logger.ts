type Logger = {
    debug: (...message: unknown[]) => void;
    info: (...message: unknown[]) => void;
    warn: (...message: unknown[]) => void;
    error: (...message: unknown[]) => void;
};

export const __dev__ = process.env.NODE_ENV === 'development';
const runtimeConsole = globalThis['console'];

const createLogger = (): Logger => {
    const debug = (...message: unknown[]) => {
        if (__dev__) {
            runtimeConsole?.debug(`[DEBUG]: `, ...message);
        }
    };

    const info = (...message: unknown[]) => {
        if (__dev__) {
            runtimeConsole?.debug(`[INFO]: `, ...message);
        }
    };

    const warn = (...message: unknown[]) => {
        if (__dev__) {
            runtimeConsole?.warn(`[WARN]: `, ...message);
        }
    };

    const error = (...message: unknown[]) => {
        runtimeConsole?.error(`[ERROR]: `, ...message);
    };

    return { debug, info, warn, error };
};

export const logger = createLogger();
