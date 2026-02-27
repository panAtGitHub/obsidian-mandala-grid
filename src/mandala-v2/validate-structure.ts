import {
    MandalaSectionValidationError,
    ParsedMandalaSection,
} from 'src/mandala-v2/types';

const parseParts = (sectionId: string) => sectionId.split('.').map(Number);

const isValidRootIndex = (index: number) =>
    Number.isInteger(index) && index >= 1;

const isValidSlotIndex = (index: number) =>
    Number.isInteger(index) && index >= 1 && index <= 8;

const getParentId = (sectionId: string) =>
    sectionId.includes('.') ? sectionId.slice(0, sectionId.lastIndexOf('.')) : '';

export const validateSectionsStructure = (
    sections: ParsedMandalaSection[],
): MandalaSectionValidationError[] => {
    const errors: MandalaSectionValidationError[] = [];
    const seen = new Set<string>();
    const sectionIds = new Set(sections.map((section) => section.id));

    for (const section of sections) {
        const id = section.id;
        if (seen.has(id)) {
            errors.push({ sectionId: id, reason: 'Duplicate section marker' });
            continue;
        }
        seen.add(id);

        const parts = parseParts(id);
        if (parts.length === 0 || parts.some((part) => Number.isNaN(part))) {
            errors.push({ sectionId: id, reason: 'Section contains non-numeric parts' });
            continue;
        }

        const root = parts[0];
        if (!isValidRootIndex(root)) {
            errors.push({ sectionId: id, reason: 'Root index must be >= 1' });
        }

        for (let i = 1; i < parts.length; i += 1) {
            if (!isValidSlotIndex(parts[i])) {
                errors.push({
                    sectionId: id,
                    reason: 'Subgrid slot index must be within 1..8',
                });
                break;
            }
        }

        if (parts.length > 1) {
            const parentId = getParentId(id);
            if (!sectionIds.has(parentId)) {
                errors.push({
                    sectionId: id,
                    reason: `Missing parent section "${parentId}"`,
                });
            }
        }
    }

    const rootParts = sections
        .map((section) => parseParts(section.id))
        .filter((parts) => parts.length === 1)
        .map((parts) => parts[0])
        .sort((a, b) => a - b);
    if (rootParts.length > 0) {
        const max = rootParts[rootParts.length - 1];
        const roots = new Set(rootParts);
        for (let i = 1; i <= max; i += 1) {
            if (!roots.has(i)) {
                errors.push({
                    sectionId: String(i),
                    reason: 'Root sections must be continuous from 1..N',
                });
            }
        }
    }

    return errors;
};
