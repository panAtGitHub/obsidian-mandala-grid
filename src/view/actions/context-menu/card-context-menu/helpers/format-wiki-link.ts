export const formatWikiLink = (target: string, embed = false) =>
    `${embed ? '!' : ''}[[${target}]]`;
