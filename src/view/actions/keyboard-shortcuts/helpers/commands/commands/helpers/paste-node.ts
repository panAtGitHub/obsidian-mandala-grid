import { LineageView } from 'src/view/view';
import { Notice } from 'obsidian';
import { lang } from 'src/lang/lang';

export const pasteNode = async (view: LineageView) => {
    const viewState = view.viewStore.getValue();
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
        const text = (await navigator.clipboard.readText()).replace(
            /\r\n/g,
            '\n',
        );
        view.documentStore.dispatch({
            type: 'document/paste-node',
            payload: {
                targetNodeId: viewState.document.activeNode,
                text,
            },
        });
    }
};
