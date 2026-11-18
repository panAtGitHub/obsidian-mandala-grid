import { describe, expect, it } from 'vitest';
import { getTaskIdentities, toggleEmbeddedTask } from './toggle-embedded-task';

describe('toggleEmbeddedTask', () => {
    const displayed = '- [ ] first\n- [ ] second';
    const tasks = getTaskIdentities(displayed);
    const source =
        '---\nmandala: true\n---\n<!--section: 1-->\n' +
        displayed +
        '\n<!--section: 2-->\r\n- [ ] untouched';

    it('rejects stale task positions after insertions and reordering', () => {
        expect(
            toggleEmbeddedTask(
                source.replace(displayed, '- [ ] inserted\n' + displayed),
                '1',
                1,
                tasks,
                true,
            ),
        ).toBeNull();
        expect(
            toggleEmbeddedTask(
                source.replace(displayed, '- [ ] second\n- [ ] first'),
                '1',
                1,
                tasks,
                true,
            ),
        ).toBeNull();
    });

    it('commits two toggles without touching unrelated content', () => {
        const first = toggleEmbeddedTask(source, '1', 0, tasks, true);
        expect(first).toBe(source.replace('[ ] first', '[x] first'));
        expect(toggleEmbeddedTask(first!, '1', 1, tasks, true)).toBe(
            source
                .replace('[ ] first', '[x] first')
                .replace('[ ] second', '[x] second'),
        );
    });
});
