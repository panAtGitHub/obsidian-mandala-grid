import {
    buildMandalaDocumentV2,
    parseSections,
    validateSectionsStructure,
} from 'src/mandala-v2';
import { buildSubtreeNonEmptyCountBySection } from 'src/stores/document/reducers/mandala/mandala-slot-authority';
import {
    DocumentState,
    MandalaGridDocument,
} from 'src/stores/document/document-state-type';
import { SavedDocument } from 'src/stores/document/document-store-actions';
import invariant from 'tiny-invariant';

export type LoadDocumentAction = {
    type: 'document/file/load-from-disk';
    payload: {
        document: SavedDocument;
        activeSection: string | null;
        __test_document__?: MandalaGridDocument;
    };
};

export const loadDocumentFromFile = (
    state: DocumentState,
    action: LoadDocumentAction,
) => {
    state.meta.isMandala = true;

    const parseStartMs = performance.now();
    const parsed = parseSections(action.payload.document.data);
    const parseMs = performance.now() - parseStartMs;
    if (parsed.sections.length === 0) {
        throw new Error(
            'MandalaGrid requires <!--section: ...--> markers in document body',
        );
    }

    const validationErrors = validateSectionsStructure(parsed.sections);
    if (validationErrors.length > 0) {
        const first = validationErrors[0];
        throw new Error(
            `Invalid section structure at "${first.sectionId}": ${first.reason}`,
        );
    }

    const buildStartMs = performance.now();
    const documentV2 = buildMandalaDocumentV2({
        sections: parsed.sections,
    });
    const buildMs = performance.now() - buildStartMs;

    state.document.columns = documentV2.columns;
    state.document.content = documentV2.content;
    state.sections.id_section = documentV2.nodeToSection;
    state.sections.section_id = documentV2.sectionToNode;
    state.meta.mandalaV2 = {
        enabled: true,
        revision: state.meta.mandalaV2.revision + 1,
        rootGroupId: documentV2.rootGroupId,
        orderedSections: documentV2.orderedSections,
        parentToChildrenSlots: documentV2.parentToChildrenSlots,
        subtreeNonEmptyCountBySection: buildSubtreeNonEmptyCountBySection(
            documentV2.content,
            {
                id_section: documentV2.nodeToSection,
                section_id: documentV2.sectionToNode,
            },
            documentV2.orderedSections,
        ),
        loadMetrics: {
            bytes: parsed.sourceBytes,
            sectionsCount: parsed.sections.length,
            parseMs: Number(parseMs.toFixed(2)),
            buildMs: Number(buildMs.toFixed(2)),
        },
    };

    if (action.type === 'document/file/load-from-disk')
        state.file.frontmatter = action.payload.document.frontmatter;
    const activeNode =
        (action.payload.activeSection
            ? state.sections.section_id[action.payload.activeSection]
            : null) ??
        state.sections.section_id['1'] ??
        state.sections.section_id[documentV2.orderedSections[0]];
    invariant(activeNode);

    return activeNode;
};
