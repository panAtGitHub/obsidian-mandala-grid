import { describe, expect, it } from 'vitest';
import { resolveSceneCompatibilityActions } from 'src/mandala-scenes/shared/scene-compatibility-logic';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';

const createDocumentState = (
    frontmatter = '',
    isMandala = true,
) =>
    ({
        file: { frontmatter },
        meta: { isMandala },
    }) as unknown as DocumentState;

describe('scene-compatibility-logic', () => {
    it('requires compatible mode when week variant is not allowed', () => {
        const actions = resolveSceneCompatibilityActions({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            dayPlanEnabled: false,
            subgridTheme: '1',
            sectionToNodeId: { '1': 'node-1' },
            documentState: createDocumentState('mandala: true\n'),
            weekPlanEnabled: false,
            isMobile: false,
        });

        expect(actions.shouldEnsureCompatibleMode).toBe(true);
        expect(actions.shouldEnterDefaultSubgrid).toBe(false);
    });

    it('requests default subgrid when 3x3 subgrid target no longer exists', () => {
        const actions = resolveSceneCompatibilityActions({
            sceneKey: {
                viewKind: '3x3',
                variant: 'default',
            },
            dayPlanEnabled: false,
            subgridTheme: '2',
            sectionToNodeId: {},
            documentState: createDocumentState('mandala: true\n'),
            weekPlanEnabled: true,
            isMobile: false,
        });

        expect(actions.shouldEnterDefaultSubgrid).toBe(true);
        expect(actions.shouldEnsureCompatibleMode).toBe(false);
    });
});
