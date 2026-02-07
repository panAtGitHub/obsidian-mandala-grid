import { SilentError } from 'src/lib/errors/errors';
import { Notice } from 'obsidian';
import { lang } from 'src/lang/lang';
import { __dev__ } from 'src/helpers/logger';

export const onPluginError = (
    error: Error,
    location: 'reducer' | 'subscriber' | 'command',
    action: unknown,
) => {
    if (error instanceof SilentError && !__dev__) {
        return;
    }
    console.error(`[${location}] action: `, action);
    console.error(`[${location}]`, error);
    const message = error.message.replace(/Invariant failed(: )?/, '');
    if (message) new Notice(message);
    else new Notice(lang.error_generic);
};
