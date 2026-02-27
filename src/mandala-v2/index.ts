import { buildMandalaDocumentV2 } from 'src/mandala-v2/build-state';
import { parseSections } from 'src/mandala-v2/parse-sections';
import { serializeSections } from 'src/mandala-v2/serialize-sections';
import { validateSectionsStructure } from 'src/mandala-v2/validate-structure';
import { MandalaEngineV2 } from 'src/mandala-v2/types';

export const mandalaEngineV2: MandalaEngineV2 = {
    parse: parseSections,
    validate: validateSectionsStructure,
    buildState: buildMandalaDocumentV2,
    serialize: serializeSections,
};

export { buildMandalaDocumentV2 } from 'src/mandala-v2/build-state';
export { parseSections } from 'src/mandala-v2/parse-sections';
export {
    compareSectionIds,
    serializeSections,
    serializeSectionsFromDocument,
} from 'src/mandala-v2/serialize-sections';
export { validateSectionsStructure } from 'src/mandala-v2/validate-structure';
export * from 'src/mandala-v2/types';
