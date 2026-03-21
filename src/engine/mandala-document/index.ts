import { buildMandalaDocumentV2 } from 'src/engine/mandala-document/build-state';
import { parseSections } from 'src/engine/mandala-document/parse-sections';
import { serializeSections } from 'src/engine/mandala-document/serialize-sections';
import { validateSectionsStructure } from 'src/engine/mandala-document/validate-structure';
import { MandalaEngineV2 } from 'src/engine/mandala-document/types';

export const mandalaEngineV2: MandalaEngineV2 = {
    parse: parseSections,
    validate: validateSectionsStructure,
    buildState: buildMandalaDocumentV2,
    serialize: serializeSections,
};

export { buildMandalaDocumentV2 } from 'src/engine/mandala-document/build-state';
export { parseSections } from 'src/engine/mandala-document/parse-sections';
export { prepareSaveSections } from 'src/engine/mandala-document/prepare-save-sections';
export {
    compareSectionIds,
    serializeSections,
    serializeSectionsFromDocument,
} from 'src/engine/mandala-document/serialize-sections';
export { validateSectionsStructure } from 'src/engine/mandala-document/validate-structure';
export * from 'src/engine/mandala-document/types';
