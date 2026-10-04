import { getLanguage } from 'obsidian';

export type InterfaceLanguage = 'auto' | 'zh' | 'en';
let preference: InterfaceLanguage = 'auto';

export const normalizeInterfaceLanguage = (
    value: unknown,
): InterfaceLanguage => (value === 'zh' || value === 'en' ? value : 'auto');

export const setInterfaceLanguage = (value: unknown) => {
    preference = normalizeInterfaceLanguage(value);
};

export const getInterfaceLanguage = (): 'zh' | 'en' => {
    if (preference !== 'auto') return preference;
    const language = getLanguage();
    return /^zh(?:[-_]|$)/i.test(language) ? 'zh' : 'en';
};
