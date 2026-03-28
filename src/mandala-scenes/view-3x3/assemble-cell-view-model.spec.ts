import { describe, expect, it } from 'vitest';
import { buildMandalaTopologyIndex } from 'src/mandala-display/logic/mandala-topology';
import { getMandalaLayoutById } from 'src/mandala-display/logic/mandala-grid';
import { build3x3CardCellDescriptors } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';

describe('3x3/assemble-cell-view-model', () => {
    it('builds reusable card cell descriptors for a 3x3 theme', () => {
        const topology = buildMandalaTopologyIndex({
            '1': 'node-1',
            '1.1': 'node-1-1',
            '1.2': 'node-1-2',
        });
        const descriptors = build3x3CardCellDescriptors({
            theme: '1',
            layout: getMandalaLayoutById(null, []),
            topology,
            displaySnapshot: {
                sectionColors: { '1.1': 'red' },
                sectionColorOpacity: 100,
                backgroundMode: 'none',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
            displayPolicy: resolveCardGridStyle({
                whiteThemeMode: false,
                selectionStyle: 'node-active',
            }).cellDisplayPolicy,
        });

        expect(descriptors[0]).toMatchObject({
            seed: {
                frame: {
                    key: '1.1',
                    section: '1.1',
                    nodeId: 'node-1-1',
                },
                descriptor: {
                    metaAccentColor: 'red',
                    contentEnabled: true,
                },
            },
            extra: {
                index: 0,
                isCenter: false,
                isTopEdge: true,
                isLeftEdge: true,
            },
        });
        expect(descriptors[4]).toMatchObject({
            seed: {
                frame: {
                    key: '1',
                    section: '1',
                    nodeId: 'node-1',
                },
            },
            extra: {
                index: 4,
                isCenter: true,
                isTopEdge: false,
                isBottomEdge: false,
            },
        });
    });
});
