export const basicOperator = new Set<ComparisonOperator>([
    'equals',
    'not-equals',
    'empty',
    'not-empty',
]);
export type BaseOperator = 'equals' | 'not-equals' | 'empty' | 'not-empty';

export type StringOperator =
    | BaseOperator
    | 'contains'
    | 'not-contains'
    | 'starts-with'
    | 'not-starts-with'
    | 'ends-with'
    | 'not-ends-with'
    | 'matches-regex'
    | 'not-matches-regex';

export type NumericOperator =
    | BaseOperator
    | 'greater-than'
    | 'less-than'
    | 'between'
    | 'not-between';
export type ComparisonOperator = StringOperator | NumericOperator;

export type StyleRuleTarget =
    | 'self'
    | 'self-or-any-parent'
    | 'self-or-direct-parent'
    | 'self-or-direct-children'
    | 'self-or-any-children'
    | 'direct-parent'
    | 'any-parent'
    | 'direct-children'
    | 'any-children';

type LogicalOperator = 'and' | 'or';

export type StringProperty = 'content' | 'headings';
export type NumericProperty =
    | 'depth'
    | 'character-count'
    | 'word-count'
    | 'line-count'
    | 'direct-children-count'
    | 'total-children-count'
    | 'headings-word-count';

export type StringConditionNode = {
    type: 'condition';
    scope: StyleRuleTarget;
    property: StringProperty;
    operator: StringOperator;
    value: string;
    enabled: boolean;
};

export type NumericConditionNode = {
    type: 'condition';
    scope: StyleRuleTarget;
    property: NumericProperty;
    operator: NumericOperator;
    value: number;
    valueB?: number; // only used for 'between' and 'not-between' operators
    enabled: boolean;
};

export type ConditionNode = StringConditionNode | NumericConditionNode;

export type ConditionGroup = {
    type: 'group';
    operator: LogicalOperator;
    children: Array<ConditionNode | ConditionGroup>;
    enabled: boolean;
};

export type StyleRuleCondition = ConditionNode /*| ConditionGroup*/;

export type StyleVariant = 'left-border' | 'background-color';

export type NodeStyle = {
    color: string;
    styleVariant: StyleVariant;
};
export type StyleRule = {
    id: string;
    name: string;
    enabled: boolean;
    condition: StyleRuleCondition;
    style: NodeStyle;
    priority: number;
};
