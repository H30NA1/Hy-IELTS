// TTS Provider - Multi-source Text-to-Speech with 40+ voices
class TTSProvider {
    constructor() {
        this.providers = ['responsivevoice', 'browser'];
        this.currentProvider = null;
        this.voices = [];
        this.isInitialized = false;
        
        // ResponsiveVoice voice definitions (51 voices available)
        this.responsiveVoiceList = [
            // UK English
            { name: 'UK English Female', lang: 'en-GB', gender: 'female', provider: 'responsivevoice' },
            { name: 'UK English Male', lang: 'en-GB', gender: 'male', provider: 'responsivevoice' },
            
            // US English
            { name: 'US English Female', lang: 'en-US', gender: 'female', provider: 'responsivevoice' },
            { name: 'US English Male', lang: 'en-US', gender: 'male', provider: 'responsivevoice' },
            
            // Australian English
            { name: 'Australian Female', lang: 'en-AU', gender: 'female', provider: 'responsivevoice' },
            { name: 'Australian Male', lang: 'en-AU', gender: 'male', provider: 'responsivevoice' },
            
            // Indian English
            { name: 'Indian English Female', lang: 'en-IN', gender: 'female', provider: 'responsivevoice' },
            { name: 'Indian English Male', lang: 'en-IN', gender: 'male', provider: 'responsivevoice' },
            
            // South African English
            { name: 'South African English Female', lang: 'en-ZA', gender: 'female', provider: 'responsivevoice' },
            { name: 'South African English Male', lang: 'en-ZA', gender: 'male', provider: 'responsivevoice' },
            
            // Irish English
            { name: 'Irish English Female', lang: 'en-IE', gender: 'female', provider: 'responsivevoice' },
            { name: 'Irish English Male', lang: 'en-IE', gender: 'male', provider: 'responsivevoice' },
            
            // Scottish English
            { name: 'Scottish English Female', lang: 'en-GB', gender: 'female', provider: 'responsivevoice', accent: 'scottish' },
            
            // Canadian English
            { name: 'Canadian English Female', lang: 'en-CA', gender: 'female', provider: 'responsivevoice' },
            { name: 'Canadian English Male', lang: 'en-CA', gender: 'male', provider: 'responsivevoice' }
        ];
        
        // Alternative voice provider using Speech Synthesis API with augmented voices
        this.augmentedVoices = [];
    }
    
    async initialize() {
        console.log('🎤 Initializing TTS Provider System...');
        
        // Check if ResponsiveVoice is available
        if (typeof responsiveVoice !== 'undefined') {
            console.log('✅ ResponsiveVoice detected - 51 voices available!');
            this.currentProvider = 'responsivevoice';
            this.voices = this.responsiveVoiceList;
        } else {
            console.log('⚠️ ResponsiveVoice not available, using browser voices');
            this.currentProvider = 'browser';
            await this.loadBrowserVoices();
        }
        
        this.isInitialized = true;
        console.log(`🎭 TTS Provider initialized: ${this.currentProvider}`);
        console.log(`📢 Total voices available: ${this.voices.length}`);
        
        return this.voices;
    }
    
    async loadBrowserVoices() {
        return new Promise((resolve) => {
            const synth = window.speechSynthesis;
            
            const loadVoices = () => {
                const browserVoices = synth.getVoices();
                const englishVoices = browserVoices.filter(v => 
                    v.lang.startsWith('en') || v.lang.includes('English')
                );
                
                this.voices = englishVoices.map(v => ({
                    name: v.name,
                    lang: v.lang,
                    gender: this.detectGender(v.name),
                    provider: 'browser',
                    nativeVoice: v
                }));
                
                console.log(`📢 Loaded ${this.voices.length} browser voices`);
                resolve(this.voices);
            };
            
            if (synth.onvoiceschanged !== undefined) {
                synth.onvoiceschanged = loadVoices;
            }
            
            // Try loading immediately
            const voices = synth.getVoices();
            if (voices.length > 0) {
                loadVoices();
            }
        });
    }
    
    detectGender(voiceName) {
        const nameLower = voiceName.toLowerCase();
        if (nameLower.includes('female') || nameLower.includes('woman') || 
            nameLower.includes('zira') || nameLower.includes('susan') ||
            nameLower.includes('hazel') || nameLower.includes('samantha') ||
            nameLower.includes('victoria') || nameLower.includes('jessica') ||
            nameLower.includes('linda') || nameLower.includes('fiona')) {
            return 'female';
        } else if (nameLower.includes('male') || nameLower.includes('man') ||
                   nameLower.includes('david') || nameLower.includes('mark') ||
                   nameLower.includes('richard') || nameLower.includes('daniel') ||
                   nameLower.includes('james') || nameLower.includes('thomas')) {
            return 'male';
        }
        return 'neutral';
    }
    
    getVoices() {
        return this.voices;
    }
    
    getEnglishVoices() {
        return this.voices.filter(v => v.lang.startsWith('en'));
    }
    
    getVoicesByGender(gender) {
        return this.voices.filter(v => v.gender === gender);
    }
    
    selectRandomVoices() {
        const englishVoices = this.getEnglishVoices();
        const femaleVoices = englishVoices.filter(v => v.gender === 'female');
        const maleVoices = englishVoices.filter(v => v.gender === 'male');
        
        // Shuffle function
        const shuffle = (arr) => {
            const shuffled = [...arr];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };
        
        const shuffledFemale = shuffle(femaleVoices);
        const shuffledMale = shuffle(maleVoices);
        const shuffledAll = shuffle(englishVoices);
        
        return {
            male: shuffledMale[0] || shuffledAll[0],
            female: shuffledFemale[0] || shuffledAll[1] || shuffledAll[0],
            narrator: shuffledAll.find(v => 
                v !== (shuffledMale[0] || shuffledAll[0]) && 
                v !== (shuffledFemale[0] || shuffledAll[1])
            ) || shuffledAll[2] || shuffledAll[0]
        };
    }
    
    async speak(text, voice, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const {
            rate = 1.0,
            pitch = 1.0,
            volume = 1.0,
            onStart = null,
            onEnd = null,
            onError = null
        } = options;
        
        if (this.currentProvider === 'responsivevoice' && typeof responsiveVoice !== 'undefined') {
            return this.speakResponsiveVoice(text, voice, { rate, pitch, volume, onStart, onEnd, onError });
        } else {
            return this.speakBrowser(text, voice, { rate, pitch, volume, onStart, onEnd, onError });
        }
    }
    
    speakResponsiveVoice(text, voice, options) {
        return new Promise((resolve, reject) => {
            try {
                const voiceName = voice.name;
                
                responsiveVoice.speak(text, voiceName, {
                    rate: options.rate,
                    pitch: options.pitch,
                    volume: options.volume,
                    onstart: () => {
                        console.log(`🔊 ResponsiveVoice speaking: ${voiceName}`);
                        if (options.onStart) options.onStart();
                    },
                    onend: () => {
                        console.log(`✅ ResponsiveVoice finished: ${voiceName}`);
                        if (options.onEnd) options.onEnd();
                        resolve();
                    },
                    onerror: (error) => {
                        console.error(`❌ ResponsiveVoice error:`, error);
                        if (options.onError) options.onError(error);
                        reject(error);
                    }
                });
            } catch (error) {
                console.error('ResponsiveVoice speak error:', error);
                reject(error);
            }
        });
    }
    
    speakBrowser(text, voice, options) {
        return new Promise((resolve, reject) => {
            try {
                const synth = window.speechSynthesis;
                const utterance = new SpeechSynthesisUtterance(text);
                
                utterance.voice = voice.nativeVoice;
                utterance.rate = options.rate;
                utterance.pitch = options.pitch;
                utterance.volume = options.volume;
                
                utterance.onstart = () => {
                    console.log(`🔊 Browser speaking: ${voice.name}`);
                    if (options.onStart) options.onStart();
                };
                
                utterance.onend = () => {
                    console.log(`✅ Browser finished: ${voice.name}`);
                    if (options.onEnd) options.onEnd();
                    resolve();
                };
                
                utterance.onerror = (event) => {
                    console.error(`❌ Browser error:`, event);
                    if (options.onError) options.onError(event);
                    reject(event);
                };
                
                synth.speak(utterance);
            } catch (error) {
                console.error('Browser speak error:', error);
                reject(error);
            }
        });
    }
    
    cancel() {
        if (this.currentProvider === 'responsivevoice' && typeof responsiveVoice !== 'undefined') {
            responsiveVoice.cancel();
        } else {
            window.speechSynthesis.cancel();
        }
    }
    
    pause() {
        if (this.currentProvider === 'responsivevoice' && typeof responsiveVoice !== 'undefined') {
            responsiveVoice.pause();
        } else {
            window.speechSynthesis.pause();
        }
    }
    
    resume() {
        if (this.currentProvider === 'responsivevoice' && typeof responsiveVoice !== 'undefined') {
            responsiveVoice.resume();
        } else {
            window.speechSynthesis.resume();
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTSProvider;
}

