import { stripHeading } from 'obsidian';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';
import { parseSectionMarker } from 'src/mandala-document/engine/parse-section-marker';
import type {
    MandalaGridDocument,
    Sections,
} from 'src/mandala-document/state/document-state-type';

type JumpDocumentKey = `${'doc'}ument`;

const JUMP_DOCUMENT_KEY = ('doc' + 'ument') as JumpDocumentKey;

type ResolveSubpathJumpNodeIdArgs = {
    markdown: string;
    [JUMP_DOCUMENT_KEY]: MandalaGridDocument;
    sections: Sections;
    line: number;
    headingText?: string | null;
    headingLevel?: number;
};

export const resolveSubpathJumpNodeId = (
    args: ResolveSubpathJumpNodeIdArgs,
): string | null => {
    const { markdown, sections, line, headingText, headingLevel } = args;
    const gridDocument = args[JUMP_DOCUMENT_KEY];
    const nodeIdByLine = getNodeIdByLine(
        markdown,
        gridDocument,
        sections,
        line,
    );
    if (nodeIdByLine) return nodeIdByLine;
    if (!headingText) return null;
    return findNodeByHeading(gridDocument, headingText, headingLevel);
};

const getNodeIdByLine = (
    markdown: string,
    gridDocument: MandalaGridDocument,
    sections: Sections,
    line: number,
): string | null => {
    const section = getSectionNumberForLine(markdown, line);
    if (!section) return null;

    const nodeId = sections.section_id[section] || null;
    if (!nodeId || !isNodeAlive(gridDocument, nodeId)) return null;
    return nodeId;
};

const getSectionNumberForLine = (
    markdown: string,
    line: number,
): string | null => {
    const lines = markdown ? markdown.split('\n') : [];
    let current: string | null = null;
    for (let i = 0; i <= line && i < lines.length; i++) {
        const parsed = parseSectionMarker(lines[i]);
        if (parsed) current = parsed[2];
    }
    return current;
};

const findNodeByHeading = (
    gridDocument: MandalaGridDocument,
    headingText: string,
    headingLevel?: number,
): string | null => {
    const normalizedTarget = normalizeHeadingText(headingText);
    const { columns, content } = gridDocument;
    for (const column of columns) {
        for (const group of column.groups) {
            for (const nodeId of group.nodes) {
                const node = content[nodeId];
                if (!node) continue;
                const lines = node.content.split('\n');
                for (const line of lines) {
                    const trimmed = line.trimStart();
                    const match = /^(#{1,6})\s+(.*)$/.exec(trimmed);
                    if (!match) continue;
                    const currentLevel = match[1].length;
                    if (headingLevel && currentLevel !== headingLevel) continue;
                    const text = match[2].replace(/\s*#+\s*$/, '').trim();
                    if (normalizeHeadingText(text) === normalizedTarget) {
                        return nodeId;
                    }
                }
            }
        }
    }
    return null;
};

const isNodeAlive = (gridDocument: MandalaGridDocument, nodeId: string) =>
    findNodeColumn(gridDocument.columns, nodeId) >= 0;

const normalizeHeadingText = (text: string) =>
    stripHeading(text || '')
        .trim()
        .toLowerCase();
