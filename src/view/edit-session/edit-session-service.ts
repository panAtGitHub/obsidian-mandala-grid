import { derived, get, writable, type Readable } from 'svelte/store';
import { createTrailingTimer } from 'src/view/edit-session/edit-session-timers';
import type {
    EditSessionProjectionSnapshot,
    EditSessionCommitPayload,
    EditSessionCommitReason,
    EditSessionState,
} from 'src/view/edit-session/edit-session-types';

const createDefaultState = (): EditSessionState => ({
    activeNodeId: null,
    isInSidebar: false,
    bufferContent: '',
    projectionContent: '',
    dirty: false,
    projectionRevision: 0,
    commitRevision: 0,
    lastCommittedContent: '',
});

export class EditSessionService {
    private readonly state = writable<EditSessionState>(createDefaultState());
    private readonly projectionTimer: ReturnType<typeof createTrailingTimer>;
    private readonly commitTimer: ReturnType<typeof createTrailingTimer>;
    readonly stateStore: Readable<EditSessionState>;
    readonly projectionStore: Readable<EditSessionProjectionSnapshot | null>;

    constructor(
        private readonly onCommit: (payload: EditSessionCommitPayload) => void,
        {
            projectionDelayMs = 150,
            commitDelayMs = 600,
        }: {
            projectionDelayMs?: number;
            commitDelayMs?: number;
        } = {},
    ) {
        this.projectionTimer = createTrailingTimer(projectionDelayMs);
        this.commitTimer = createTrailingTimer(commitDelayMs);
        this.stateStore = {
            subscribe: this.state.subscribe,
        };
        this.projectionStore = derived(this.state, (state) =>
            state.activeNodeId && state.dirty
                ? {
                      nodeId: state.activeNodeId,
                      content: state.projectionContent,
                      revision: state.projectionRevision,
                  }
                : null,
        );
    }

    startSession(nodeId: string, isInSidebar: boolean, initialContent: string) {
        const current = get(this.state);
        if (
            current.activeNodeId === nodeId &&
            current.isInSidebar === isInSidebar &&
            current.lastCommittedContent === initialContent
        ) {
            return;
        }
        this.projectionTimer.cancel();
        this.commitTimer.cancel();
        this.state.set({
            activeNodeId: nodeId,
            isInSidebar,
            bufferContent: initialContent,
            projectionContent: initialContent,
            dirty: false,
            projectionRevision: current.projectionRevision,
            commitRevision: current.commitRevision,
            lastCommittedContent: initialContent,
        });
    }

    updateBuffer(content: string) {
        const current = get(this.state);
        if (!current.activeNodeId) return;

        const dirty = content !== current.lastCommittedContent;
        this.state.update((state) => ({
            ...state,
            bufferContent: content,
            dirty,
        }));

        if (!dirty) {
            this.projectionTimer.cancel();
            this.commitTimer.cancel();
            this.state.update((state) => ({
                ...state,
                projectionContent: state.lastCommittedContent,
            }));
            return;
        }

        this.projectionTimer.schedule(() => this.flushProjection());
        this.commitTimer.schedule(() => this.commit('idle'));
    }

    requestSave() {
        this.commit('save');
    }

    requestBlurCommit() {
        this.commit('blur');
    }

    switchNode(nextNodeId: string, isInSidebar: boolean, initialContent: string) {
        const current = get(this.state);
        if (
            current.activeNodeId === nextNodeId &&
            current.isInSidebar === isInSidebar
        ) {
            return;
        }
        if (current.activeNodeId && current.dirty) {
            this.commit('switch-node');
        }
        this.startSession(nextNodeId, isInSidebar, initialContent);
    }

    flushProjection() {
        const current = get(this.state);
        if (!current.activeNodeId || !current.dirty) return;
        if (current.projectionContent === current.bufferContent) return;
        this.state.update((state) => ({
            ...state,
            projectionContent: state.bufferContent,
            projectionRevision: state.projectionRevision + 1,
        }));
    }

    commit(reason: EditSessionCommitReason) {
        const current = get(this.state);
        if (!current.activeNodeId) {
            this.projectionTimer.cancel();
            this.commitTimer.cancel();
            return;
        }

        this.projectionTimer.flush();
        this.commitTimer.cancel();
        const latest = get(this.state);
        if (!latest.dirty) return;
        const activeNodeId = latest.activeNodeId;
        if (!activeNodeId) return;

        this.onCommit({
            nodeId: activeNodeId,
            content: latest.bufferContent,
            isInSidebar: latest.isInSidebar,
            reason,
            suppressRefocus: reason === 'blur',
        });
        this.state.update((state) => ({
            ...state,
            dirty: false,
            projectionContent: state.bufferContent,
            lastCommittedContent: state.bufferContent,
            commitRevision: state.commitRevision + 1,
        }));
    }

    cancel() {
        const current = get(this.state);
        this.projectionTimer.cancel();
        this.commitTimer.cancel();
        if (!current.activeNodeId) return;
        this.state.update((state) => ({
            ...state,
            bufferContent: state.lastCommittedContent,
            projectionContent: state.lastCommittedContent,
            dirty: false,
        }));
    }

    endSession(reason: EditSessionCommitReason) {
        if (reason === 'disable-edit' || reason === 'unload') {
            this.commit(reason);
        }
        this.projectionTimer.cancel();
        this.commitTimer.cancel();
        this.state.update((state) => ({
            ...state,
            activeNodeId: null,
            isInSidebar: false,
            bufferContent: '',
            projectionContent: '',
            dirty: false,
            lastCommittedContent: '',
        }));
    }

    getProjectionSnapshot() {
        return get(this.projectionStore);
    }
}
