import { id } from 'src/helpers/id';
import { MandalaGridDocument } from 'src/stores/document/document-state-type';
import { stringifyDocument } from 'src/view/helpers/stringify-document';

const createMandalaDocument = (): MandalaGridDocument => {
    const rootParentId = id.rootNode();
    const rootNodes = [id.node()];

    const columns = [
        {
            id: id.column(),
            groups: [
                {
                    parentId: rootParentId,
                    nodes: [...rootNodes],
                },
            ],
        },
        {
            id: id.column(),
            groups: [],
        },
    ];

    const content: MandalaGridDocument['content'] = {};
    for (const nodeId of rootNodes) {
        content[nodeId] = { content: '' };
    }

    const children = Array.from({ length: 8 }, () => id.node());
    columns[1].groups.push({
        parentId: rootNodes[0],
        nodes: children,
    });
    for (const nodeId of children) {
        content[nodeId] = { content: '' };
    }

    return { columns, content };
};

export const createMandalaMarkdownTemplate = () => {
    const frontmatter = `---\nmandala: true\n---\n`;
    const document = createMandalaDocument();
    return frontmatter + stringifyDocument(document, 'sections');
};
