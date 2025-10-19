// Coqui TTS Provider Module
class CoquiTTSProvider {
    constructor() {
        this.serverUrl = 'http://localhost:5050';
        this.isAvailable = false;
        this.voices = [];
        this.currentAudio = null;
        this.audioQueue = [];
        this.isPlaying = false;
    }

    async initialize() {
        try {
            console.log('🎤 Checking Coqui TTS Server...');
            
            // Check if server is running
            const response = await fetch(`${this.serverUrl}/health`, {
                method: 'GET',
                timeout: 2000
            });
            
            if (response.ok) {
                const health = await response.json();
                console.log('✅ Coqui TTS Server is running:', health);
                this.isAvailable = true;
                
                // Load available voices
                await this.loadVoices();
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Coqui TTS Server not available:', error.message);
            this.isAvailable = false;
        }
        
        return false;
    }

    async loadVoices() {
        try {
            const response = await fetch(`${this.serverUrl}/api/tts/voices`);
            const data = await response.json();
            
            if (data.success) {
                this.voices = data.voices;
                console.log(`🎭 Loaded ${this.voices.length} Coqui TTS voices:`, this.voices);
            }
        } catch (error) {
            console.error('❌ Failed to load Coqui voices:', error);
        }
    }

    getRandomVoiceForSpeaker(speaker) {
        // Map speaker to voice type
        const voiceMap = {
            'male':     this.voices.filter(v => v.gender === 'male'),
            'female':   this.voices.filter(v => v.gender === 'female'),
            'narrator': this.voices.filter(v => v.accent === 'UK') // Prefer UK for narrator
        };

        const availableVoices = voiceMap[speaker] || this.voices;
        
        if (availableVoices.length === 0) {
            return this.voices[0]; // Fallback to first voice
        }

        // Random selection
        return availableVoices[Math.floor(Math.random() * availableVoices.length)];
    }

    async speak(text, voiceId = 'en-us', onStart = null, onEnd = null) {
        try {
            // Request audio from server
            const response = await fetch(`${this.serverUrl}/api/tts/synthesize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    voice: voiceId,
                    speed: 1.0
                })
            });

            if (!response.ok) {
                throw new Error(`TTS server error: ${response.status}`);
            }

            // Get audio blob
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Create and play audio
            const audio = new Audio(audioUrl);
            this.currentAudio = audio;

            audio.onplay = () => {
                console.log(`🔊 Playing Coqui TTS: "${text.substring(0, 50)}..."`);
                if (onStart) onStart();
            };

            audio.onended = () => {
                console.log(`✅ Finished Coqui TTS: "${text.substring(0, 50)}..."`);
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
                if (onEnd) onEnd();
            };

            audio.onerror = (error) => {
                console.error('❌ Audio playback error:', error);
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
                if (onEnd) onEnd();
            };

            await audio.play();

        } catch (error) {
            console.error('❌ Coqui TTS speak error:', error);
            if (onEnd) onEnd();
        }
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.audioQueue = [];
        this.isPlaying = false;
    }

    async clearCache() {
        try {
            const response = await fetch(`${this.serverUrl}/api/tts/clear-cache`, {
                method: 'POST'
            });
            const data = await response.json();
            console.log(`🗑️ Cleared Coqui TTS cache: ${data.cleared} files`);
        } catch (error) {
            console.error('❌ Failed to clear cache:', error);
        }
    }
}

// Export for use in other modules
window.CoquiTTSProvider = CoquiTTSProvider;

