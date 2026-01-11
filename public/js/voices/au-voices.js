export const auVoicePatterns = [
    /australian/i,
    /australia/i,
    /en-au/i,
    /aussie/i
];

export const auVoiceNames = [
    'Australian Female',
    'Australian Male',
    'English Australia',
    'Google Australian English',
    'Microsoft Catherine Desktop',
    'Microsoft James Desktop',
    'Karen',
    'Lee'
];

export function filterAUVoices(voices) {
    return voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();

        if (lang === 'en-au') return true;

        return auVoicePatterns.some(pattern => pattern.test(name)) ||
            auVoiceNames.some(auName => name.includes(auName.toLowerCase()));
    });
}

export function isAUVoice(voice) {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();

    if (lang === 'en-au') return true;

    return auVoicePatterns.some(pattern => pattern.test(name)) ||
        auVoiceNames.some(auName => name.includes(auName.toLowerCase()));
}

export const auVoiceMetadata = {
    region: 'AU',
    fullName: 'Australia',
    accents: ['Australian'],
    ieltsRelevance: 'high',
    priority: 2
};
