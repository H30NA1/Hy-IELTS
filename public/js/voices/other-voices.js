export const indianVoicePatterns = [
    /indian/i,
    /india/i,
    /en-in/i,
    /hindi.*english/i
];

export const indianVoiceNames = [
    'Indian English Female',
    'Indian English Male',
    'English India',
    'Google Indian English',
    'Microsoft Heera Desktop',
    'Microsoft Ravi Desktop'
];

export const southAfricanVoicePatterns = [
    /south.*africa/i,
    /en-za/i,
    /afrikaans.*english/i
];

export const southAfricanVoiceNames = [
    'South African English Female',
    'South African English Male',
    'English South Africa',
    'Google South African English'
];

export const irishVoicePatterns = [
    /irish/i,
    /ireland/i,
    /en-ie/i
];

export const irishVoiceNames = [
    'Irish English Female',
    'Irish English Male',
    'English Ireland',
    'Google Irish English',
    'Moira'
];

export const canadianVoicePatterns = [
    /canadian/i,
    /canada/i,
    /en-ca/i
];

export const canadianVoiceNames = [
    'Canadian English Female',
    'Canadian English Male',
    'English Canada',
    'Google Canadian English',
    'Microsoft Linda Desktop'
];

export const newZealandVoicePatterns = [
    /new.*zealand/i,
    /en-nz/i,
    /kiwi/i
];

export const newZealandVoiceNames = [
    'English New Zealand',
    'Google New Zealand English'
];

export function filterIndianVoices(voices) {
    return voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();

        if (lang === 'en-in') return true;

        return indianVoicePatterns.some(pattern => pattern.test(name)) ||
            indianVoiceNames.some(inName => name.includes(inName.toLowerCase()));
    });
}

export function filterSouthAfricanVoices(voices) {
    return voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();

        if (lang === 'en-za') return true;

        return southAfricanVoicePatterns.some(pattern => pattern.test(name)) ||
            southAfricanVoiceNames.some(zaName => name.includes(zaName.toLowerCase()));
    });
}

export function filterIrishVoices(voices) {
    return voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();

        if (lang === 'en-ie') return true;

        return irishVoicePatterns.some(pattern => pattern.test(name)) ||
            irishVoiceNames.some(ieName => name.includes(ieName.toLowerCase()));
    });
}

export function filterCanadianVoices(voices) {
    return voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();

        if (lang === 'en-ca') return true;

        return canadianVoicePatterns.some(pattern => pattern.test(name)) ||
            canadianVoiceNames.some(caName => name.includes(caName.toLowerCase()));
    });
}

export function filterNewZealandVoices(voices) {
    return voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();

        if (lang === 'en-nz') return true;

        return newZealandVoicePatterns.some(pattern => pattern.test(name)) ||
            newZealandVoiceNames.some(nzName => name.includes(nzName.toLowerCase()));
    });
}

export const otherVoiceMetadata = {
    indian: {
        region: 'IN',
        fullName: 'India',
        ieltsRelevance: 'medium',
        priority: 3
    },
    southAfrican: {
        region: 'ZA',
        fullName: 'South Africa',
        ieltsRelevance: 'medium',
        priority: 3
    },
    irish: {
        region: 'IE',
        fullName: 'Ireland',
        ieltsRelevance: 'medium',
        priority: 3
    },
    canadian: {
        region: 'CA',
        fullName: 'Canada',
        ieltsRelevance: 'medium',
        priority: 2
    },
    newZealand: {
        region: 'NZ',
        fullName: 'New Zealand',
        ieltsRelevance: 'medium',
        priority: 3
    }
};
