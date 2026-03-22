import { serializeSections } from 'src/mandala-document/engine/serialize-sections';

const createInitialMandalaSections = () => {
    const sections: { sectionId: string; content: string }[] = [
        { sectionId: '1', content: '' },
    ];
    for (let i = 1; i <= 8; i += 1) {
        sections.push({ sectionId: `1.${i}`, content: '' });
    }
    return sections;
};

export const createMandalaMarkdownTemplate = () => {
    const frontmatter = `---\nmandala: true\n---\n`;
    return frontmatter + serializeSections(createInitialMandalaSections());
};
