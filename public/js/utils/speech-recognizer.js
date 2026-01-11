export class SpeechRecognizer {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.transcript = '';
        this.onResult = null;
        this.onError = null;
        this.onEnd = null;

        this.init();
    }

    init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('SpeechRecognition not supported in this browser.');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                this.transcript += finalTranscript + ' ';
            }

            if (this.onResult) {
                this.onResult({
                    final: this.transcript,
                    interim: interimTranscript,
                    full: this.transcript + interimTranscript
                });
            }
        };

        this.recognition.onerror = (event) => {
            if (this.onError) this.onError(event.error);
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            if (this.onEnd) this.onEnd();
        };
    }

    start(onResultCallback, onErrorCallback, onEndCallback) {
        if (!this.recognition) return false;
        if (this.isRecording) return true;

        this.transcript = '';
        this.onResult = onResultCallback;
        this.onError = onErrorCallback;
        this.onEnd = onEndCallback;

        try {
            this.recognition.start();
            this.isRecording = true;
            return true;
        } catch (e) {
            console.error('Failed to start recognition', e);
            return false;
        }
    }

    stop() {
        if (!this.recognition || !this.isRecording) return;
        this.recognition.stop();
        this.isRecording = false;
    }

    isSupported() {
        return !!this.recognition;
    }
}
