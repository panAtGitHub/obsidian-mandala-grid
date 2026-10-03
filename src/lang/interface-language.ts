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
    // getLanguage was added in Obsidian 1.8.7. Keep the plugin's existing
    // minimum version compatible with the older app language preference.
    let language = 'en';
    if (typeof getLanguage === 'function') {
        // eslint-disable-next-line obsidianmd/no-unsupported-api -- Runtime guard supports app versions before 1.8.7.
        language = getLanguage();
    } else {
        try {
            // eslint-disable-next-line obsidianmd/prefer-get-language -- Compatibility fallback only when the public API is absent.
            language = window.localStorage?.getItem('language') || 'en';
        } catch {
            // Storage can be unavailable; explicit plugin preferences still work.
        }
    }
    return /^zh(?:[-_]|$)/i.test(language) ? 'zh' : 'en';
};
