import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import {
    buildNewFileMandalaCellFormat,
    createDefaultMandalaCellFormat,
    getMandalaCellFormatRule,
    removeMandalaCellFormat,
    readMandalaCellFormat,
    writeMandalaCellFormat,
    writeDayPlanBodyFormat,
} from 'src/mandala-settings/state/frontmatter/mandala-cell-format';

describe('mandala cell format frontmatter', () => {
    it('reads daily body preferences without rewriting the old layer rules', () => {
        const yaml =
            'mandala_cell_format:\n  enabled: true\n  levels: {"2": {heading: 4, body: ordered-list}}';
        expect(readMandalaCellFormat(yaml, true).config.dayPlanBody).toBe(
            'ordered-list',
        );
        expect(
            readMandalaCellFormat(yaml + '\n  dayPlanBody: paragraph', true)
                .config.dayPlanBody,
        ).toBe('paragraph');
        expect(readMandalaCellFormat('', true).config.enabled).toBe(false);
        expect(
            readMandalaCellFormat(yaml + '\n  dayPlanBody: invalid', true)
                .valid,
        ).toBe(false);
        const record = {
            mandala_cell_format: {
                levels: { '2': { heading: 4 } },
                extra: 'keep',
            },
        };
        writeDayPlanBodyFormat(record, 'paragraph');
        expect(record.mandala_cell_format).toEqual({
            levels: { '2': { heading: 4 } },
            extra: 'keep',
            enabled: true,
            dayPlanBody: 'paragraph',
        });
    });
    it('uses the first three levels and a shared deeper rule by default', () => {
        const config = createDefaultMandalaCellFormat();

        expect(Object.keys(config.levels)).toEqual(['1', '2', '3']);
        expect(config.levels['1']).toEqual({
            heading: 2,
            body: 'unordered-list',
        });
        expect(config.levels['3']).toEqual({
            heading: 4,
            body: 'unordered-list',
        });
        expect(config.deeper.heading).toBe('none');
    });

    it('parses explicit rules and resolves missing levels', () => {
        const parsed = readMandalaCellFormat(
            [
                '---',
                'mandala_cell_format:',
                '  enabled: true',
                '  levels:',
                '    "1": { heading: 4, body: paragraph }',
                '  deeper: { heading: none, body: ordered-list }',
                '---',
            ].join('\n'),
        );

        expect(parsed.present).toBe(true);
        expect(parsed.valid).toBe(true);
        expect(parsed.config.enabled).toBe(true);
        expect(getMandalaCellFormatRule(parsed.config, 1)).toEqual({
            heading: 4,
            body: 'paragraph',
        });
        expect(getMandalaCellFormatRule(parsed.config, 3)).toEqual({
            heading: 4,
            body: 'unordered-list',
        });
        expect(getMandalaCellFormatRule(parsed.config, 4)).toEqual({
            heading: 'none',
            body: 'ordered-list',
        });
        expect(getMandalaCellFormatRule(parsed.config, 8)).toEqual({
            heading: 'none',
            body: 'ordered-list',
        });
    });

    it('rejects an invalid rule without enabling it at runtime', () => {
        const parsed = readMandalaCellFormat(
            [
                '---',
                'mandala_cell_format:',
                '  enabled: true',
                '  levels:',
                '    "1": { heading: 9, body: paragraph }',
                '  deeper: { heading: none, body: unordered-list }',
                '---',
            ].join('\n'),
        );

        expect(parsed.present).toBe(true);
        expect(parsed.valid).toBe(false);
        expect(parsed.config.enabled).toBe(true);
    });

    it('marks a malformed top-level preset as present but invalid', () => {
        const parsed = readMandalaCellFormat(
            ['---', 'mandala_cell_format: null', '---'].join('\n'),
        );

        expect(parsed.present).toBe(true);
        expect(parsed.valid).toBe(false);
    });

    it('fills omitted optional rule groups from defaults', () => {
        const parsed = readMandalaCellFormat(
            ['---', 'mandala_cell_format:', '  enabled: true', '---'].join(
                '\n',
            ),
        );

        expect(parsed.valid).toBe(true);
        expect(getMandalaCellFormatRule(parsed.config, 1)).toEqual({
            heading: 2,
            body: 'unordered-list',
        });
        expect(parsed.config.deeper).toEqual({
            heading: 'none',
            body: 'unordered-list',
        });
    });

    it('fills omitted fields inside a rule from that depth default', () => {
        const parsed = readMandalaCellFormat(
            [
                '---',
                'mandala_cell_format:',
                '  enabled: true',
                '  levels:',
                '    "1": { heading: 4 }',
                '  deeper: { body: ordered-list }',
                '---',
            ].join('\n'),
        );

        expect(parsed.valid).toBe(true);
        expect(parsed.config.levels['1']).toEqual({
            heading: 4,
            body: 'unordered-list',
        });
        expect(parsed.config.deeper).toEqual({
            heading: 'none',
            body: 'ordered-list',
        });
    });

    it('uses finite-mode defaults instead of the shared deeper rule', () => {
        const config = createDefaultMandalaCellFormat('unlimited', true);
        config.deeper = { heading: 1, body: 'ordered-list' };

        expect(getMandalaCellFormatRule(config, 4, 5)).toEqual({
            heading: 5,
            body: 'unordered-list',
        });
        expect(getMandalaCellFormatRule(config, 4)).toEqual({
            heading: 1,
            body: 'ordered-list',
        });
    });

    it('only builds a new-file preset when the global switch is enabled', () => {
        const settings = DEFAULT_SETTINGS();
        expect(buildNewFileMandalaCellFormat(settings)).toBeNull();

        settings.view.enableCellFormatPreset = true;
        const built = buildNewFileMandalaCellFormat(settings);
        expect(built?.enabled).toBe(true);
        expect(built?.levels['1']?.heading).toBe(2);
    });

    it('copies the configured global defaults into each new file', () => {
        const settings = DEFAULT_SETTINGS();
        settings.view.enableCellFormatPreset = true;
        settings.view.newFileCellFormat.levels['1'] = {
            heading: 4,
            body: 'ordered-list',
        };

        const built = buildNewFileMandalaCellFormat(settings);

        expect(built?.levels['1']).toEqual({
            heading: 4,
            body: 'ordered-list',
        });
        if (!built) throw new Error('Expected a new-file cell format');
        built.levels['1'].heading = 6;
        expect(settings.view.newFileCellFormat.levels['1']?.heading).toBe(4);
    });

    it('writes and removes only the dedicated frontmatter key', () => {
        const record: Record<string, unknown> = { keep: 'value' };
        writeMandalaCellFormat(
            record,
            createDefaultMandalaCellFormat('unlimited', true),
        );

        expect(record.keep).toBe('value');
        expect(record.mandala_cell_format).toBeDefined();
        removeMandalaCellFormat(record);
        expect(record).toEqual({ keep: 'value' });
    });
});
