import type {
    BuiltinMandalaGridOrientation,
    MandalaCustomLayout,
    MandalaGridOrientation,
} from 'src/stores/settings/settings-type';

export const DEFAULT_MANDALA_CUSTOM_PATTERN = '123405678';

export const BUILTIN_MANDALA_LAYOUT_IDS = {
    'left-to-right': 'builtin:left-to-right',
    'south-start': 'builtin:south-start',
} as const satisfies Record<BuiltinMandalaGridOrientation, string>;

export const BUILTIN_MANDALA_LAYOUT_PATTERNS = {
    'left-to-right': DEFAULT_MANDALA_CUSTOM_PATTERN,
    'south-start': '637204518',
} as const satisfies Record<BuiltinMandalaGridOrientation, string>;

export const getFallbackCustomPattern = () => DEFAULT_MANDALA_CUSTOM_PATTERN;

export const isBuiltinMandalaLayoutId = (
    value: string | null | undefined,
): value is (typeof BUILTIN_MANDALA_LAYOUT_IDS)[BuiltinMandalaGridOrientation] =>
    value === BUILTIN_MANDALA_LAYOUT_IDS['left-to-right'] ||
    value === BUILTIN_MANDALA_LAYOUT_IDS['south-start'];

export const getBuiltinOrientationFromLayoutId = (
    layoutId: string | null | undefined,
): BuiltinMandalaGridOrientation | null => {
    if (layoutId === BUILTIN_MANDALA_LAYOUT_IDS['left-to-right']) {
        return 'left-to-right';
    }
    if (layoutId === BUILTIN_MANDALA_LAYOUT_IDS['south-start']) {
        return 'south-start';
    }
    return null;
};

export const getBuiltinLayoutId = (
    orientation: BuiltinMandalaGridOrientation,
) => BUILTIN_MANDALA_LAYOUT_IDS[orientation];

export const layoutIdToOrientation = (
    layoutId: string | null | undefined,
): MandalaGridOrientation => {
    const builtin = getBuiltinOrientationFromLayoutId(layoutId);
    if (builtin) return builtin;
    return layoutId?.startsWith('custom:') ? 'custom' : 'left-to-right';
};

export const legacyOrientationToLayoutId = (
    orientation: MandalaGridOrientation | null | undefined,
): string | null => {
    if (orientation === 'left-to-right' || orientation === 'south-start') {
        return getBuiltinLayoutId(orientation);
    }
    return orientation === 'custom' ? getBuiltinLayoutId('left-to-right') : null;
};

export const findMandalaCustomLayout = (
    customLayouts: MandalaCustomLayout[],
    layoutId: string | null | undefined,
) => customLayouts.find((layout) => layout.id === layoutId) ?? null;

export const resolveMandalaLayoutId = (
    layoutId: string | null | undefined,
    customLayouts: MandalaCustomLayout[],
): string => {
    if (isBuiltinMandalaLayoutId(layoutId)) return layoutId;
    if (layoutId?.startsWith('custom:') && findMandalaCustomLayout(customLayouts, layoutId)) {
        return layoutId;
    }
    return BUILTIN_MANDALA_LAYOUT_IDS['left-to-right'];
};

export const isValidCustomMandalaPattern = (pattern: string): boolean => {
    if (!/^[0-8]{9}$/.test(pattern)) return false;
    if (pattern[4] !== '0') return false;
    return new Set(pattern).size === 9;
};

export const normalizeCustomMandalaPattern = (value: unknown): string => {
    if (typeof value !== 'string') return getFallbackCustomPattern();
    return isValidCustomMandalaPattern(value)
        ? value
        : getFallbackCustomPattern();
};

export const patternToGrid = (pattern: string): string[][] => {
    const normalized = normalizeCustomMandalaPattern(pattern);
    return [
        normalized.slice(0, 3).split(''),
        normalized.slice(3, 6).split(''),
        normalized.slice(6, 9).split(''),
    ];
};

export const gridToPattern = (grid: string[][]): string =>
    normalizeCustomMandalaPattern(grid.flat().join(''));

export const patternToPreviewRows = (pattern: string): string[] =>
    patternToGrid(pattern).map((row) => row.join(' '));

export const patternToCoreGrid = (
    pattern: string,
): readonly (readonly string[])[] =>
    patternToGrid(pattern).map((row) =>
        row.map((value) => (value === '0' ? '1' : String(Number(value) + 1))),
    );

export const coreGridToPattern = (
    grid: readonly (readonly string[])[],
): string =>
    grid
        .flat()
        .map((value) => (value === '1' ? '0' : String(Number(value) - 1)))
        .join('');

export const normalizeMandalaCustomLayouts = (value: unknown) => {
    if (!Array.isArray(value)) return [] as MandalaCustomLayout[];
    const seen = new Set<string>();
    const layouts: MandalaCustomLayout[] = [];
    for (const item of value) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
        const raw = item as Record<string, unknown>;
        const id = typeof raw.id === 'string' ? raw.id.trim() : '';
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const name =
            typeof raw.name === 'string' && raw.name.trim().length > 0
                ? raw.name.trim()
                : '未命名布局';
        layouts.push({
            id,
            name,
            pattern: normalizeCustomMandalaPattern(raw.pattern),
        });
    }
    return layouts;
};
