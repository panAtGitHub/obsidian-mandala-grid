import { SilentError } from 'src/lib/errors/errors';
import { Notice } from 'obsidian';
import { lang } from 'src/lang/lang';
import { __dev__ } from 'src/helpers/logger';

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
    console.error(`[${location}] action: `, action);
    console.error(`[${location}]`, normalizedError);
    const message = normalizedError.message.replace(/Invariant failed(: )?/, '');
    if (message) new Notice(message);
    else new Notice(lang.error_generic);
};
