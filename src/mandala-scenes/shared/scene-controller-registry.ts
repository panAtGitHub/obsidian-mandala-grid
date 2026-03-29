import type {
    SceneController,
    SceneRootContext,
} from 'src/mandala-scenes/shared/scene-projection';
import { createThreeByThreeControllerCore } from 'src/mandala-scenes/view-3x3/controller';
import { createThreeByThreeController } from 'src/mandala-scenes/view-3x3/controller';
import { createThreeByThreeDayPlanController } from 'src/mandala-scenes/view-3x3-day-plan/controller';
import { createNx9Controller } from 'src/mandala-scenes/view-nx9/controller';
import { createNx9WeekController } from 'src/mandala-scenes/view-nx9-week-7x9/controller';
import { createNineByNineController } from 'src/mandala-scenes/view-9x9/controller';
import type { MandalaView } from 'src/view/view';

export const createSceneControllerRegistry = (view: MandalaView) => {
    const sharedThreeByThreeCore = createThreeByThreeControllerCore(view);
    const controllers = {
        threeByThree: createThreeByThreeController(view, sharedThreeByThreeCore),
        threeByThreeDayPlan: createThreeByThreeDayPlanController(
            view,
            sharedThreeByThreeCore,
        ),
        nx9: createNx9Controller(),
        week: createNx9WeekController(),
        nineByNine: createNineByNineController(),
    } as const;

    const resolveSceneController = (context: SceneRootContext): SceneController =>
        context.sceneKey.viewKind === '3x3' &&
        context.sceneKey.variant === 'day-plan'
            ? controllers.threeByThreeDayPlan
            : context.sceneKey.viewKind === '3x3'
              ? controllers.threeByThree
              : context.sceneKey.viewKind === 'nx9' &&
                  context.sceneKey.variant === 'week-7x9'
                ? controllers.week
                : context.sceneKey.viewKind === 'nx9'
                  ? controllers.nx9
                  : controllers.nineByNine;

    return {
        resolve: (context: SceneRootContext) =>
            resolveSceneController(context).resolveProjection(context),
    };
};
