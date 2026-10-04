import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    language: 'en',
    getLanguage: vi.fn<[], string>(),
}));
vi.mock('obsidian', () => ({
    getLanguage: mocks.getLanguage,
}));

import { englishMessages } from 'src/lang/english-messages';
import { chineseMessages } from 'src/lang/chinese-messages';
import { lang } from 'src/lang/lang';
import { hotkeysLang } from 'src/lang/hotkeys-lang';
import {
    getInterfaceLanguage,
    normalizeInterfaceLanguage,
    setInterfaceLanguage,
} from 'src/lang/interface-language';
import { tx } from 'src/lang/translate';

beforeEach(() => {
    mocks.language = 'en';
    mocks.getLanguage.mockReset().mockImplementation(() => mocks.language);
    setInterfaceLanguage('auto');
});
afterEach(() => {
    vi.unstubAllGlobals();
});

describe('interface language', () => {
    it('reads the public language API instead of the legacy preference', () => {
        vi.stubGlobal('localStorage', { getItem: () => 'zh' });
        expect(getInterfaceLanguage()).toBe('en');
        expect(mocks.getLanguage).toHaveBeenCalledOnce();
    });
    it('does not read the app language for an explicit plugin preference', () => {
        setInterfaceLanguage('zh');
        expect(getInterfaceLanguage()).toBe('zh');
        setInterfaceLanguage('en');
        expect(getInterfaceLanguage()).toBe('en');
        expect(mocks.getLanguage).not.toHaveBeenCalled();
    });
    it.each(['zh', 'zh-CN', 'zh_TW', 'ZH-hk'])(
        'follows Chinese Obsidian locale %s',
        (locale) => {
            mocks.language = locale;
            expect(getInterfaceLanguage()).toBe('zh');
            expect(tx('显示选项')).toBe('显示选项');
        },
    );
    it.each(['en', 'en-GB', 'de', 'ja'])(
        'uses English for other Obsidian locales: %s',
        (locale) => {
            mocks.language = locale;
            expect(getInterfaceLanguage()).toBe('en');
            expect(tx('显示选项')).toBe('Display options');
        },
    );
    it('honors an explicit preference and resolves command labels when read', () => {
        setInterfaceLanguage('zh');
        expect(lang.cmd_create_day_plan_document).toBe(
            '新建「日计划」九宫格文件',
        );
        expect(hotkeysLang.enable_edit_mode).toBe('编辑卡片');
        setInterfaceLanguage('en');
        expect(lang.cmd_create_day_plan_document).toBe('Create a day plan');
        expect(hotkeysLang.enable_edit_mode).toBe('Edit card');
    });
    it.each([null, undefined, 'fr', 1, {}])(
        'normalizes invalid preferences: %s',
        (value) => {
            expect(normalizeInterfaceLanguage(value)).toBe('auto');
        },
    );
    it('keeps unknown text as a fallback', () => {
        expect(tx('unregistered label')).toBe('unregistered label');
    });
    it('interpolates values without translating or reinterpreting user text', () => {
        const name = '我的布局 {1} <b> & $&';
        expect(tx('自定义 / {0}', name)).toBe(`Custom / ${name}`);
        setInterfaceLanguage('zh');
        expect(tx('自定义 / {0}', name)).toBe(`自定义 / ${name}`);
    });
    it('preserves named date-template tokens', () => {
        expect(
            tx(
                '支持 {date} {cn} {zh} {en} {en_full} {en_cap}。例如：## {date} {zh}',
            ),
        ).toContain('{date} {cn} {zh} {en} {en_full} {en_cap}');
    });
    it('covers every Chinese label in the existing language catalog', () => {
        const catalog: Readonly<Record<string, string>> = englishMessages;
        for (const value of Object.values(chineseMessages)) {
            if (typeof value === 'string' && /\p{Script=Han}/u.test(value)) {
                expect(catalog[value], value).toBeTruthy();
            }
        }
    });
    it('preserves interpolation tokens throughout the English catalog', () => {
        for (const [source, translated] of Object.entries(englishMessages)) {
            const tokens = (value: string) =>
                (value.match(/\{\d+\}/g) ?? []).sort();
            expect(tokens(translated), source).toEqual(tokens(source));
        }
    });
});
