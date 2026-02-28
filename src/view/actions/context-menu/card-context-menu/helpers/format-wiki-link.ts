export const formatWikiLink = (target: string, embed = false, alias?: string) =>
    `${embed ? '!' : ''}[[${target}${alias ? `|${alias}` : ''}]]`;
