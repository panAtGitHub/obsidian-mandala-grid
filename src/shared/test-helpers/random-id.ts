const dict = {
    adjectives: [
        'red',
        'blue',
        'green',
        'yellow',
        'purple',
        'happy',
        'sad',
        'angry',
        'tiny',
        'giant',
        'fast',
        'slow',
        'shiny',
        'bright',
        'dark',
        'fuzzy',
        'fluffy',
        'bouncy',
        'sneaky',
        'lazy',
        'brave',
        'silly',
        'witty',
        'noisy',
        'quiet',
        'spicy',
        'juicy',
        'crispy',
        'grumpy',
        'cheeky',
    ] as const,

    nouns: [
        'balloon',
        'tiger',
        'rocket',
        'panda',
        'cloud',
        'pizza',
        'star',
        'banana',
        'cactus',
        'unicorn',
        'dragon',
        'penguin',
        'waffle',
        'donut',
        'zebra',
        'lion',
        'kitten',
        'puppy',
        'octopus',
        'koala',
        'avocado',
        'rainbow',
        'cookie',
        'muffin',
        'pillow',
        'sloth',
        'monkey',
        'dolphin',
        'giraffe',
        'butterfly',
        'cupcake',
        'hamster',
    ],

    cities: [
        'paris',
        'tokyo',
        'sydney',
        'cairo',
        'mumbai',
        'berlin',
        'toronto',
        'moscow',
        'dubai',
        'seoul',
        'bangkok',
        'rome',
        'newyork',
        'istanbul',
        'capetown',
        'singapore',
        'buenosaires',
        'oslo',
        'lisbon',
        'rio',
        'athens',
        'havana',
        'mexicocity',
        'jakarta',
        'kualalumpur',
        'dublin',
        'vienna',
        'madrid',
        'london',
        'hongkong',
        'beijing',
        'prague',
    ] as const,
};
export class RandomId {
    private static usedIds = new Set<string>();

    private static generateComponent(type: keyof typeof dict): string {
        const array = dict[type];
        return array[Math.floor(Math.random() * array.length)];
    }

    static generateId(...schema: (keyof typeof dict)[]): string {
        let id: string | null = null;
        for (let i = 0; i < 100; i++) {
            id = schema.map((type) => this.generateComponent(type)).join('-');
            if (!this.usedIds.has(id)) {
                break;
            }
        }
        if (!id) throw new Error('could not generate an id');

        this.usedIds.add(id);
        return id;
    }
}
