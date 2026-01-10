import { id } from 'src/helpers/id';
import { LineageDocument } from 'src/stores/document/document-state-type';
import { stringifyDocument } from 'src/view/helpers/stringify-document';

const createMandalaDocument = (): LineageDocument => {
    const rootParentId = id.rootNode();
    const rootNodes = Array.from({ length: 9 }, () => id.node());

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

    const content: LineageDocument['content'] = {};
    for (const nodeId of rootNodes) {
        content[nodeId] = { content: '' };
    }

    // section "1" (rootNodes[0]) 是中心主题，不展开
    for (let section = 2; section <= 9; section++) {
        const parentNodeId = rootNodes[section - 1];
        const children = Array.from({ length: 8 }, () => id.node());
        columns[1].groups.push({
            parentId: parentNodeId,
            nodes: children,
        });
        for (const nodeId of children) {
            content[nodeId] = { content: '' };
        }
    }

    return { columns, content };
};

export const createMandalaMarkdownTemplate = () => {
    const frontmatter = `---\nmandala: true\n---\n`;
    const document = createMandalaDocument();
    return frontmatter + stringifyDocument(document, 'sections');
};

