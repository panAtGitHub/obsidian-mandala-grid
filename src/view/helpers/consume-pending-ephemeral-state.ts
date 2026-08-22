export type PendingEphemeralStateConsumption = {
    consumed: boolean;
    nextState: unknown;
};

export const getEphemeralStateLine = (state: unknown): number | null => {
    if (!state || typeof state !== 'object' || !('line' in state)) {
        return null;
    }
    const line = (state as { line?: unknown }).line;
    return typeof line === 'number' && line >= 0 ? line : null;
};

export const consumePendingEphemeralState = (
    pendingState: unknown,
    consumedState: unknown,
): PendingEphemeralStateConsumption => {
    if (pendingState !== consumedState) {
        return { consumed: false, nextState: pendingState };
    }

    if (!pendingState || typeof pendingState !== 'object') {
        return { consumed: true, nextState: null };
    }

    const remainingState = {
        ...(pendingState as Record<string, unknown>),
    };
    delete remainingState.line;

    return {
        consumed: true,
        nextState:
            Object.keys(remainingState).length > 0 ? remainingState : null,
    };
};
