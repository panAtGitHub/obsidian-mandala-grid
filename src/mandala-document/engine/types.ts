import { Column, Content } from 'src/mandala-document/state/document-state-type';

export type MandalaSectionId = string;

export const MANDALA_SECTION_ID_RE = /^\d+(?:\.[1-8])*$/;

export type ParsedMandalaSection = {
    id: MandalaSectionId;
    content: string;
    markerStart: number;
    markerEnd: number;
};

export type ParsedMandalaSections = {
    sections: ParsedMandalaSection[];
    sourceBytes: number;
};

export type MandalaLoadMetrics = {
    bytes: number;
    sectionsCount: number;
    parseMs: number;
    buildMs: number;
};

export type MandalaSectionValidationError = {
    sectionId: string;
    reason: string;
};

export type MandalaDocumentV2 = {
    columns: Column[];
    content: Content;
    contentBySection: Record<MandalaSectionId, string>;
    sectionToNode: Record<MandalaSectionId, string>;
    nodeToSection: Record<string, MandalaSectionId>;
    parentToChildrenSlots: Record<MandalaSectionId, Partial<Record<number, MandalaSectionId>>>;
    orderedSections: MandalaSectionId[];
    rootGroupId: string;
};

export type BuildMandalaDocumentV2Props = {
    sections: ParsedMandalaSection[];
};

export type MandalaEngineV2 = {
    parse: (markdown: string) => ParsedMandalaSections;
    validate: (sections: ParsedMandalaSection[]) => MandalaSectionValidationError[];
    buildState: (props: BuildMandalaDocumentV2Props) => MandalaDocumentV2;
    serialize: (sections: {
        sectionId: MandalaSectionId;
        content: string;
    }[]) => string;
};
