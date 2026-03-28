import { describe, expect, it } from 'vitest';
import {
    createSceneCommitSnapshot,
    hasPendingSceneSwitch,
} from 'src/mandala-scenes/shared/scene-switch';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';
import type { SceneProjection } from 'src/mandala-scenes/shared/scene-projection';

const threeByThreeGridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
});

const nx9GridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
});

const defaultProjection = (
    viewKind: '3x3' | '9x9' | 'nx9',
    variant: 'default' | 'day-plan' | 'week-7x9' = 'default',
): SceneProjection =>
    viewKind === '3x3'
        ? variant === 'day-plan'
            ? {
                  sceneKey: { viewKind, variant },
                  rendererKind: 'card-scene',
                  props: {
                      layoutKind: '3x3-day-plan',
                      output: {
                          descriptors: [],
                      },
                      layoutMeta: {
                          gridStyle: threeByThreeGridStyle,
                          theme: '1',
                          animateSwap: false,
                          show3x3SubgridNavButtons: false,
                          hasOpenOverlayModal: false,
                          dayPlanEnabled: true,
                          showDayPlanTodayButton: true,
                          dayPlanTodayTargetSection: null,
                          activeCoreSection: null,
                          todayButtonLabel: '',
                          enterSubgridFromButton: () => undefined,
                          exitSubgridFromButton: () => undefined,
                          focusDayPlanTodayFromButton: () => undefined,
                          getUpButtonLabel: () => '',
                          getDownButtonLabel: () => '',
                          onMobileCardDoubleClick: null,
                      },
                  },
              }
            : {
                  sceneKey: { viewKind, variant },
                  rendererKind: 'card-scene',
                  props: {
                      layoutKind: '3x3',
                      output: {
                          descriptors: [],
                      },
                      layoutMeta: {
                          gridStyle: threeByThreeGridStyle,
                          theme: '1',
                          animateSwap: false,
                          show3x3SubgridNavButtons: false,
                          hasOpenOverlayModal: false,
                          enterSubgridFromButton: () => undefined,
                          exitSubgridFromButton: () => undefined,
                          getUpButtonLabel: () => '',
                          getDownButtonLabel: () => '',
                          onMobileCardDoubleClick: null,
                      },
                  },
              }
        : viewKind === '9x9'
          ? {
                sceneKey: { viewKind, variant },
                rendererKind: '9x9-layout',
                props: {},
            }
          : variant === 'week-7x9'
            ? {
                  sceneKey: { viewKind, variant },
                  rendererKind: 'card-scene',
                  props: {
                      layoutKind: 'nx9-week-7x9',
                      output: {
                          descriptors: [],
                      },
                      layoutMeta: {
                          displaySnapshot: {
                              sectionColors: {},
                              sectionColorOpacity: 60,
                              backgroundMode: 'custom',
                              showDetailSidebar: false,
                              whiteThemeMode: false,
                          },
                          gridStyle: nx9GridStyle,
                          themeSnapshot: {
                              themeTone: 'light',
                              themeUnderlayColor: '#fff',
                              activeThemeUnderlayColor: '#eee',
                          },
                      },
                  },
              }
            : {
                  sceneKey: { viewKind, variant },
                  rendererKind: 'card-scene',
                  props: {
                      layoutKind: 'nx9',
                      output: {},
                      layoutMeta: {
                          documentSnapshot: {
                              revision: 1,
                              contentRevision: 2,
                              sectionIdMap: { '1': 'node-1' },
                              documentContent: {
                                  'node-1': { content: 'hello' },
                              },
                          },
                          themeSnapshot: {
                              themeTone: 'light',
                              themeUnderlayColor: '#fff',
                              activeThemeUnderlayColor: '#eee',
                          },
                          gridStyle: nx9GridStyle,
                          rowsPerPage: 5,
                          displaySnapshot: {
                              sectionColors: {},
                              sectionColorOpacity: 60,
                              backgroundMode: 'custom',
                              showDetailSidebar: false,
                              whiteThemeMode: false,
                          },
                          interactionSnapshot: {
                              activeNodeId: 'node-1',
                              editingState: {
                                  activeNodeId: 'node-1',
                                  isInSidebar: false,
                              },
                              selectedNodes: new Set(['node-1']),
                              showDetailSidebar: false,
                              selectedStamp: 'node-1',
                              pinnedSections: new Set(['1']),
                              pinnedStamp: '1',
                          },
                          activeSection: '1.2',
                          activeCoreSection: '1',
                          activeCell: { row: 1, col: 2, page: 0 },
                      },
                  },
              };

describe('scene-switch', () => {
    it('detects when a scene key change requires a staged switch', () => {
        expect(
            hasPendingSceneSwitch(
                defaultProjection('3x3'),
                defaultProjection('3x3', 'day-plan'),
            ),
        ).toBe(true);
        expect(
            hasPendingSceneSwitch(
                defaultProjection('3x3'),
                defaultProjection('3x3'),
            ),
        ).toBe(false);
    });

    it('derives the committed scene snapshot from the rendered projection', () => {
        expect(createSceneCommitSnapshot(defaultProjection('9x9'))).toEqual({
            committedSceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
        });

        const snapshot = createSceneCommitSnapshot(defaultProjection('3x3'));
        expect(snapshot.committedSceneKey).toEqual({
            viewKind: '3x3',
            variant: 'default',
        });
        expect(snapshot.committedSceneKey).toEqual({
            viewKind: '3x3',
            variant: 'default',
        });
    });
});
