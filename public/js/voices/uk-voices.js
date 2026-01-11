export const ukVoicePatterns = [
    /uk.*english/i,
    /british/i,
    /england/i,
    /daniel/i,
    /george/i,
    /hazel/i,
    /susan/i,
    /oliver/i,
    /en-gb/i,
    /gb/i
];

export const ukVoiceNames = [
    'UK English Female',
    'UK English Male',
    'British Female',
    'British Male',
    'English Female',
    'English Male',
    'Scottish English Female',
    'English United Kingdom',
    'Google UK English Female',
    'Google UK English Male',
    'Microsoft Hazel Desktop',
    'Microsoft Susan Desktop',
    'Microsoft George Desktop',
    'Daniel',
    'Kate',
    'Oliver',
    'Serena'
];

export function filterUKVoices(voices) {
    return voices.filter(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();

        if (lang === 'en-gb') return true;

        return ukVoicePatterns.some(pattern => pattern.test(name)) ||
            ukVoiceNames.some(ukName => name.includes(ukName.toLowerCase()));
    });
}

export function isUKVoice(voice) {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();

    if (lang === 'en-gb') return true;

    return ukVoicePatterns.some(pattern => pattern.test(name)) ||
        ukVoiceNames.some(ukName => name.includes(ukName.toLowerCase()));
}

export const ukVoiceMetadata = {
    region: 'UK',
    fullName: 'United Kingdom',
    accents: ['British', 'Scottish', 'Welsh', 'Northern Irish'],
    ieltsRelevance: 'high',
    priority: 1
};
