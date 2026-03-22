export const generateLoremIpsumWithMarkdown = (length: number): string => {
    const words = [
        'lorem',
        'ipsum',
        'dolor',
        'sit',
        'amet',
        'consectetur',
        'adipiscing',
        'elit',
        'sed',
        'do',
        'eiusmod',
        'tempor',
        'incididunt',
        'ut',
        'labore',
        'et',
        'dolore',
        'magna',
        'aliqua',
        'enim',
        'ad',
        'minim',
        'veniam',
        '- Bullet',
        '#heading',
        '==highlight==',
        '**bold**',
        '~~strikethrough~~',
        '[[wikilink]]',
        '#tag',
    ];

    const result: string[] = [];
    for (let i = 0; i < length; i++) {
        const word = words[Math.floor(Math.random() * words.length)];
        result.push(word);
        if (Math.random() < 0.1) {
            // Add a newline randomly
            result.push('\n');
        }
    }

    return result.join(' ');
};
