import { SilentError } from 'src/shared/lib/errors/errors';
import { Notice } from 'obsidian';
import { lang } from 'src/lang/lang';
import { __dev__, logger } from 'src/shared/helpers/logger';

export const onPluginError = (
    error: unknown,
    location: 'reducer' | 'subscriber' | 'command',
    action: unknown,
) => {
    const normalizedError =
        error instanceof Error ? error : new Error(String(error));
    if (normalizedError instanceof SilentError && !__dev__) {
        return;
    }
    logger.error(`[${location}] action: `, action);
    logger.error(`[${location}]`, normalizedError);
    const message = normalizedError.message.replace(/Invariant failed(: )?/, '');
    if (message) new Notice(message);
    else new Notice(lang.error_generic);
};
