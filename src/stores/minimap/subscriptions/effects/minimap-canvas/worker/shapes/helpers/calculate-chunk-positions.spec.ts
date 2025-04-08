import { describe, expect, test } from 'vitest';
import { calculateChunkPositions } from 'src/stores/minimap/subscriptions/effects/minimap-canvas/worker/shapes/helpers/calculate-chunk-positions';
import { N_CHARS_PER_LINE } from 'src/stores/minimap/subscriptions/effects/minimap-canvas/worker/consts/constants';
import { generateLoremIpsumWithMarkdown } from 'src/helpers/test-helpers/generate-lorem-ipsum-with.markdown';

describe('calculate-chunk-position', () => {
    test('case 1: bullet list and wikilink', () => {
        const input = '- [[link 1]]';
        const output = {
            chunks: [
                {
                    chunk: '- ',
                    line: 0,
                    x_chars: 0,
                    length_chars: 2,
                    type: 'bullet',
                },
                {
                    chunk: '[[link 1]]',
                    line: 0,
                    x_chars: 2,
                    length_chars: 10,
                    type: 'wikilink',
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });
    test('case 2: heading and bold text', () => {
        const input = '# **Bold Heading**';
        const output = {
            chunks: [
                {
                    chunk: '# **Bold Heading**',
                    line: 0,
                    x_chars: 0,
                    length_chars: 18,
                    type: 'heading',
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 3: strikethrough and highlight', () => {
        const input = '~~Strikethrough~~ ==Highlight==';
        const output = {
            chunks: [
                {
                    chunk: '~~Strikethrough~~',
                    line: 0,
                    x_chars: 0,
                    length_chars: 17,
                    type: 'strikethrough',
                },
                {
                    chunk: '==Highlight==',
                    line: 0,
                    x_chars: 18,
                    length_chars: 13,
                    type: 'highlight',
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 4: mixed wikilink and period', () => {
        const input = '[[Note]]. Text';
        const output = {
            chunks: [
                {
                    chunk: '[[Note]]',
                    line: 0,
                    x_chars: 0,
                    length_chars: 8,
                    type: 'wikilink',
                },
                {
                    chunk: '.',
                    line: 0,
                    x_chars: 8,
                    length_chars: 1,
                    type: 'period',
                },
                {
                    chunk: 'Text',
                    length_chars: 4,
                    line: 0,
                    type: null,
                    x_chars: 10,
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 5: multiple lines with bullets', () => {
        const input = '- Bullet 1\n- Bullet 2';
        const output = {
            chunks: [
                {
                    chunk: '- Bullet 1',
                    line: 0,
                    x_chars: 0,
                    length_chars: 10,
                    type: 'bullet',
                },
                {
                    chunk: '- Bullet 2',
                    line: 1,
                    x_chars: 0,
                    length_chars: 10,
                    type: 'bullet',
                },
            ],
            totalLines: 2,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 6: empty input', () => {
        const input = '';
        const output = {
            chunks: [
                {
                    chunk: 'empty',
                    length_chars: 5,
                    line: 0,
                    type: null,
                    x_chars: 0,
                },
            ],
            totalLines: 1,
            empty: true,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 7: highlight and text', () => {
        const input = '==Highlighted== text';
        const output = {
            chunks: [
                {
                    chunk: '==Highlighted==',
                    line: 0,
                    x_chars: 0,
                    length_chars: 15,
                    type: 'highlight',
                },
                {
                    chunk: 'text',
                    line: 0,
                    x_chars: 16,
                    length_chars: 4,
                    type: null,
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 8: multiline with mixed types', () => {
        const input = `# Heading\n- Bullet 1\n**Bold** text`;
        const output = {
            chunks: [
                {
                    chunk: '# Heading',
                    line: 0,
                    x_chars: 0,
                    length_chars: 9,
                    type: 'heading',
                },
                {
                    chunk: '- Bullet 1',
                    line: 1,
                    x_chars: 0,
                    length_chars: 10,
                    type: 'bullet',
                },
                {
                    chunk: '**Bold**',
                    line: 2,
                    x_chars: 0,
                    length_chars: 8,
                    type: 'bold_italic',
                },
                {
                    chunk: 'text',
                    line: 2,
                    x_chars: 9,
                    length_chars: 4,
                    type: null,
                },
            ],
            totalLines: 3,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 9: mixed wikilink, tag, and bold text', () => {
        const input = `[[Page]] #tag **Bold**`;
        const output = {
            chunks: [
                {
                    chunk: '[[Page]]',
                    line: 0,
                    x_chars: 0,
                    length_chars: 8,
                    type: 'wikilink',
                },
                {
                    chunk: '#tag',
                    line: 0,
                    x_chars: 9,
                    length_chars: 4,
                    type: 'tag',
                },
                {
                    chunk: '**Bold**',
                    line: 0,
                    x_chars: 14,
                    length_chars: 8,
                    type: 'bold_italic',
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 10: multiline bullets and strikethrough', () => {
        const input = `- Bullet 1\n~~Strikethrough~~\n- Bullet 2`;
        const output = {
            chunks: [
                {
                    chunk: '- Bullet 1',
                    line: 0,
                    x_chars: 0,
                    length_chars: 10,
                    type: 'bullet',
                },
                {
                    chunk: '~~Strikethrough~~',
                    line: 1,
                    x_chars: 0,
                    length_chars: 17,
                    type: 'strikethrough',
                },
                {
                    chunk: '- Bullet 2',
                    line: 2,
                    x_chars: 0,
                    length_chars: 10,
                    type: 'bullet',
                },
            ],
            totalLines: 3,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 11: long multiline text wrapping', () => {
        const input = `A long piece of text that wraps across\nmultiple lines and ends abruptly.`;
        const output = {
            chunks: [
                {
                    chunk: 'A',
                    length_chars: 1,
                    line: 0,
                    type: null,
                    x_chars: 0,
                },
                {
                    chunk: 'long',
                    line: 0,
                    x_chars: 2,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: 'piece',
                    line: 0,
                    x_chars: 7,
                    length_chars: 5,
                    type: null,
                },
                {
                    chunk: 'of',
                    line: 0,
                    x_chars: 13,
                    length_chars: 2,
                    type: null,
                },
                {
                    chunk: 'text',
                    line: 0,
                    x_chars: 16,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: 'that',
                    line: 0,
                    x_chars: 21,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: 'wraps',
                    line: 0,
                    x_chars: 26,
                    length_chars: 5,
                    type: null,
                },
                {
                    chunk: 'across',
                    line: 0,
                    x_chars: 32,
                    length_chars: 6,
                    type: null,
                },
                {
                    chunk: 'multiple',
                    line: 1,
                    x_chars: 0,
                    length_chars: 8,
                    type: null,
                },
                {
                    chunk: 'lines',
                    line: 1,
                    x_chars: 9,
                    length_chars: 5,
                    type: null,
                },
                {
                    chunk: 'and',
                    line: 1,
                    x_chars: 15,
                    length_chars: 3,
                    type: null,
                },
                {
                    chunk: 'ends',
                    line: 1,
                    x_chars: 19,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: 'abruptly',
                    line: 1,
                    x_chars: 24,
                    length_chars: 8,
                    type: null,
                },
                {
                    chunk: '.',
                    line: 1,
                    x_chars: 32,
                    length_chars: 1,
                    type: 'period',
                },
            ],
            totalLines: 2,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });
    test('case 12: tag and simple text', () => {
        const input = '#tag simple text';
        const output = {
            chunks: [
                {
                    chunk: '#tag',
                    line: 0,
                    x_chars: 0,
                    length_chars: 4,
                    type: 'tag',
                },
                {
                    chunk: 'simple',
                    line: 0,
                    x_chars: 5,
                    length_chars: 6,
                    type: null,
                },
                {
                    chunk: 'text',
                    line: 0,
                    x_chars: 12,
                    length_chars: 4,
                    type: null,
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 13: multiline with tags and text', () => {
        const input = '#tag1\nSome text #tag2\nAnother line.';
        const output = {
            chunks: [
                {
                    chunk: '#tag1',
                    line: 0,
                    x_chars: 0,
                    length_chars: 5,
                    type: 'tag',
                },
                {
                    chunk: 'Some',
                    line: 1,
                    x_chars: 0,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: 'text',
                    line: 1,
                    x_chars: 5,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: '#tag2',
                    line: 1,
                    x_chars: 10,
                    length_chars: 5,
                    type: 'tag',
                },
                {
                    chunk: 'Another',
                    line: 2,
                    x_chars: 0,
                    length_chars: 7,
                    type: null,
                },
                {
                    chunk: 'line',
                    line: 2,
                    x_chars: 8,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: '.',
                    line: 2,
                    x_chars: 12,
                    length_chars: 1,
                    type: 'period',
                },
            ],
            totalLines: 3,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 14: tags, text, and bold in one line', () => {
        const input = '#tag **Bold text** #another-tag';
        const output = {
            chunks: [
                {
                    chunk: '#tag',
                    line: 0,
                    x_chars: 0,
                    length_chars: 4,
                    type: 'tag',
                },
                {
                    chunk: '**Bold text**',
                    line: 0,
                    x_chars: 5,
                    length_chars: 13,
                    type: 'bold_italic',
                },
                {
                    chunk: '#another-tag',
                    line: 0,
                    x_chars: 19,
                    length_chars: 12,
                    type: 'tag',
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 15: long paragraph with mixed content', () => {
        const input = `#tag1 Text with **bold** and [[links]] along with more text, ==highlights==, and another #tag2.`;
        const output = {
            chunks: [
                {
                    chunk: '#tag1',
                    line: 0,
                    x_chars: 0,
                    length_chars: 5,
                    type: 'tag',
                },
                {
                    chunk: 'Text',
                    line: 0,
                    x_chars: 6,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: 'with',
                    line: 0,
                    x_chars: 11,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: '**bold**',
                    line: 0,
                    x_chars: 16,
                    length_chars: 8,
                    type: 'bold_italic',
                },
                {
                    chunk: 'and',
                    line: 0,
                    x_chars: 25,
                    length_chars: 3,
                    type: null,
                },
                {
                    chunk: '[[links]]',
                    line: 0,
                    x_chars: 29,
                    length_chars: 9,
                    type: 'wikilink',
                },
                {
                    chunk: 'along',
                    line: 0,
                    x_chars: 39,
                    length_chars: 5,
                    type: null,
                },
                {
                    chunk: 'with',
                    line: 0,
                    x_chars: 45,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: 'more',
                    line: 0,
                    x_chars: 50,
                    length_chars: 4,
                    type: null,
                },
                {
                    chunk: 'tex',
                    line: 0,
                    x_chars: 55,
                    length_chars: 3,
                    type: null,
                },
                {
                    chunk: 't',
                    line: 1,
                    x_chars: 0,
                    length_chars: 1,
                    type: null,
                },
                {
                    chunk: ',',
                    line: 1,
                    x_chars: 1,
                    length_chars: 1,
                    type: 'comma',
                },
                {
                    chunk: '==highlights==',
                    line: 1,
                    x_chars: 3,
                    length_chars: 14,
                    type: 'highlight',
                },
                {
                    chunk: ',',
                    line: 1,
                    x_chars: 17,
                    length_chars: 1,
                    type: 'comma',
                },
                {
                    chunk: 'and',
                    line: 1,
                    x_chars: 19,
                    length_chars: 3,
                    type: null,
                },
                {
                    chunk: 'another',
                    line: 1,
                    x_chars: 23,
                    length_chars: 7,
                    type: null,
                },
                {
                    chunk: '#tag2',
                    line: 1,
                    x_chars: 31,
                    length_chars: 5,
                    type: 'tag',
                },
                {
                    chunk: '.',
                    line: 1,
                    x_chars: 36,
                    length_chars: 1,
                    type: 'period',
                },
            ],
            totalLines: 2,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 16: tag and highlight', () => {
        const input = '#tag ==highlighted text==';
        const output = {
            chunks: [
                {
                    chunk: '#tag',
                    line: 0,
                    x_chars: 0,
                    length_chars: 4,
                    type: 'tag',
                },
                {
                    chunk: '==highlighted text==',
                    line: 0,
                    x_chars: 5,
                    length_chars: 20,
                    type: 'highlight',
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 17: heading and bold text', () => {
        const input = '_italic text_\n*italic text*';
        const output = {
            chunks: [
                {
                    chunk: '_italic text_',
                    line: 0,
                    x_chars: 0,
                    length_chars: 13,
                    type: 'bold_italic',
                },
                {
                    chunk: '*italic text*',
                    line: 1,
                    x_chars: 0,
                    length_chars: 13,
                    type: 'bold_italic',
                },
            ],
            totalLines: 2,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 18: abbreviation with period', () => {
        const input = 'Mr. Smith.';
        const output = {
            chunks: [
                {
                    chunk: 'Mr.',
                    length_chars: 3,
                    line: 0,
                    type: null,
                    x_chars: 0,
                },
                {
                    chunk: 'Smith',
                    length_chars: 5,
                    line: 0,
                    type: null,
                    x_chars: 4,
                },
                {
                    chunk: '.',
                    length_chars: 1,
                    line: 0,
                    type: 'period',
                    x_chars: 9,
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });
    test('case 19: standalone period', () => {
        const input = 'This is a sentence. This is another sentence.';
        const output = {
            chunks: [
                {
                    chunk: 'This',
                    length_chars: 4,
                    line: 0,
                    type: null,
                    x_chars: 0,
                },
                {
                    chunk: 'is',
                    length_chars: 2,
                    line: 0,
                    type: null,
                    x_chars: 5,
                },
                {
                    chunk: 'a',
                    length_chars: 1,
                    line: 0,
                    type: null,
                    x_chars: 8,
                },
                {
                    chunk: 'sentence',
                    length_chars: 8,
                    line: 0,
                    type: null,
                    x_chars: 10,
                },
                {
                    chunk: '.',
                    length_chars: 1,
                    line: 0,
                    type: 'period',
                    x_chars: 18,
                },
                {
                    chunk: 'This',
                    length_chars: 4,
                    line: 0,
                    type: null,
                    x_chars: 20,
                },
                {
                    chunk: 'is',
                    length_chars: 2,
                    line: 0,
                    type: null,
                    x_chars: 25,
                },
                {
                    chunk: 'another',
                    length_chars: 7,
                    line: 0,
                    type: null,
                    x_chars: 28,
                },
                {
                    chunk: 'sentence',
                    length_chars: 8,
                    line: 0,
                    type: null,
                    x_chars: 36,
                },
                {
                    chunk: '.',
                    length_chars: 1,
                    line: 0,
                    type: 'period',
                    x_chars: 44,
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 20: abbreviation', () => {
        const input = 'i.e this is e.g. an example.';
        const output = {
            chunks: [
                {
                    chunk: 'i.e',
                    length_chars: 3,
                    line: 0,
                    type: null,
                    x_chars: 0,
                },
                {
                    chunk: 'this',
                    length_chars: 4,
                    line: 0,
                    type: null,
                    x_chars: 4,
                },
                {
                    chunk: 'is',
                    length_chars: 2,
                    line: 0,
                    type: null,
                    x_chars: 9,
                },
                {
                    chunk: 'e.g.',
                    length_chars: 4,
                    line: 0,
                    type: null,
                    x_chars: 12,
                },
                {
                    chunk: 'an',
                    length_chars: 2,
                    line: 0,
                    type: null,
                    x_chars: 17,
                },
                {
                    chunk: 'example',
                    length_chars: 7,
                    line: 0,
                    type: null,
                    x_chars: 20,
                },
                {
                    chunk: '.',
                    length_chars: 1,
                    line: 0,
                    type: 'period',
                    x_chars: 27,
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 21: number with period', () => {
        const input = 'The number is 0.12.';
        const output = {
            chunks: [
                {
                    chunk: 'The',
                    length_chars: 3,
                    line: 0,
                    type: null,
                    x_chars: 0,
                },
                {
                    chunk: 'number',
                    length_chars: 6,
                    line: 0,
                    type: null,
                    x_chars: 4,
                },
                {
                    chunk: 'is',
                    length_chars: 2,
                    line: 0,
                    type: null,
                    x_chars: 11,
                },
                {
                    chunk: '0.12',
                    length_chars: 4,
                    line: 0,
                    type: null,
                    x_chars: 14,
                },
                {
                    chunk: '.',
                    length_chars: 1,
                    line: 0,
                    type: 'period',
                    x_chars: 18,
                },
            ],
            totalLines: 1,
            empty: false,
        };

        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case 22', () => {
        const input = 'This is a word.) This is another word.';
        const output = {
            chunks: [
                {
                    chunk: 'This',
                    length_chars: 4,
                    line: 0,
                    type: null,
                    x_chars: 0,
                },
                {
                    chunk: 'is',
                    length_chars: 2,
                    line: 0,
                    type: null,
                    x_chars: 5,
                },
                {
                    chunk: 'a',
                    length_chars: 1,
                    line: 0,
                    type: null,
                    x_chars: 8,
                },
                {
                    chunk: 'word',
                    length_chars: 4,
                    line: 0,
                    type: null,
                    x_chars: 10,
                },
                {
                    chunk: '.',
                    length_chars: 1,
                    line: 0,
                    type: 'period',
                    x_chars: 14,
                },
                {
                    chunk: ')',
                    length_chars: 1,
                    line: 0,
                    type: null,
                    x_chars: 15,
                },
                {
                    chunk: 'This',
                    length_chars: 4,
                    line: 0,
                    type: null,
                    x_chars: 17,
                },
                {
                    chunk: 'is',
                    length_chars: 2,
                    line: 0,
                    type: null,
                    x_chars: 22,
                },
                {
                    chunk: 'another',
                    length_chars: 7,
                    line: 0,
                    type: null,
                    x_chars: 25,
                },
                {
                    chunk: 'word',
                    length_chars: 4,
                    line: 0,
                    type: null,
                    x_chars: 33,
                },
                {
                    chunk: '.',
                    length_chars: 1,
                    line: 0,
                    type: 'period',
                    x_chars: 37,
                },
            ],
            empty: false,
            totalLines: 1,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case: single special character ', () => {
        const input = `- [99-07-12 17:28] Set "created" to "1999-06-12T08:38"`;
        const output = {
            chunks: [
                {
                    chunk: '- [99-07-12 17:28] Set "created" to "1999-06-12T08:38"',
                    line: 0,
                    x_chars: 0,
                    length_chars: 54,
                    type: 'bullet',
                },
            ],
            totalLines: 1,
            empty: false,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case: tasks', () => {
        const input = [
            `- [x] task 1 #important text. text`,
            '- [ ] task 2 [[attachment]] #medium',
            'description.',
        ].join('\n');
        const output = {
            chunks: [
                {
                    chunk: '- [x] task 1 ',
                    line: 0,
                    x_chars: 0,
                    length_chars: 13,
                    type: 'task',
                },
                {
                    chunk: '#important',
                    line: 0,
                    x_chars: 13,
                    length_chars: 10,
                    type: 'tag',
                },
                {
                    chunk: ' text. text',
                    line: 0,
                    x_chars: 23,
                    length_chars: 11,
                    type: 'task',
                },

                {
                    chunk: '- [ ] task 2 ',
                    line: 1,
                    x_chars: 0,
                    length_chars: 13,
                    type: 'task',
                },
                {
                    chunk: '[[attachment]]',
                    line: 1,
                    x_chars: 13,
                    length_chars: 14,
                    type: 'wikilink',
                },
                {
                    chunk: ' ',
                    length_chars: 1,
                    line: 1,
                    type: 'task',
                    x_chars: 27,
                },
                {
                    chunk: '#medium',
                    line: 1,
                    x_chars: 28,
                    length_chars: 7,
                    type: 'tag',
                },
                {
                    chunk: 'description.',
                    line: 2,
                    x_chars: 0,
                    length_chars: 12,
                    type: 'task',
                },
            ],
            totalLines: 3,
            empty: false,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case: tags', () => {
        const input = `#^word #!word  #\`word #%word #?word #"word #~word #\\word`;
        const output = {
            chunks: [
                {
                    chunk: '#^word',
                    length_chars: 6,
                    line: 0,
                    type: null,
                    x_chars: 0,
                },
                {
                    chunk: '#!word',
                    length_chars: 6,
                    line: 0,
                    type: null,
                    x_chars: 7,
                },
                {
                    chunk: '#`word',
                    length_chars: 6,
                    line: 0,
                    type: null,
                    x_chars: 15,
                },
                {
                    chunk: '#%word',
                    length_chars: 6,
                    line: 0,
                    type: null,
                    x_chars: 22,
                },
                {
                    chunk: '#?word',
                    length_chars: 6,
                    line: 0,
                    type: null,
                    x_chars: 29,
                },
                {
                    chunk: '#"word',
                    length_chars: 6,
                    line: 0,
                    type: null,
                    x_chars: 36,
                },
                {
                    chunk: '#~word',
                    length_chars: 6,
                    line: 0,
                    type: null,
                    x_chars: 43,
                },
                {
                    chunk: '#\\word',
                    length_chars: 6,
                    line: 0,
                    type: null,
                    x_chars: 50,
                },
            ],
            totalLines: 1,
            empty: false,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case: period inside highlight', () => {
        const input = '==word1. word2== #tag word3.';
        const output = {
            chunks: [
                {
                    chunk: '==word1. word2==',
                    line: 0,
                    x_chars: 0,
                    length_chars: 16,
                    type: 'highlight',
                },
                {
                    chunk: '#tag',
                    line: 0,
                    x_chars: 17,
                    length_chars: 4,
                    type: 'tag',
                },
                {
                    chunk: 'word3',
                    line: 0,
                    x_chars: 22,
                    length_chars: 5,
                    type: null,
                },
                {
                    chunk: '.',
                    line: 0,
                    x_chars: 27,
                    length_chars: 1,
                    type: 'period',
                },
            ],
            totalLines: 1,
            empty: false,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case: bold inside highlight', () => {
        const input = '==word1. word2. **bold** word3== word4';
        const output = {
            chunks: [
                {
                    chunk: '==word1. word2. ',
                    line: 0,
                    x_chars: 0,
                    length_chars: 16,
                    type: 'highlight',
                },
                {
                    chunk: '**bold**',
                    line: 0,
                    x_chars: 16,
                    length_chars: 8,
                    type: 'bold_italic',
                },
                {
                    chunk: ' word3==',
                    line: 0,
                    x_chars: 24,
                    length_chars: 8,
                    type: 'highlight',
                },
                {
                    chunk: 'word4',
                    line: 0,
                    x_chars: 33,
                    length_chars: 5,
                    type: null,
                },
            ],
            totalLines: 1,
            empty: false,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });
    test('case: multi line highlight', () => {
        const input =
            '==word1, word2. **bold**\n' +
            'word3\n' +
            'word4== word5 #tag word6.';
        const output = {
            chunks: [
                {
                    chunk: '==word1, word2. ',
                    line: 0,
                    x_chars: 0,
                    length_chars: 16,
                    type: 'highlight',
                },
                {
                    chunk: '**bold**',
                    line: 0,
                    x_chars: 16,
                    length_chars: 8,
                    type: 'bold_italic',
                },
                {
                    chunk: 'word3',
                    line: 1,
                    x_chars: 0,
                    length_chars: 5,
                    type: 'highlight',
                },
                {
                    chunk: 'word4==',
                    line: 2,
                    x_chars: 0,
                    length_chars: 7,
                    type: 'highlight',
                },
                {
                    chunk: 'word5',
                    line: 2,
                    x_chars: 8,
                    length_chars: 5,
                    type: null,
                },
                {
                    chunk: '#tag',
                    line: 2,
                    x_chars: 14,
                    length_chars: 4,
                    type: 'tag',
                },
                {
                    chunk: 'word6',
                    line: 2,
                    x_chars: 19,
                    length_chars: 5,
                    type: null,
                },
                {
                    chunk: '.',
                    line: 2,
                    x_chars: 24,
                    length_chars: 1,
                    type: 'period',
                },
            ],
            totalLines: 3,
            empty: false,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });
    test('case: task with a tag', () => {
        const input =
            '- [ ] task word1. word2, #tag _italic_ word3.\n' +
            'word4. _italic_';
        const output = {
            chunks: [
                {
                    chunk: '- [ ] task word1. word2, ',
                    line: 0,
                    x_chars: 0,
                    length_chars: 25,
                    type: 'task',
                },
                {
                    chunk: '#tag',
                    line: 0,
                    x_chars: 25,
                    length_chars: 4,
                    type: 'tag',
                },
                {
                    chunk: ' ',
                    line: 0,
                    x_chars: 29,
                    length_chars: 1,
                    type: 'task',
                },
                {
                    chunk: '_italic_',
                    line: 0,
                    x_chars: 30,
                    length_chars: 8,
                    type: 'bold_italic',
                },
                {
                    chunk: ' word3.',
                    line: 0,
                    x_chars: 38,
                    length_chars: 7,
                    type: 'task',
                },
                {
                    chunk: 'word4',
                    line: 1,
                    x_chars: 0,
                    length_chars: 5,
                    type: null,
                },
                {
                    chunk: '.',
                    line: 1,
                    x_chars: 5,
                    length_chars: 1,
                    type: 'period',
                },
                {
                    chunk: '_italic_',
                    line: 1,
                    x_chars: 7,
                    length_chars: 8,
                    type: 'bold_italic',
                },
            ],
            totalLines: 2,
            empty: false,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case: bold at the end of highlight', () => {
        const input = '==word1 **bold**== word2';
        const output = {
            chunks: [
                {
                    chunk: '==word1 ',
                    line: 0,
                    x_chars: 0,
                    length_chars: 8,
                    type: 'highlight',
                },
                {
                    chunk: '**bold**',
                    line: 0,
                    x_chars: 8,
                    length_chars: 8,
                    type: 'bold_italic',
                },
                {
                    chunk: '==',
                    line: 0,
                    x_chars: 16,
                    length_chars: 2,
                    type: 'highlight',
                },
                {
                    chunk: 'word2',
                    line: 0,
                    x_chars: 19,
                    length_chars: 5,
                    type: null,
                },
            ],
            totalLines: 1,
            empty: false,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case: heading wikilink', () => {
        const input = '[[file#heading]]';
        const output = {
            chunks: [
                {
                    chunk: '[[file#heading]]',
                    line: 0,
                    x_chars: 0,
                    length_chars: 16,
                    type: 'wikilink',
                },
            ],
            totalLines: 1,
            empty: false,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });

    test('case: should not detect italic with a space after the tag', () => {
        const input = 'word1 * word2* word3';
        const output = {
            chunks: [
                {
                    chunk: 'word1',
                    length_chars: 5,
                    line: 0,
                    type: null,
                    x_chars: 0,
                },
                {
                    chunk: '*',
                    line: 0,
                    x_chars: 6,
                    length_chars: 1,
                    type: null,
                },
                {
                    chunk: 'word2*',
                    line: 0,
                    x_chars: 8,
                    length_chars: 6,
                    type: null,
                },
                {
                    chunk: 'word3',
                    line: 0,
                    x_chars: 15,
                    length_chars: 5,
                    type: null,
                },
            ],
            totalLines: 1,
            empty: false,
        };
        const actual = calculateChunkPositions(input, N_CHARS_PER_LINE, '', '');
        expect(actual).toEqual(output);
    });
});

describe('performance-test: calculate-chunk-position', () => {
    test('performance: 10k iterations of random markdown text', () => {
        const loremIpsumLength = 100;

        const lines = Array.from({ length: 10 }).map(() => {
            return generateLoremIpsumWithMarkdown(loremIpsumLength);
        });
        // eslint-disable-next-line no-console
        console.log(lines.join('').length + ' characters');
        // eslint-disable-next-line no-console
        console.time('calculateWordPositions');
        for (let i = 0; i < lines.length; i++) {
            calculateChunkPositions(lines[i], N_CHARS_PER_LINE, '', '');
        }
        // eslint-disable-next-line no-console
        console.timeEnd('calculateWordPositions');
        expect(false).toBe(false);
    });
});
