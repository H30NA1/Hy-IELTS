export const usVoicePatterns = [
    /us.*english/i,
    /american/i,
    /america/i,
    /united.*states/i,
    /zira/i,
    /david/i,
    /mark/i,
    /en-us/i,
    /samantha/i,
    /alex/i
];

export const usVoiceNames = [
    'US English Female',
    'US English Male',
    'American Female',
    'American Male',
    'English United States',
    'Google US English',
    'Microsoft Zira Desktop',
    'Microsoft David Desktop',
    'Microsoft Mark Desktop',
    'Samantha',
    'Alex',
    'Victoria',
    'Allison',
    'Tom',
    'Karen',
    'Moira'
];

export function filterUSVoices(voices) {
    return voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();

        if (lang === 'en-us') return true;

        return usVoicePatterns.some(pattern => pattern.test(name)) ||
            usVoiceNames.some(usName => name.includes(usName.toLowerCase()));
    });
}

export function isUSVoice(voice) {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();

    if (lang === 'en-us') return true;

    return usVoicePatterns.some(pattern => pattern.test(name)) ||
        usVoiceNames.some(usName => name.includes(usName.toLowerCase()));
}

export const usVoiceMetadata = {
    region: 'US',
    fullName: 'United States',
    accents: ['American', 'California', 'New York', 'Southern'],
    ieltsRelevance: 'high',
    priority: 1
};
