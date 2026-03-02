import { describe, expect, it } from 'vitest';
import { filterStaleDocuments } from './filter-stale-documents';
import {
    DocumentPreferences,
    Settings,
} from 'src/stores/settings/settings-type';

type PartialSettings = Pick<Settings, 'documents'>;
const sample: DocumentPreferences = {
    viewType: 'mandala-grid',
    activeSection: null,
    outline: null,
    mandalaView: {
        gridOrientation: null,
        selectedLayoutId: null,
        lastActiveSection: null,
        subgridTheme: null,
        showDetailSidebarDesktop: null,
        showDetailSidebarMobile: null,
        pinnedSections: [],
        sectionColors: {},
    },
};
describe('filterStaleDocuments', () => {
    it('should return 0 if allFiles is empty', () => {
        const settings: PartialSettings = {
            documents: {},
        };
        const allFiles: Set<string> = new Set();
        const result = filterStaleDocuments(settings, allFiles);
        expect(result).toBe(0);
    });

    it('should remove stale documents and return the count of deleted documents', () => {
        const settings: PartialSettings = {
            documents: {
                path1: sample,
                path2: sample,
                path3: sample,
            },
        };
        const allFiles: Set<string> = new Set(['path1', 'path3']);
        const result = filterStaleDocuments(settings, allFiles);
        expect(result).toBe(1);
        expect(settings).toEqual({
            documents: {
                path1: sample,
                path3: sample,
            },
        });
    });

    it('should not delete any documents if all paths exist in allFiles', () => {
        const settings: PartialSettings = {
            documents: {
                path1: sample,
                path2: sample,
            },
        };
        const allFiles: Set<string> = new Set(['path1', 'path2']);
        const result = filterStaleDocuments(settings, allFiles);
        expect(result).toBe(0);
        expect(settings).toEqual({
            documents: {
                path1: sample,
                path2: sample,
            },
        });
    });

    it('should delete all documents if none of the paths exist in allFiles', () => {
        const settings: PartialSettings = {
            documents: {
                path1: sample,
                path2: sample,
            },
        };
        const allFiles: Set<string> = new Set(['path3']);
        const result = filterStaleDocuments(settings, allFiles);
        expect(result).toBe(2);
        expect(settings).toEqual({
            documents: {},
        });
    });
});
