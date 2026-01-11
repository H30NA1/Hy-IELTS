import { filterUKVoices, isUKVoice, ukVoiceMetadata } from './uk-voices.js';
import { filterUSVoices, isUSVoice, usVoiceMetadata } from './us-voices.js';
import { filterAUVoices, isAUVoice, auVoiceMetadata } from './au-voices.js';
import {
    filterIndianVoices,
    filterSouthAfricanVoices,
    filterIrishVoices,
    filterCanadianVoices,
    filterNewZealandVoices,
    otherVoiceMetadata
} from './other-voices.js';

export class VoiceRegistry {
    constructor() {
        this.regionalFilters = {
            uk: { filter: filterUKVoices, check: isUKVoice, metadata: ukVoiceMetadata },
            us: { filter: filterUSVoices, check: isUSVoice, metadata: usVoiceMetadata },
            au: { filter: filterAUVoices, check: isAUVoice, metadata: auVoiceMetadata },
            in: { filter: filterIndianVoices, metadata: otherVoiceMetadata.indian },
            za: { filter: filterSouthAfricanVoices, metadata: otherVoiceMetadata.southAfrican },
            ie: { filter: filterIrishVoices, metadata: otherVoiceMetadata.irish },
            ca: { filter: filterCanadianVoices, metadata: otherVoiceMetadata.canadian },
            nz: { filter: filterNewZealandVoices, metadata: otherVoiceMetadata.newZealand }
        };

        this.categorizedVoices = null;
        this.allVoices = [];
    }

    getBrowserVoices() {
        const synth = window.speechSynthesis;
        const voices = synth.getVoices();

        return voices.filter(v =>
            v.lang.startsWith('en') ||
            v.lang.includes('English')
        );
    }

    categorizeVoices(voices) {
        const categorized = {
            uk: [],
            us: [],
            au: [],
            in: [],
            za: [],
            ie: [],
            ca: [],
            nz: [],
            other: []
        };

        voices.forEach(voice => {
            let assigned = false;

            for (const [region, config] of Object.entries(this.regionalFilters)) {
                if (config.check && config.check(voice)) {
                    categorized[region].push(voice);
                    assigned = true;
                    break;
                } else if (!config.check) {
                    const filtered = config.filter([voice]);
                    if (filtered.length > 0) {
                        categorized[region].push(voice);
                        assigned = true;
                        break;
                    }
                }
            }

            if (!assigned) {
                categorized.other.push(voice);
            }
        });

        return categorized;
    }

    loadVoices() {
        this.allVoices = this.getBrowserVoices();
        this.categorizedVoices = this.categorizeVoices(this.allVoices);
        return this.categorizedVoices;
    }

    getVoicesByRegion(region) {
        if (!this.categorizedVoices) {
            this.loadVoices();
        }

        return this.categorizedVoices[region.toLowerCase()] || [];
    }

    getAllEnglishVoices() {
        if (!this.allVoices || this.allVoices.length === 0) {
            this.loadVoices();
        }

        return this.allVoices;
    }

    getVoiceStats() {
        if (!this.categorizedVoices) {
            this.loadVoices();
        }

        const stats = {};
        for (const [region, voices] of Object.entries(this.categorizedVoices)) {
            stats[region] = voices.length;
        }
        stats.total = this.allVoices.length;

        return stats;
    }

    getHighPriorityVoices() {
        if (!this.categorizedVoices) {
            this.loadVoices();
        }

        return [
            ...this.categorizedVoices.uk,
            ...this.categorizedVoices.us,
            ...this.categorizedVoices.au
        ];
    }

    getMediumPriorityVoices() {
        if (!this.categorizedVoices) {
            this.loadVoices();
        }

        return [
            ...this.categorizedVoices.ca,
            ...this.categorizedVoices.in,
            ...this.categorizedVoices.za,
            ...this.categorizedVoices.ie,
            ...this.categorizedVoices.nz
        ];
    }

    detectVoiceRegion(voice) {
        for (const [region, config] of Object.entries(this.regionalFilters)) {
            if (config.check && config.check(voice)) {
                return region.toUpperCase();
            } else if (!config.check) {
                const filtered = config.filter([voice]);
                if (filtered.length > 0) {
                    return region.toUpperCase();
                }
            }
        }
        return 'OTHER';
    }
}

export const voiceRegistry = new VoiceRegistry();
