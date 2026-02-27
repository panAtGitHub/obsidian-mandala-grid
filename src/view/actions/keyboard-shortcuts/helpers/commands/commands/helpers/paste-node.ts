import { MandalaView } from 'src/view/view';
import { Notice } from 'obsidian';
import { lang } from 'src/lang/lang';

export const pasteNode = async (_view: MandalaView) => {
    const clipboardItems = await navigator.clipboard.read();
    let containsImage = false;

    for (const item of clipboardItems) {
        if (item.types.some((type) => type.startsWith('image/'))) {
            containsImage = true;
            break;
        }
    }

    if (containsImage) {
        new Notice(lang.error_cant_paste);
    } else {
        await navigator.clipboard.readText();
    }
};
