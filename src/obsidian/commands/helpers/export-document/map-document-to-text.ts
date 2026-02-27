import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { htmlCommentToJson } from 'src/lib/data-conversion/x-to-json/html-comment-to-json';
import { jsonToText } from 'src/lib/data-conversion/json-to-x/json-to-text';

export const mapDocumentToText = (fileData: string) => {
    const { body, frontmatter } = extractFrontmatter(fileData);
    const tree = htmlCommentToJson(body);
    /* if (tree.length < 2 && tree[0].children.length == 0) {
        throw new Error(`File ${basename} does not appear to be a tree`);
    }*/
    return (frontmatter ? frontmatter + '\n' : '') + jsonToText(tree);
};
