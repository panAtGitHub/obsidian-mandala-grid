import { LineageView } from 'src/view/view';
import { LineageDocumentFormat } from 'src/stores/settings/settings-type';
import { detectDocumentFormat } from 'src/lib/format-detection/detect-document-format';
import { maybeGetDocumentFormat } from 'src/obsidian/events/workspace/helpers/maybe-get-document-format';

export const getOrDetectDocumentFormat = (
    view: LineageView,
    body: string,
): LineageDocumentFormat => {
    const format = maybeGetDocumentFormat(view);
    if (format) {
        return format;
    }

    const detected = detectDocumentFormat(body);
    if (detected) return detected;

    return view.plugin.settings.getValue().general.defaultDocumentFormat;
};
