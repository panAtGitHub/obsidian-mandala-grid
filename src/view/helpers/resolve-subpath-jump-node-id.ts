import { stripHeading } from 'obsidian';
import { findNodeColumn } from 'src/lib/tree-utils/find/find-node-column';
import { parseSectionMarker } from 'src/engine/mandala-document/parse-section-marker';
import type {
    MandalaGridDocument,
    Sections,
} from 'src/stores/document/document-state-type';

type ResolveSubpathJumpNodeIdArgs = {
    markdown: string;
    document: MandalaGridDocument;
    sections: Sections;
    line: number;
    headingText?: string | null;
    headingLevel?: number;
};

export const resolveSubpathJumpNodeId = ({
    markdown,
    document,
    sections,
    line,
    headingText,
    headingLevel,
}: ResolveSubpathJumpNodeIdArgs): string | null => {
    const nodeIdByLine = getNodeIdByLine(markdown, document, sections, line);
    if (nodeIdByLine) return nodeIdByLine;
    if (!headingText) return null;
    return findNodeByHeading(document, headingText, headingLevel);
};

const getNodeIdByLine = (
    markdown: string,
    document: MandalaGridDocument,
    sections: Sections,
    line: number,
): string | null => {
    const section = getSectionNumberForLine(markdown, line);
    if (!section) return null;

    const nodeId = sections.section_id[section] || null;
    if (!nodeId || !isNodeAlive(document, nodeId)) return null;
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
    document: MandalaGridDocument,
    headingText: string,
    headingLevel?: number,
): string | null => {
    const normalizedTarget = normalizeHeadingText(headingText);
    const { columns, content } = document;
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

const isNodeAlive = (document: MandalaGridDocument, nodeId: string) =>
    findNodeColumn(document.columns, nodeId) >= 0;

const normalizeHeadingText = (text: string) =>
    stripHeading(text || '').trim().toLowerCase();
