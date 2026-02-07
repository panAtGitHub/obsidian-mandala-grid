type Logger = {
    debug: (...message: unknown[]) => void;
    info: (...message: unknown[]) => void;
    warn: (...message: unknown[]) => void;
    error: (...message: unknown[]) => void;
};

export const __dev__ = process.env.NODE_ENV === 'development';
const createLogger = (): Logger => {
    const debug = (...message: unknown[]) => {
        if (__dev__) {
            console.debug(`[DEBUG]: `, ...message);
        }
    };

    const info = (...message: unknown[]) => {
        if (__dev__) {
            console.debug(`[INFO]: `, ...message);
        }
    };

    const warn = (...message: unknown[]) => {
        if (__dev__) {
            console.warn(`[WARN]: `, ...message);
        }
    };

    const error = (...message: unknown[]) => {
        console.error(`[ERROR]: `, ...message);
    };

    return { debug, info, warn, error };
};

export const logger = createLogger();

/*let i = 0;
export const AlignBranchLogger = (action: PluginAction) => {
    const id = i++;
    let t = 0;
    return {
        log: (...params: any[]) => {
            const delta = t > 0 ? Date.now() - t : 0;
            t = Date.now();
            console.log(`[${id}] [${action.type}] [${delta}]`, ...params);
        },
    };
}*/
