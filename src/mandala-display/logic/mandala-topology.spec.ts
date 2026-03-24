import { describe, expect, it } from 'vitest';
import {
    buildMandalaTopologyIndex,
    getSectionCore,
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
        expect(topology.childrenBySection['3']).toEqual(['3.4']);
        expect(topology.childrenBySection['3.4']).toEqual(['3.4.5']);
    });
});
