import { describe, expect, it } from 'vitest';
import {
    buildMandalaTopologyIndex,
    getSectionCore,
    getSectionNodeId,
    getTopologyEntry,
} from 'src/mandala-display/logic/mandala-topology';

describe('mandala-topology', () => {
    it('builds ordered entries and core sections', () => {
        const topology = buildMandalaTopologyIndex({
            '1.2': 'node-12',
            '2': 'node-2',
            '1': 'node-1',
            '1.2.3': 'node-123',
            '1.1': undefined,
        });

        expect(topology.orderedSections).toEqual(['1', '1.1', '1.2', '1.2.3', '2']);
        expect(topology.sectionsWithNode).toEqual(['1', '1.2', '1.2.3', '2']);
        expect(topology.coreSections).toEqual(['1', '2']);
        expect(topology.sectionByNodeId['node-123']).toBe('1.2.3');
    });

    it('exposes parent, core, slot and children relations', () => {
        const topology = buildMandalaTopologyIndex({
            '3': 'node-3',
            '3.4': 'node-34',
            '3.4.5': 'node-345',
        });

        expect(getSectionCore('3.4.5')).toBe('3');
        expect(getTopologyEntry(topology, '3.4.5')).toMatchObject({
            depth: 3,
            parentSection: '3.4',
            coreSection: '3',
            slot: 4,
        });
        expect(getSectionNodeId(topology, '3.4')).toBe('node-34');
        expect(topology.childrenBySection['3']).toEqual(['3.4']);
        expect(topology.childrenBySection['3.4']).toEqual(['3.4.5']);
    });

    it('reuses the cached topology for the same section map reference', () => {
        const sectionIdMap = {
            '1': 'node-1',
            '1.1': 'node-1-1',
        };

        const first = buildMandalaTopologyIndex(sectionIdMap);
        const second = buildMandalaTopologyIndex(sectionIdMap);

        expect(second).toBe(first);
    });

    it('keeps multiple topology entries hot across alternating section maps', () => {
        const firstMap = {
            '1': 'node-1',
            '1.1': 'node-1-1',
        };
        const secondMap = {
            '2': 'node-2',
            '2.1': 'node-2-1',
        };

        const first = buildMandalaTopologyIndex(firstMap);
        buildMandalaTopologyIndex(secondMap);
        const revisited = buildMandalaTopologyIndex(firstMap);

        expect(revisited).toBe(first);
    });

    it('evicts the oldest topology entry after the cache exceeds eight section maps', () => {
        const firstMap = {
            '1': 'node-1',
        };
        const first = buildMandalaTopologyIndex(firstMap);

        for (let index = 2; index <= 9; index += 1) {
            buildMandalaTopologyIndex({
                [String(index)]: `node-${index}`,
            });
        }

        const revisited = buildMandalaTopologyIndex(firstMap);
        expect(revisited).not.toBe(first);
    });
});
