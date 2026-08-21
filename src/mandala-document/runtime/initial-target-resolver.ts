import { getParentSection } from 'src/mandala-document/engine/section-utils';
import type { MandalaProfileActivation } from 'src/mandala-display/logic/mandala-profile';
import type { SectionIndex } from 'src/mandala-document/runtime/section-index';

export type InitialTargetSource =
    | 'explicit-jump'
    | 'day-plan-today'
    | 'persisted-center'
    | 'persisted-active'
    | 'default';

export type InitialTarget = {
    centerSection: string;
    activeSection: string;
    source: InitialTargetSource;
};

type InitialTargetOptions = {
    index: SectionIndex;
    profile: MandalaProfileActivation;
    persistedCenter?: string | null;
    persistedActive?: string | null;
    explicitTarget?: string | null;
    defaultSection?: string;
};

const firstExisting = (
    index: SectionIndex,
    candidates: (string | null | undefined)[],
) =>
    candidates.find((section) => Boolean(section && index.byId.has(section))) ??
    null;

const resolveCenterForActive = (activeSection: string) => {
    let center = activeSection;
    while (getParentSection(center)) {
        center = getParentSection(center) ?? center;
    }
    return center;
};

export const resolveInitialTarget = ({
    index,
    profile,
    persistedCenter = null,
    persistedActive = null,
    explicitTarget = null,
    defaultSection = '1',
}: InitialTargetOptions): InitialTarget => {
    const explicit = firstExisting(index, [explicitTarget]);
    if (explicit) {
        return {
            centerSection: resolveCenterForActive(explicit),
            activeSection: explicit,
            source: 'explicit-jump',
        };
    }

    const today =
        profile.kind === 'day-plan'
            ? firstExisting(index, [profile.targetSection])
            : null;
    if (today) {
        return {
            centerSection: today,
            activeSection: today,
            source: 'day-plan-today',
        };
    }

    const center = firstExisting(index, [persistedCenter]);
    if (center) {
        const active = firstExisting(index, [persistedActive]) ?? center;
        return {
            centerSection: center,
            activeSection: active,
            source: 'persisted-center',
        };
    }

    const active = firstExisting(index, [persistedActive]);
    if (active) {
        return {
            centerSection: resolveCenterForActive(active),
            activeSection: active,
            source: 'persisted-active',
        };
    }

    const fallback =
        firstExisting(index, [defaultSection, index.rootIds[0]]) ??
        index.canonicalOrderedIds[0] ??
        defaultSection;
    return {
        centerSection: fallback,
        activeSection: fallback,
        source: 'default',
    };
};
