import { derived, get, writable, type Readable } from 'svelte/store';
import { createTrailingTimer } from 'src/view/edit-session/edit-session-timers';
import type {
    EditSessionProjectionSnapshot,
    EditSessionCommitPayload,
    EditSessionState,
} from 'src/view/edit-session/edit-session-types';

const createDefaultState = (): EditSessionState => ({
    activeNodeId: null,
    isInSidebar: false,
    bufferContent: '',
    projectionContent: '',
    dirty: false,
    projectionRevision: 0,
    lastCommittedContent: '',
});

export class EditSessionService {
    private composing = false;
    private readonly state = writable<EditSessionState>(createDefaultState());
    private readonly projectionTimer: ReturnType<typeof createTrailingTimer>;
    private saving: Promise<boolean> | null = null;
    private sessionVersion = 0;
    readonly stateStore: Readable<EditSessionState>;
    readonly projectionStore: Readable<EditSessionProjectionSnapshot | null>;

    constructor(
        private readonly onCommit: (
            payload: EditSessionCommitPayload,
        ) => Promise<boolean> | boolean | void,
        {
            projectionDelayMs = 150,
        }: {
            projectionDelayMs?: number;
        } = {},
    ) {
        this.projectionTimer = createTrailingTimer(projectionDelayMs);
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
        this.composing = false;
        this.sessionVersion += 1;
        this.state.set({
            activeNodeId: nodeId,
            isInSidebar,
            bufferContent: initialContent,
            projectionContent: initialContent,
            dirty: false,
            projectionRevision: current.projectionRevision,
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
            this.state.update((state) => ({
                ...state,
                projectionContent: state.lastCommittedContent,
            }));
            return;
        }

        if (!this.composing) {
            this.projectionTimer.schedule(() => this.flushProjection());
        }
    }

    setComposing(composing: boolean) {
        if (this.composing === composing) return;
        this.composing = composing;
        this.projectionTimer.cancel();
        if (!composing) {
            const current = get(this.state);
            if (current.activeNodeId && current.dirty)
                this.updateBuffer(current.bufferContent);
        }
    }

    requestSave() {
        if (this.saving) return this.saving;
        const draft = get(this.state);
        if (!draft.activeNodeId || !draft.dirty) return Promise.resolve(true);
        if (this.composing) return Promise.resolve(false);
        const version = this.sessionVersion;
        const saving = Promise.resolve(
            this.onCommit({
                nodeId: draft.activeNodeId,
                content: draft.bufferContent,
                previousContent: draft.lastCommittedContent,
                isInSidebar: draft.isInSidebar,
            }),
        )
            .then((accepted) => {
                if (accepted === false || version !== this.sessionVersion)
                    return false;
                this.state.update((state) => ({
                    ...state,
                    lastCommittedContent: draft.bufferContent,
                    dirty: state.bufferContent !== draft.bufferContent,
                }));
                return !get(this.state).dirty;
            })
            .finally(() => {
                this.saving = null;
            });
        this.saving = saving;
        return saving;
    }

    waitForSave() {
        return this.saving ?? Promise.resolve(true);
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

    endSession() {
        this.projectionTimer.cancel();
        this.composing = false;
        this.sessionVersion += 1;
        this.state.set(createDefaultState());
    }

    getProjectionSnapshot() {
        return get(this.projectionStore);
    }
}
