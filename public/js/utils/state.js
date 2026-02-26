/**
 * Global State Management
 * Handling application state using a simple store pattern
 */

const state = {
    userName: "Ưng Đức Thuận",
    currentSection: "grammar",
    sections: ["grammar", "listening", "reading", "writing", "speaking"],
    answers: {
        listening: {},
        reading: {},
        writing: {
            task1: "",
            task2: "",
            task1WordCount: 0,
            task2WordCount: 0
        },
        speaking: {
            part1: "",
            part2: "",
            part3: ""
        },
        grammar: {}
    },
    testData: null,
    startTime: null, // Will be set on start
    totalTimeSeconds: 9600, // 2 hours 40 minutes
    remainingTimeSeconds: 9600,
    testSubmitted: false,
    rulesAcknowledged: false,
    reviewMode: false,

    // Observers for state changes
    observers: [],

    // Subscribe to state changes
    subscribe(fn) {
        this.observers.push(fn);
    },

    // Notify observers
    notify(key, value) {
        this.observers.forEach(fn => fn(key, value, this));
    },

    // Update state helper
    update(key, value) {
        this[key] = value;
        this.notify(key, value);
    },

    // Set nested answer
    setAnswer(section, id, value) {
        if (!this.answers[section]) this.answers[section] = {};
        this.answers[section][id] = value;
    },

    // Helper to get section data regardless of structure (Array vs Object)
    getSectionData(sectionId) {
        if (!this.testData || !this.testData.sections) return null;

        if (Array.isArray(this.testData.sections)) {
            return this.testData.sections.find(s => s.id === sectionId);
        } else {
            return this.testData.sections[sectionId];
        }
    }
};

export default state;
