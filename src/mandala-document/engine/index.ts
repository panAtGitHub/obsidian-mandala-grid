import { buildMandalaDocumentV2 } from 'src/mandala-document/engine/build-state';
import { parseSections } from 'src/mandala-document/engine/parse-sections';
import { serializeSections } from 'src/mandala-document/engine/serialize-sections';
import { validateSectionsStructure } from 'src/mandala-document/engine/validate-structure';
import { MandalaEngineV2 } from 'src/mandala-document/engine/types';

export const mandalaEngineV2: MandalaEngineV2 = {
    parse: parseSections,
    validate: validateSectionsStructure,
    buildState: buildMandalaDocumentV2,
    serialize: serializeSections,
};

export { buildMandalaDocumentV2 } from 'src/mandala-document/engine/build-state';
export { parseSections } from 'src/mandala-document/engine/parse-sections';
export { prepareSaveSections } from 'src/mandala-document/engine/prepare-save-sections';
export {
    compareSectionIds,
    serializeSections,
    serializeSectionsFromDocument,
} from 'src/mandala-document/engine/serialize-sections';
export { validateSectionsStructure } from 'src/mandala-document/engine/validate-structure';
export * from 'src/mandala-document/engine/types';
