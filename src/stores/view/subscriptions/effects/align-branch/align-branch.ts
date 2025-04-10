import { LineageView } from 'src/view/view';
import { delay } from 'src/helpers/delay';
import { delayAlign } from 'src/stores/view/subscriptions/effects/align-branch/helpers/delay-align';
import { ActiveBranch } from 'src/stores/view/default-view-state';
import { createAlignBranchActions } from 'src/stores/view/subscriptions/effects/align-branch/create-align-branch-actions/create-align-branch-actions';
import { runAlignBranchActions } from 'src/stores/view/subscriptions/effects/align-branch/run-align-branch-actions/run-align-branch-actions';
import { skipAlign } from 'src/stores/view/subscriptions/effects/align-branch/helpers/skip-align';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import {
    ViewDocumentAction,
    ViewStoreAction,
} from 'src/stores/view/view-store-actions';
import { PluginStoreActions } from 'src/stores/plugin/plugin-store-actions';
import { waitForActiveNodeToStopMoving } from 'src/lib/align-element/helpers/wait-for-active-node-to-stop-moving';
import { createContext } from 'src/stores/view/subscriptions/effects/align-branch/helpers/create-context';
import { SilentError } from 'src/lib/errors/errors';
import { actionPriority } from 'src/stores/view/subscriptions/effects/align-branch/constants/action-priority';
import { logger } from 'src/helpers/logger';
import { SettingsActions } from 'src/stores/settings/settings-store-actions';

export type PluginAction =
    | DocumentStoreAction
    | ViewDocumentAction
    | ViewStoreAction
    | SettingsActions
    | PluginStoreActions
    | { type: 'view/life-cycle/mount' }
    | { type: 'view/align-branch/center-node' }
    | { type: 'view/align-branch/reveal-node' };

export type PreviousScrollBehavior = {
    timestamp: number;
    behavior: ScrollBehavior;
};

type AlignEvent = {
    action: PluginAction;
    controller: AbortController;
    priority: number;
    completed: boolean;
};

export class AlignBranch {
    private previousEvent: AlignEvent | null = null;

    private previousActiveBranch: ActiveBranch | null = null;

    constructor(public view: LineageView) {}

    align = (action: PluginAction) => {
        const priority = actionPriority.get(action.type);
        if (typeof priority !== 'number') {
            throw new SilentError(action.type + ' not allowed');
        }
        if (this.previousEvent && !this.previousEvent.completed) {
            if (priority >= this.previousEvent.priority) {
                this.previousEvent.controller.abort();
            } else {
                return;
            }
        }
        const event: AlignEvent = {
            action,
            priority,
            controller: new AbortController(),
            completed: false,
        };
        this.run(event);
        this.previousEvent = event;
    };

    private run = async (event: AlignEvent) => {
        try {
            if (skipAlign(this.view, event.action)) {
                event.completed = true;
                return;
            }

            const delay_ms = delayAlign(event.action);
            if (delay_ms > 0) {
                await delay(delay_ms, event.controller.signal);
            }
            await this.view.inlineEditor.mounting;

            const context = createContext(
                this.view,
                event.action,
                this.previousActiveBranch,
            );
            this.previousActiveBranch = context.activeBranch;

            const actions = createAlignBranchActions(context, event.action);
            if (!event.controller.signal.aborted) {
                requestAnimationFrame(() => {
                    runAlignBranchActions(
                        context,
                        actions,
                        event.controller.signal,
                    );
                });
                if (context.alignBranchSettings.behavior === 'smooth') {
                    await waitForActiveNodeToStopMoving(
                        this.view,
                        event.controller.signal,
                    );
                }
            }
        } catch (e) {
            logger.error(e);
        }
        event.completed = true;
    };
}
