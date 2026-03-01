import { describe, expect, it } from 'vitest';
import { resolveSubpathJumpNodeId } from 'src/view/helpers/resolve-subpath-jump-node-id';

describe('resolveSubpathJumpNodeId', () => {
    it('prefers the exact line match when duplicate headings exist', () => {
        const actual = resolveSubpathJumpNodeId({
            markdown: [
                '<!-- section: 1 -->',
                '# 2026-02-28',
                '## 三件事',
                '<!-- section: 2 -->',
                '# 2026-03-01',
                '## 三件事',
            ].join('\n'),
            document: {
                columns: [
                    {
                        id: 'column-1',
                        groups: [{ parentId: '', nodes: ['node-1', 'node-2'] }],
                    },
                ],
                content: {
                    'node-1': {
                        content: ['# 2026-02-28', '## 三件事'].join('\n'),
                    },
                    'node-2': {
                        content: ['# 2026-03-01', '## 三件事'].join('\n'),
                    },
                },
            },
            sections: {
                section_id: {
                    '1': 'node-1',
                    '2': 'node-2',
                },
                id_section: {
                    'node-1': '1',
                    'node-2': '2',
                },
            },
            line: 5,
            headingText: '三件事',
            headingLevel: 2,
        });

        expect(actual).toBe('node-2');
    });
});
