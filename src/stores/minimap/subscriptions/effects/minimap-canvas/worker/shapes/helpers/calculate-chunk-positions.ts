import { chunkPositionsCache } from 'src/stores/minimap/subscriptions/effects/minimap-canvas/worker/shapes/helpers/chunk-positions-cache';

export enum ElementName {
    heading = 'heading',
    period = 'period',
    bullet = 'bullet',
    highlight = 'highlight',
    bold_italic = 'bold_italic',
    wikilink = 'wikilink',
    tag = 'tag',
    strikethrough = 'strikethrough',
    task = 'task',
    comma = 'comma',
}

export enum ElementScope {
    multi_line = 'multi_line',
    full_line = 'full_line', // heading
    block = 'block',
    character = 'character',
}

const charToElementName: Record<string, ElementName> = {
    '#': ElementName.heading,
    '-': ElementName.bullet,
    '.': ElementName.period,
    '=': ElementName.highlight,
    '*': ElementName.bold_italic,
    _: ElementName.bold_italic,
    '[': ElementName.wikilink,
    ']': ElementName.wikilink,
    '~': ElementName.strikethrough,
    ',': ElementName.comma,
};

export type MinimapElement = {
    chunk: string;
    line: number;
    x_chars: number;
    length_chars: number;
    type: ElementName | null;
};

export type ChunkPositionResult = {
    chunks: MinimapElement[];
    totalLines: number;
    empty: boolean;
};

type ElementMeta = {
    scope: ElementScope;
    elementName: ElementName;
    noSpaces?: boolean;
    canBeParent?: boolean;
};

type State = {
    element: MinimapElement;
    elementMeta: ElementMeta | null;
    closingTagLength: number;
    x: number;
    lineNumber: number;
    // highlight/task/bullet point
    parentElementMeta: ElementMeta | null;
};

const abbrevRegex =
    /\b(dr|mr|mrs|ms|e\.g|e\.i|sr|jr|st|ave|rd|no|vs|etc|vol|ed|pp)\b/i;

const illegalObsidianTagCharacters = new Set([
    '^',
    '.',
    '!',
    '`',
    '*',
    '%',
    '?',
    '"',
    '~',
    '@',
    "'",
    '(',
    ')',
    '!',
    '{',
    '}',
    '[',
    ']',
    '^',
    '%',
    '$',
    '+',
    '=',
    '\\',
]);

export const calculateChunkPositions = (
    content: string,
    availableLineCharacters: number,
    nodeId: string,
    canvasId: string,
): ChunkPositionResult => {
    const cache = chunkPositionsCache.getCachedResult(
        canvasId,
        nodeId,
        content,
        availableLineCharacters,
    );
    if (cache) {
        return cache;
    }
    const isEmptyCard = !content.trim();
    if (isEmptyCard) {
        content = 'empty';
    }

    const elements: MinimapElement[] = [];
    const state: State = {
        element: {
            chunk: '',
            length_chars: -1,
            line: 0,
            type: null,
            x_chars: 0,
        },
        elementMeta: null,
        parentElementMeta: null,
        closingTagLength: 0,
        x: 0,
        lineNumber: 0,
    };

    for (let i = 0; i < content.length; i++) {
        const character = content[i];
        if (character === '\n') {
            state.lineNumber++;
            state.x = 0;
            const activeMultiLineElement =
                state.elementMeta &&
                state.elementMeta.scope === ElementScope.multi_line;
            if (!activeMultiLineElement) {
                state.elementMeta = null;
            }

            continue;
        } else if (character === ' ') {
            if (state.elementMeta?.noSpaces) {
                state.elementMeta = null;
            }
        } else if (
            !state.elementMeta ||
            state.elementMeta.scope !== ElementScope.full_line
        ) {
            const elementName = charToElementName[character];
            if (elementName) {
                const nextCharacter_1 = content[i + 1];
                const nextCharacter_2 = content[i + 2];
                // heading
                if (
                    character === '#' &&
                    state.x === 0 &&
                    (nextCharacter_1 === ' ' || nextCharacter_1 === '#')
                ) {
                    state.elementMeta = {
                        elementName,
                        scope: ElementScope.full_line,
                    };
                }
                // tag
                else if (
                    character === '#' &&
                    !illegalObsidianTagCharacters.has(nextCharacter_1) &&
                    (!state.elementMeta ||
                        state.elementMeta.canBeParent ||
                        state.elementMeta.elementName === elementName)
                ) {
                    if (state.elementMeta?.canBeParent) {
                        state.parentElementMeta = state.elementMeta;
                    }
                    state.elementMeta = {
                        elementName: ElementName.tag,
                        scope: ElementScope.block,
                        noSpaces: true,
                    };
                }
                // bullet point
                else if (character === '-' && state.x === 0) {
                    const isTask =
                        nextCharacter_1 === ' ' &&
                        content[i + 2] === '[' &&
                        content[i + 4] === ']';
                    if (isTask) {
                        state.elementMeta = {
                            elementName: ElementName.task,
                            scope: ElementScope.block,
                            canBeParent: true,
                        };
                    } else {
                        state.elementMeta = {
                            elementName: ElementName.bullet,
                            scope: ElementScope.block,
                            canBeParent: true,
                        };
                    }
                }
                // period
                else if (
                    character === '.' &&
                    (!state.elementMeta ||
                        state.elementMeta.elementName === ElementName.tag)
                ) {
                    const previousChunk =
                        (content[i - 3] || '') +
                        content[i - 2] +
                        content[i - 1];
                    const nextCharacter = content[i + 1];
                    const notAPeriod =
                        !(nextCharacter && nextCharacter.match(/[A-Z\d]/)) &&
                        content[i - 1] &&
                        !content[i - 1].match(/[.!?]/) &&
                        !abbrevRegex.test(previousChunk) &&
                        !(content[i - 1] === 'e' && nextCharacter === 'g') &&
                        !(content[i - 1] === 'i' && nextCharacter === 'e');
                    if (notAPeriod) {
                        state.elementMeta = {
                            elementName: ElementName.period,
                            scope: ElementScope.character,
                        };
                    }
                }
                // comma
                else if (
                    character === ',' &&
                    (!state.elementMeta ||
                        state.elementMeta.elementName === ElementName.tag)
                ) {
                    const previousChunk = content[i - 1] || '';
                    const nextChunk = content[i + 1] || '';

                    // don't highlight commas in numbers (e.g., 1,000)
                    if (!previousChunk.match(/\d/) || !nextChunk.match(/\d/)) {
                        state.elementMeta = {
                            elementName: ElementName.comma,
                            scope: ElementScope.character,
                        };
                    }
                }
                // double tag blocks
                else if (
                    !state.elementMeta ||
                    state.elementMeta.canBeParent ||
                    state.elementMeta.elementName === elementName
                ) {
                    const isHighlight = character === '=';
                    const isDoubleCharacterTag =
                        (isHighlight && nextCharacter_1 === '=') ||
                        (character === '~' && nextCharacter_1 === '~') ||
                        (character === '[' && nextCharacter_1 === '[') ||
                        (character === ']' && nextCharacter_1 === ']') ||
                        // **text**
                        (character === '*' && nextCharacter_1 === '*');
                    const isDoubleTagElement =
                        isDoubleCharacterTag ||
                        // *text*
                        (character === '*' && content[i - 1] !== '*') ||
                        character === '_';

                    if (isDoubleTagElement) {
                        const isClosingTag =
                            state.elementMeta?.elementName === elementName;
                        const hasSpaceAfterStart = isClosingTag
                            ? false
                            : isDoubleCharacterTag
                              ? nextCharacter_2 === ' '
                              : nextCharacter_1 === ' ';
                        if (isClosingTag) {
                            state.closingTagLength = isDoubleCharacterTag
                                ? 2
                                : 1;
                        } else if (!hasSpaceAfterStart) {
                            const scope = isHighlight
                                ? ElementScope.multi_line
                                : ElementScope.block;
                            if (
                                state.elementMeta?.canBeParent &&
                                scope === ElementScope.block
                            ) {
                                state.parentElementMeta = state.elementMeta;
                            }
                            state.elementMeta = {
                                elementName,
                                scope: scope,
                                canBeParent: isHighlight,
                            };
                        }
                    }
                }
            }
        }
        if (state.x + 1 > availableLineCharacters) {
            state.lineNumber++;
            state.x = 0;
        }
        // fallback to highlight/task/bullet-point types
        else if (
            state.closingTagLength === 0 &&
            !state.elementMeta &&
            state.parentElementMeta
        ) {
            state.elementMeta = state.parentElementMeta;
            state.parentElementMeta = null;
        }

        // char is in a new minimap line
        if (state.lineNumber !== state.element.line) {
            state.element.length_chars = state.element.chunk.length;
            if (state.element.length_chars > 0) {
                elements.push(state.element);
            }
            // character type is kept
            state.element = {
                chunk: character,
                line: state.lineNumber,
                x_chars: 0,
                length_chars: -1,
                type: state.elementMeta ? state.elementMeta.elementName : null,
            };
        }
        // char is a breaking space
        else if (
            character === ' ' &&
            (!state.elementMeta || state.elementMeta?.noSpaces)
        ) {
            state.element.length_chars = state.element.chunk.length;
            if (state.element.length_chars > 0) {
                elements.push(state.element);
            }
            state.element = {
                chunk: '',
                line: state.lineNumber,
                x_chars: state.x + 1,
                length_chars: -1,
                type: null,
            };
            state.elementMeta = null;
        }
        // char is a period/comma
        else if (state.elementMeta?.scope === ElementScope.character) {
            state.element.length_chars = state.element.chunk.length;
            if (state.element.length_chars > 0) {
                elements.push(state.element);
            }
            elements.push({
                chunk: character,
                line: state.lineNumber,
                x_chars: state.x,
                length_chars: 1,
                type: state.elementMeta.elementName,
            });
            state.elementMeta = null;
            state.element = {
                chunk: '',
                line: state.lineNumber,
                x_chars: state.x + 1,
                length_chars: -1,
                type: null,
            };
        }
        // new minimap element
        else if (
            state.elementMeta &&
            state.elementMeta.elementName !== state.element.type
        ) {
            state.element.length_chars = state.element.chunk.length;
            if (state.element.length_chars > 0) {
                elements.push(state.element);
            }

            state.element = {
                chunk: character,
                line: state.lineNumber,
                x_chars: state.x,
                length_chars: -1,
                type: state.elementMeta.elementName,
            };
        } else {
            state.element.chunk += character;
        }
        if (state.closingTagLength > 0) {
            state.closingTagLength--;
            // end of the element
            if (state.closingTagLength === 0) {
                if (state.parentElementMeta) {
                    state.elementMeta = state.parentElementMeta;
                    state.parentElementMeta = null;
                } else {
                    state.elementMeta = null;
                }
            }
        }
        state.x++;
    }
    state.element.length_chars = state.element.chunk.length;
    if (state.element.length_chars > 0) {
        elements.push(state.element);
    }

    const result = {
        chunks: elements,
        totalLines: state.lineNumber + 1,
        empty: isEmptyCard,
    };
    chunkPositionsCache.cacheResult(
        canvasId,
        nodeId,
        content,
        availableLineCharacters,
        result,
    );
    return result;
};
