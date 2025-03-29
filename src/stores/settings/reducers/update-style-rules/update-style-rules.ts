import {
    NodeStyle,
    StyleRule,
    StyleRuleCondition,
} from '../../types/style-rules-types';
import { id } from 'src/helpers/id';
import { Settings } from 'src/stores/settings/settings-type';
import { fixConditionTypes } from 'src/stores/settings/reducers/update-style-rules/helpers/fix-condition-types';
import { handleDND } from 'src/stores/settings/reducers/update-style-rules/handle-dnd';
import invariant from 'tiny-invariant';

export type MoveNodePayload = {
    documentPath: string;
    droppedId: string;
    targetId: string;
    position: 'before' | 'after';
};

export type StyleRulesAction =
    | { type: 'settings/style-rules/add'; payload: { documentPath: string } }
    | {
          type: 'settings/style-rules/update';
          payload: {
              documentPath: string;
              id: string;
              rule: Partial<StyleRule>;
          };
      }
    | {
          type: 'settings/style-rules/update-style';
          payload: {
              documentPath: string;
              id: string;
              style: Partial<NodeStyle>;
          };
      }
    | {
          type: 'settings/style-rules/delete';
          payload: { documentPath: string; id: string };
      }
    | {
          type: 'settings/style-rules/move';
          payload: MoveNodePayload;
      }
    | {
          type: 'settings/style-rules/update-condition';
          payload: {
              documentPath: string;
              ruleId: string;
              updates: Partial<StyleRuleCondition>;
          };
      }
    | {
          type: 'settings/style-rules/enable-rule';
          payload: { documentPath: string; id: string };
      }
    | {
          type: 'settings/style-rules/disable-rule';
          payload: { documentPath: string; id: string };
      }
    | {
          type: 'settings/style-rules/toggle-global';
          payload: {
              documentPath: string;
              id: string;
          };
      };

export const updateStyleRules = (
    settings: Pick<Settings, 'styleRules'>,
    action: StyleRulesAction,
) => {
    let rulesContainer: { rules: StyleRule[] };
    rulesContainer =
        settings.styleRules.settings.activeTab === 'global-rules'
            ? settings.styleRules.global
            : settings.styleRules.documents[action.payload.documentPath];
    if (!rulesContainer) {
        if (action.type !== 'settings/style-rules/add') {
            throw new Error('Document does not have any style rules');
        }
        settings.styleRules.documents[action.payload.documentPath] = {
            rules: [],
        };
        rulesContainer =
            settings.styleRules.documents[action.payload.documentPath];
    }
    if (action.type === 'settings/style-rules/add') {
        const newRule: StyleRule = {
            id: id.styleRule(),
            name: '',
            enabled: true,
            condition: {
                type: 'condition',
                scope: 'self',
                property: 'content',
                operator: 'contains',
                value: '',
                enabled: true,
            },
            style: {
                color: '#fff',
                styleVariant: 'left-border',
            },
            priority: 0,
        };
        rulesContainer.rules = [...rulesContainer.rules, newRule];
    } else if (action.type === 'settings/style-rules/update') {
        const { id, rule } = action.payload;
        const index = rulesContainer.rules.findIndex((r) => r.id === id);
        if (index !== -1) {
            rulesContainer.rules[index] = {
                ...rulesContainer.rules[index],
                ...rule,
            };
            fixConditionTypes(rulesContainer.rules[index]);
            rulesContainer.rules = [...rulesContainer.rules];
        }
    } else if (action.type === 'settings/style-rules/delete') {
        rulesContainer.rules = rulesContainer.rules.filter(
            (rule) => rule.id !== action.payload.id,
        );
    } else if (action.type === 'settings/style-rules/move') {
        rulesContainer.rules = handleDND(rulesContainer.rules, action.payload);
    } else if (action.type === 'settings/style-rules/update-style') {
        const index = rulesContainer.rules.findIndex(
            (r) => r.id === action.payload.id,
        );
        if (index !== -1) {
            rulesContainer.rules[index] = {
                ...rulesContainer.rules[index],
                // @ts-ignore
                style: {
                    ...rulesContainer.rules[index].style,
                    ...action.payload.style,
                },
            };
            rulesContainer.rules = [...rulesContainer.rules];
        }
    } else if (action.type === 'settings/style-rules/update-condition') {
        const { ruleId, updates } = action.payload;
        const index = rulesContainer.rules.findIndex((r) => r.id === ruleId);
        if (index !== -1) {
            rulesContainer.rules[index] = {
                ...rulesContainer.rules[index],
                // @ts-ignore
                condition: {
                    ...rulesContainer.rules[index].condition,
                    ...updates,
                },
            };
            fixConditionTypes(rulesContainer.rules[index]);
            rulesContainer.rules = [...rulesContainer.rules];
        }
    } else if (action.type === 'settings/style-rules/enable-rule') {
        const index = rulesContainer.rules.findIndex(
            (r) => r.id === action.payload.id,
        );
        if (index !== -1) {
            rulesContainer.rules[index].enabled = true;
            rulesContainer.rules = [...rulesContainer.rules];
        }
    } else if (action.type === 'settings/style-rules/disable-rule') {
        const index = rulesContainer.rules.findIndex(
            (r) => r.id === action.payload.id,
        );
        if (index !== -1) {
            rulesContainer.rules[index].enabled = false;
            rulesContainer.rules = [...rulesContainer.rules];
        }
    } else if (action.type === 'settings/style-rules/toggle-global') {
        const rule = rulesContainer.rules.find(
            (r) => r.id === action.payload.id,
        );
        invariant(rule);
        rulesContainer.rules = rulesContainer.rules.filter(
            (r) => r.id !== action.payload.id,
        );
        if (settings.styleRules.settings.activeTab === 'global-rules') {
            let documentRules =
                settings.styleRules.documents[action.payload.documentPath];
            if (!documentRules) {
                settings.styleRules.documents[action.payload.documentPath] = {
                    rules: [],
                };
                documentRules =
                    settings.styleRules.documents[action.payload.documentPath];
            }
            documentRules.rules = [...documentRules.rules, rule];
        } else {
            settings.styleRules.global.rules = [
                ...settings.styleRules.global.rules,
                rule,
            ];
        }
    }
};
