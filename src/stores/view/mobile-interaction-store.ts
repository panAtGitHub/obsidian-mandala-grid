import { writable } from 'svelte/store';

export type MobileInteractionMode = 'locked' | 'unlocked';

export const mobileInteractionMode = writable<MobileInteractionMode>('locked');

export const toggleMobileInteractionMode = () => {
    mobileInteractionMode.update((mode) =>
        mode === 'locked' ? 'unlocked' : 'locked',
    );
};

export const setMobileInteractionMode = (mode: MobileInteractionMode) => {
    mobileInteractionMode.set(mode);
};
