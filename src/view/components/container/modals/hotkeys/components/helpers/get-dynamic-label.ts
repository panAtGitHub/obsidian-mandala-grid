import { CommandName } from 'src/lang/hotkey-groups';
import { hotkeysLang } from 'src/lang/hotkeys-lang';

export const getDynamicLabel = (name: CommandName): string => {
    return hotkeysLang[name];
};
