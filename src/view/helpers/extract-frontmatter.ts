export const extractFrontmatter = (
    markdown: string,
): { body: string; frontmatter: string } => {
    const frontmatterRegex = /^---\n([\s\S]+?)\n---\n/;
    const match = markdown.match(frontmatterRegex);

    if (match) {
        const frontmatter = match[0];
        const data = markdown.slice(frontmatter.length);
        return { body: data, frontmatter: frontmatter.trim() + '\n' };
    } else {
        return { body: markdown, frontmatter: '' };
    }
};
