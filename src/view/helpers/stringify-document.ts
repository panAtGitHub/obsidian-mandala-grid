import { MandalaGridDocument } from 'src/stores/document/document-state-type';
import { MandalaGridDocumentFormat } from 'src/stores/settings/settings-type';
import { columnsToJson } from 'src/lib/data-conversion/x-to-json/columns-to-json';
import { jsonToHtmlComment } from 'src/lib/data-conversion/json-to-x/json-to-html-comment';

export const stringifyDocument = (
    document: MandalaGridDocument,
    _format: MandalaGridDocumentFormat,
) => {
    const json = columnsToJson(document.columns, document.content);
    return jsonToHtmlComment(json);
};
