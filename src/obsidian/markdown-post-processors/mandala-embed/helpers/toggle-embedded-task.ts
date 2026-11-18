import { MandalaSourceRuntime } from 'src/mandala-document/runtime/source-document-runtime';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';

const TASK_LINE_RE = /^([ \t]*[-*+]\s*\[)([ xX])(\].*)$/gmu;
const taskIdentity = (match: RegExpMatchArray) =>
    match[1].trimStart() + match[3].trimEnd();

export const getTaskIdentities = (content: string) =>
    Array.from(content.matchAll(TASK_LINE_RE), taskIdentity);

export const toggleEmbeddedTask = (
    markdown: string,
    section: string,
    taskIndex: number,
    expectedTasks: string[],
    checked: boolean,
) => {
    const { body } = extractFrontmatter(markdown);
    const runtime = new MandalaSourceRuntime(body);
    const range = runtime.getRange(section);
    if (
        !range ||
        runtime.index.sourceOrderedIds.indexOf(section) !==
            runtime.index.sourceOrderedIds.lastIndexOf(section)
    )
        return null;
    const content = runtime.getContent(section) ?? '';
    const matches = Array.from(content.matchAll(TASK_LINE_RE));
    const task = matches[taskIndex];
    if (
        !task ||
        task.index === undefined ||
        matches.length !== expectedTasks.length ||
        matches.some(
            (match, index) => taskIdentity(match) !== expectedTasks[index],
        )
    )
        return null;

    const offset =
        markdown.length -
        body.length +
        range.contentStart +
        task.index +
        task[1].length;
    if ((task[2].toLowerCase() === 'x') === checked) return markdown;
    return (
        markdown.slice(0, offset) +
        (checked ? 'x' : ' ') +
        markdown.slice(offset + 1)
    );
};
