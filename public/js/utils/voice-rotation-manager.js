import { voiceRegistry } from '../voices/voice-registry.js';

export class VoiceRotationManager {
    constructor() {
        this.isInitialized = false;
        this.availableVoices = [];
        this.recentlyUsedVoices = [];
        this.maxRecentHistory = 5;
        this.currentVoice = null;
        this.voiceCache = new Map();
    }

    async initialize() {
        return new Promise((resolve) => {
            const synth = window.speechSynthesis;

            const loadVoices = () => {
                voiceRegistry.loadVoices();
                this.availableVoices = voiceRegistry.getAllEnglishVoices();

                const stats = voiceRegistry.getVoiceStats();
                console.log('🎤 Voice Rotation Manager initialized');
                console.log('📊 Voice Statistics:', stats);

                this.isInitialized = true;
                resolve(this.availableVoices);
            };

            if (synth.onvoiceschanged !== undefined) {
                synth.onvoiceschanged = loadVoices;
            }

            const voices = synth.getVoices();
            if (voices.length > 0) {
                loadVoices();
            }
        });
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    isVoiceRecentlyUsed(voice) {
        return this.recentlyUsedVoices.some(v => v.name === voice.name);
    }

    addToRecentlyUsed(voice) {
        this.recentlyUsedVoices = [
            voice,
            ...this.recentlyUsedVoices.filter(v => v.name !== voice.name)
        ].slice(0, this.maxRecentHistory);
    }

    filterAvailableVoices() {
        if (this.availableVoices.length <= this.maxRecentHistory) {
            return this.availableVoices;
        }

        const available = this.availableVoices.filter(
            v => !this.isVoiceRecentlyUsed(v)
        );

        return available.length > 0 ? available : this.availableVoices;
    }

    selectRandomVoice(voices) {
        if (!voices || voices.length === 0) return null;

        const shuffled = this.shuffleArray(voices);
        return shuffled[0];
    }

    getNextVoice() {
        if (!this.isInitialized) {
            console.warn('⚠️ VoiceRotationManager not initialized');
            return null;
        }

        if (this.availableVoices.length === 0) {
            console.warn('⚠️ No voices available');
            return null;
        }

        const highPriority = voiceRegistry.getHighPriorityVoices();
        const mediumPriority = voiceRegistry.getMediumPriorityVoices();

        const availableHigh = highPriority.filter(v => !this.isVoiceRecentlyUsed(v));
        const availableMedium = mediumPriority.filter(v => !this.isVoiceRecentlyUsed(v));
        const availableAll = this.filterAvailableVoices();

        let selectedVoice = null;

        if (availableHigh.length > 0 && Math.random() < 0.7) {
            selectedVoice = this.selectRandomVoice(availableHigh);
        } else if (availableMedium.length > 0 && Math.random() < 0.5) {
            selectedVoice = this.selectRandomVoice(availableMedium);
        } else {
            selectedVoice = this.selectRandomVoice(availableAll);
        }

        if (selectedVoice) {
            this.currentVoice = selectedVoice;
            this.addToRecentlyUsed(selectedVoice);
        }

        return selectedVoice;
    }

    getVoiceByRegion(region) {
        if (!this.isInitialized) {
            console.warn('⚠️ VoiceRotationManager not initialized');
            return null;
        }

        const regionalVoices = voiceRegistry.getVoicesByRegion(region);

        if (regionalVoices.length === 0) {
            console.warn(`⚠️ No voices available for region: ${region}`);
            return this.getNextVoice();
        }

        const available = regionalVoices.filter(v => !this.isVoiceRecentlyUsed(v));
        const voicePool = available.length > 0 ? available : regionalVoices;

        const selectedVoice = this.selectRandomVoice(voicePool);

        if (selectedVoice) {
            this.currentVoice = selectedVoice;
            this.addToRecentlyUsed(selectedVoice);
        }

        return selectedVoice;
    }

    getCurrentVoice() {
        return this.currentVoice;
    }

    getVoiceInfo(voice) {
        if (!voice) return null;

        const region = voiceRegistry.detectVoiceRegion(voice);
        const gender = this.detectGender(voice.name);

        return {
            name: voice.name,
            lang: voice.lang,
            region,
            gender,
            localService: voice.localService,
            isDefault: voice.default
        };
    }

    detectGender(voiceName) {
        const nameLower = voiceName.toLowerCase();

        const femaleKeywords = [
            'female', 'woman', 'zira', 'susan', 'hazel',
            'samantha', 'victoria', 'jessica', 'linda',
            'fiona', 'karen', 'catherine', 'heera', 'moira'
        ];

        const maleKeywords = [
            'male', 'man', 'david', 'mark', 'richard',
            'daniel', 'james', 'thomas', 'george', 'oliver',
            'alex', 'tom', 'ravi', 'lee'
        ];

        if (femaleKeywords.some(keyword => nameLower.includes(keyword))) {
            return 'female';
        }

        if (maleKeywords.some(keyword => nameLower.includes(keyword))) {
            return 'male';
        }

        return 'neutral';
    }

    resetRotation() {
        this.recentlyUsedVoices = [];
        this.currentVoice = null;
        console.log('🔄 Voice rotation history reset');
    }

    getStats() {
        const voiceStats = voiceRegistry.getVoiceStats();

        return {
            totalVoices: this.availableVoices.length,
            recentlyUsed: this.recentlyUsedVoices.length,
            currentVoice: this.currentVoice ? this.currentVoice.name : null,
            byRegion: voiceStats
        };
    }

    generateRandomVoiceParameters() {
        const rateMin = 0.85;
        const rateMax = 1.15;
        const pitchMin = 0.9;
        const pitchMax = 1.1;
        const volumeMin = 0.9;
        const volumeMax = 1.0;

        const rate = rateMin + Math.random() * (rateMax - rateMin);
        const pitch = pitchMin + Math.random() * (pitchMax - pitchMin);
        const volume = volumeMin + Math.random() * (volumeMax - volumeMin);

        return {
            rate: Math.round(rate * 100) / 100,
            pitch: Math.round(pitch * 100) / 100,
            volume: Math.round(volume * 100) / 100
        };
    }

    speak(text, voice, options = {}) {
        return new Promise((resolve, reject) => {
            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(text);

            utterance.voice = voice;
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;

            utterance.onstart = () => {
                if (options.onStart) options.onStart();
            };

            utterance.onend = () => {
                if (options.onEnd) options.onEnd();
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('❌ Speech synthesis error:', event);
                if (options.onError) options.onError(event);
                reject(event);
            };

            synth.speak(utterance);
        });
    }

    stop() {
        const synth = window.speechSynthesis;
        synth.cancel();
    }

    pause() {
        const synth = window.speechSynthesis;
        synth.pause();
    }

    resume() {
        const synth = window.speechSynthesis;
        synth.resume();
    }

    isSpeaking() {
        return window.speechSynthesis.speaking;
    }
}

export const voiceRotationManager = new VoiceRotationManager();
