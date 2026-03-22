import { __stringifySets } from 'src/shared/test-helpers/stringify-sets';

export const __log__ = <T>(object: T, name: string, post = '') => {
    return `const ${name} = ${__stringifySets(object)} ${post}`;
};
