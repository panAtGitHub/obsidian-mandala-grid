import { parseYaml } from 'obsidian';
import type {
    SectionRangeLimit,
    Settings,
} from 'src/mandala-settings/state/settings-type';

export const MANDALA_CELL_FORMAT_FRONTMATTER_KEY = 'mandala_cell_format';

export type MandalaCellFormatHeading = 1 | 2 | 3 | 4 | 5 | 6 | 'none';
export type MandalaCellFormatBody =
    | 'paragraph'
    | 'unordered-list'
    | 'ordered-list';

export type MandalaCellFormatRule = {
    heading: MandalaCellFormatHeading;
    body: MandalaCellFormatBody;
};

export type MandalaCellFormatConfig = {
    dayPlanBody?: MandalaCellFormatBody;
    enabled: boolean;
    levels: Record<string, MandalaCellFormatRule>;
    deeper: MandalaCellFormatRule;
};

export type MandalaCellFormatReadResult = {
    present: boolean;
    config: MandalaCellFormatConfig;
    valid: boolean;
};

const DEFAULT_DEEPER_RULE: MandalaCellFormatRule = {
    heading: 'none',
    body: 'unordered-list',
};

const stripFrontmatterMarkers = (frontmatter: string) =>
    frontmatter.replace(/^---\n/, '').replace(/\n---\n?$/, '');

const toRecord = (input: unknown): Record<string, unknown> | null =>
    input && typeof input === 'object' && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : null;

const isHeading = (value: unknown): value is MandalaCellFormatHeading =>
    value === 'none' ||
    (typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 6);

const isBody = (value: unknown): value is MandalaCellFormatBody =>
    value === 'paragraph' ||
    value === 'unordered-list' ||
    value === 'ordered-list';

const defaultRuleForDepth = (depth: number): MandalaCellFormatRule => ({
    heading:
        depth >= 1 && depth <= 5
            ? ((depth + 1) as MandalaCellFormatHeading)
            : 'none',
    body: 'unordered-list',
});

const cloneRule = (rule: MandalaCellFormatRule): MandalaCellFormatRule => ({
    heading: rule.heading,
    body: rule.body,
});

export const cloneMandalaCellFormatConfig = (
    config: MandalaCellFormatConfig,
): MandalaCellFormatConfig => ({
    enabled: config.enabled,
    levels: Object.fromEntries(
        Object.entries(config.levels).map(([depth, rule]) => [
            depth,
            cloneRule(rule),
        ]),
    ),
    deeper: cloneRule(config.deeper),
});

export const createDefaultMandalaCellFormat = (
    maxDepth: SectionRangeLimit = 'unlimited',
    enabled = false,
): MandalaCellFormatConfig => {
    const levels: Record<string, MandalaCellFormatRule> = {};
    const visibleDepth = maxDepth === 'unlimited' ? 3 : maxDepth;
    for (let depth = 1; depth <= visibleDepth; depth += 1) {
        levels[String(depth)] = defaultRuleForDepth(depth);
    }
    return {
        enabled,
        levels,
        deeper: cloneRule(DEFAULT_DEEPER_RULE),
    };
};

export const getDefaultMandalaCellFormatRule = (
    depth: number,
): MandalaCellFormatRule => defaultRuleForDepth(depth);

export const getMandalaCellFormatRule = (
    config: MandalaCellFormatConfig,
    depth: number,
    maxDepth: SectionRangeLimit = 'unlimited',
): MandalaCellFormatRule =>
    config.levels[String(depth)] ??
    (maxDepth === 'unlimited' && depth > 3
        ? config.deeper
        : getDefaultMandalaCellFormatRule(depth));

const parseRule = (
    raw: unknown,
    fallback: MandalaCellFormatRule,
): { rule: MandalaCellFormatRule; valid: boolean } => {
    const record = toRecord(raw);
    if (!record) return { rule: cloneRule(fallback), valid: false };
    const valid =
        (record.heading === undefined || isHeading(record.heading)) &&
        (record.body === undefined || isBody(record.body));
    return {
        rule: {
            heading:
                record.heading === undefined
                    ? fallback.heading
                    : isHeading(record.heading)
                      ? record.heading
                      : fallback.heading,
            body:
                record.body === undefined
                    ? fallback.body
                    : isBody(record.body)
                      ? record.body
                      : fallback.body,
        },
        valid,
    };
};

export const readMandalaCellFormat = (
    frontmatter: string,
    dayPlan = false,
): MandalaCellFormatReadResult => {
    if (!frontmatter.trim()) {
        return {
            present: false,
            config: createDefaultMandalaCellFormat(),
            valid: true,
        };
    }

    let parsed: unknown;
    try {
        parsed = parseYaml(stripFrontmatterMarkers(frontmatter));
    } catch {
        return {
            present: false,
            config: createDefaultMandalaCellFormat(),
            valid: false,
        };
    }

    const root = toRecord(parsed);
    const rawValue = root?.[MANDALA_CELL_FORMAT_FRONTMATTER_KEY];
    if (rawValue === undefined) {
        return {
            present: false,
            config: createDefaultMandalaCellFormat(),
            valid: true,
        };
    }
    const rawConfig = toRecord(rawValue);
    if (!rawConfig) {
        return {
            present: true,
            config: createDefaultMandalaCellFormat(),
            valid: false,
        };
    }

    let valid = typeof rawConfig.enabled === 'boolean';
    const levels: Record<string, MandalaCellFormatRule> = {};
    const rawLevels = toRecord(rawConfig.levels);
    if (dayPlan) {
        const legacyBody = toRecord(rawLevels?.['2'])?.body;
        const body =
            rawConfig.dayPlanBody === undefined
                ? isBody(legacyBody)
                    ? legacyBody
                    : 'unordered-list'
                : rawConfig.dayPlanBody;
        return {
            present: true,
            valid: valid && isBody(body),
            config: {
                ...createDefaultMandalaCellFormat(
                    'unlimited',
                    rawConfig.enabled === true,
                ),
                dayPlanBody: isBody(body) ? body : 'unordered-list',
            },
        };
    }
    if (rawLevels) {
        for (const [depth, rawRule] of Object.entries(rawLevels)) {
            if (!/^\d+$/.test(depth) || Number(depth) < 1) {
                valid = false;
                continue;
            }
            const parsedRule = parseRule(
                rawRule,
                getDefaultMandalaCellFormatRule(Number(depth)),
            );
            levels[depth] = parsedRule.rule;
            valid = valid && parsedRule.valid;
        }
    } else if (rawConfig.levels !== undefined) {
        valid = false;
    }

    const parsedDeeper =
        rawConfig.deeper === undefined
            ? { rule: cloneRule(DEFAULT_DEEPER_RULE), valid: true }
            : parseRule(rawConfig.deeper, DEFAULT_DEEPER_RULE);
    valid = valid && parsedDeeper.valid;

    return {
        present: true,
        config: {
            enabled: rawConfig.enabled === true,
            levels,
            deeper: parsedDeeper.rule,
        },
        valid,
    };
};

export const writeDayPlanBodyFormat = (
    record: Record<string, unknown>,
    body: MandalaCellFormatBody,
) => {
    record[MANDALA_CELL_FORMAT_FRONTMATTER_KEY] = {
        ...toRecord(record[MANDALA_CELL_FORMAT_FRONTMATTER_KEY]),
        enabled: true,
        dayPlanBody: body,
    };
};

export const writeMandalaCellFormat = (
    frontmatter: Record<string, unknown>,
    config: MandalaCellFormatConfig,
) => {
    frontmatter[MANDALA_CELL_FORMAT_FRONTMATTER_KEY] = {
        enabled: config.enabled,
        levels: Object.fromEntries(
            Object.entries(config.levels).map(([depth, rule]) => [depth, rule]),
        ),
        deeper: config.deeper,
    };
};

export const removeMandalaCellFormat = (
    frontmatter: Record<string, unknown>,
) => {
    delete frontmatter[MANDALA_CELL_FORMAT_FRONTMATTER_KEY];
};

export const buildNewFileMandalaCellFormat = (
    settings: Settings,
    maxDepth: SectionRangeLimit = settings.view.subgridMaxDepth,
): MandalaCellFormatConfig | null => {
    if (!settings.view.enableCellFormatPreset) return null;
    return cloneMandalaCellFormatConfig({
        ...(settings.view.newFileCellFormat ??
            createDefaultMandalaCellFormat(maxDepth, true)),
        enabled: true,
    });
};
