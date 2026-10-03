import { englishMessages } from 'src/lang/english-messages';
import { getInterfaceLanguage } from 'src/lang/interface-language';

// Chinese source text is the stable message key. Values are interpolated after
// translation, so note names, user headings and paths are never translated.
export const tx = (message: string, ...values: unknown[]): string => {
    const translated =
        getInterfaceLanguage() === 'en'
            ? (englishMessages as Readonly<Record<string, string>>)[message] ??
              message
            : message;
    return translated.replace(/\{(\d+)\}/g, (token, index: string) =>
        Number(index) < values.length ? String(values[Number(index)]) : token,
    );
};
