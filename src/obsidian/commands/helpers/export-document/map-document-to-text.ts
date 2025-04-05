import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { htmlCommentToJson } from 'src/lib/data-conversion/x-to-json/html-comment-to-json';
import { jsonToText } from 'src/lib/data-conversion/json-to-x/json-to-text';
import { LineageDocumentFormat } from 'src/stores/settings/settings-type';
import { outlineToJson } from 'src/lib/data-conversion/x-to-json/outline-to-json';
import { htmlElementToJson } from 'src/lib/data-conversion/x-to-json/html-element-to-json';

export const mapDocumentToText = (
    fileData: string,
    format: LineageDocumentFormat,
) => {
    const { data, frontmatter } = extractFrontmatter(fileData);
    const tree =
        format === 'outline'
            ? outlineToJson(data)
            : format === 'html-element'
              ? htmlElementToJson(data)
              : htmlCommentToJson(data);
    /* if (tree.length < 2 && tree[0].children.length == 0) {
        throw new Error(`File ${basename} does not appear to be a tree`);
    }*/
    return (frontmatter ? frontmatter + '\n' : '') + jsonToText(tree);
};
