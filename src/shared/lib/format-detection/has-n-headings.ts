export const hasNHeadings = (input: string, n = 2): boolean => {
    const lines = input.split('\n');
    let count = 0;
    for (const line of lines) {
        if (/^((\t*)- )?#+ +/.test(line)) {
            count++;
            if (count >= n) return true;
        }
    }
    return false;
};
