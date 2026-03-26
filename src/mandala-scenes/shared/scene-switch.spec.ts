import { describe, expect, it } from 'vitest';
import {
    createSceneCommitSnapshot,
    hasPendingSceneSwitch,
} from 'src/mandala-scenes/shared/scene-switch';
import type { SceneProjection } from 'src/mandala-scenes/shared/scene-projection';

const defaultProjection = (
    viewKind: '3x3' | '9x9' | 'nx9',
    variant: 'default' | 'day-plan' | 'week-7x9' = 'default',
): SceneProjection =>
    viewKind === '3x3'
        ? {
              sceneKey: { viewKind, variant },
              rendererKind: '3x3-layout',
              props: {
                  cells: [],
                  theme: '1',
                  animateSwap: false,
                  show3x3SubgridNavButtons: false,
                  hasOpenOverlayModal: false,
                  dayPlanEnabled: false,
                  showDayPlanTodayButton: false,
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
                  rendererKind: 'week-layout',
                  props: {
                      rows: [],
                      desktopCells: [],
                      mobileCells: [],
                      compactMode: false,
                      sectionColors: {},
                      sectionColorOpacity: 60,
                      backgroundMode: 'custom',
                      showDetailSidebar: false,
                      whiteThemeMode: false,
                  },
              }
            : {
                  sceneKey: { viewKind, variant },
                  rendererKind: 'nx9-layout',
                  props: {
                      themeSnapshot: {
                          themeTone: 'light',
                          themeUnderlayColor: '#fff',
                          activeThemeUnderlayColor: '#eee',
                      },
                      rowsPerPage: 5,
                      sectionColors: {},
                      sectionColorOpacity: 60,
                      backgroundMode: 'custom',
                      showDetailSidebar: false,
                      whiteThemeMode: false,
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
            renderedThreeByThreeProps: null,
        });

        const snapshot = createSceneCommitSnapshot(defaultProjection('3x3'));
        expect(snapshot.committedSceneKey).toEqual({
            viewKind: '3x3',
            variant: 'default',
        });
        expect(snapshot.renderedThreeByThreeProps?.theme).toBe('1');
    });
});
