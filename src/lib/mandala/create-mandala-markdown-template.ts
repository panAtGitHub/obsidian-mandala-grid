import { serializeSections } from 'src/mandala-v2';

const createInitialMandalaSections = () => {
    const sections: { sectionId: string; content: string }[] = [
        { sectionId: '1', content: '' },
    ];
    for (let i = 2; i <= 9; i += 1) {
        sections.push({ sectionId: String(i), content: '' });
    }
    return sections;
};

export const createMandalaMarkdownTemplate = () => {
    const frontmatter = `---\nmandala: true\n---\n`;
    return frontmatter + serializeSections(createInitialMandalaSections());
};
