import { chineseMessages } from 'src/lang/chinese-messages';
import { tx } from 'src/lang/translate';

export const lang = new Proxy(chineseMessages, {
    get(target, key, receiver) {
        const value: unknown = Reflect.get(target, key, receiver);
        return typeof value === 'string' ? tx(value) : value;
    },
});
