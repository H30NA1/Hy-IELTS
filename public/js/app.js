import state from './utils/state.js';
import { api } from './utils/api.js';
import { grammar } from './modules/grammar.js';
import { listening } from './modules/listening.js';
import { reading } from './modules/reading.js';
import { writing } from './modules/writing.js';
import { speaking } from './modules/speaking.js';

class App {
    constructor() {
        console.log("App Constructed");
        this.init();
    }

    async init() {
        console.log("Initializing App...");

        // Setup Event Listeners immediately
        this.setupRulesModal();
        this.setupNavigation();
        this.setupSubmission();
        this.setupSubmission();
        this.setupGlobalTimers();
        this.setupThemeToggle();

        // Load Data
        try {
            const data = await api.getTestData();
            if (data) {
                state.update('testData', data);
                if (data.testTitle) {
                    const titleEl = document.getElementById('section-title-display');
                    if (titleEl) titleEl.textContent = data.testTitle;
                }
            }
            console.log("Data loaded successfully");
        } catch (e) {
            console.error("Failed to load data", e);
        }
    }

    setupRulesModal() {
        const btn = document.getElementById('acknowledge-rules-btn');
        const modal = document.getElementById('exam-rules-modal');
        if (btn && modal) {
            console.log("Attaching Rules Listener");
            btn.addEventListener('click', () => {
                console.log("Rules Acknowledged");
                modal.classList.remove('active');
                modal.style.display = 'none'; // Force hide
                state.rulesAcknowledged = true;
                this.startTest();
            });
        } else {
            console.error("Rules modal or button not found!");
        }
    }

    startTest() {
        state.startTime = Date.now();
        console.log("Starting Test...");
        this.switchSection(state.currentSection);
    }

    setupThemeToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                const isDark = document.body.classList.contains('dark-mode');
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                }
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });

            // Load saved preference
            if (localStorage.getItem('theme') === 'dark') {
                document.body.classList.add('dark-mode');
                const icon = toggleBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-sun';
            }
        }
    }

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });
    }

    switchSection(sectionId) {
        console.log("Switching to section:", sectionId);
        state.update('currentSection', sectionId);

        // Update Tabs
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionId);
        });

        // Show/Hide Section Containers
        document.querySelectorAll('.test-section').forEach(sec => {
            sec.classList.remove('active');
            if (sec.id === sectionId) sec.classList.add('active');
        });

        // Update Header Title (Optional, keep section name or test title)
        // document.getElementById('section-title-display').textContent = sectionId.toUpperCase();

        // Reset Global Buttons (Clone to clear old listeners) - IMPORTANT
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn && nextBtn) {
            const newPrev = prevBtn.cloneNode(true);
            const newNext = nextBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrev, prevBtn);
            nextBtn.parentNode.replaceChild(newNext, nextBtn);

            // Enable by default
            newPrev.disabled = false;
            newNext.disabled = false;
            newNext.style.display = 'inline-flex';
        }

        // Render Module
        try {
            switch (sectionId) {
                case 'grammar': grammar.render(); break;
                case 'listening': listening.render(); break;
                case 'reading': reading.render(); break;
                case 'writing': writing.render(); break;
                case 'speaking': speaking.render(); break;
            }
        } catch (e) {
            console.error(`Error rendering ${sectionId}:`, e);
        }
    }

    setupGlobalTimers() {
        const timeDisplay = document.getElementById('time-display');
        setInterval(() => {
            if (state.remainingTimeSeconds > 0 && !state.testSubmitted && state.rulesAcknowledged) {
                state.remainingTimeSeconds--;
                const h = Math.floor(state.remainingTimeSeconds / 3600);
                const m = Math.floor((state.remainingTimeSeconds % 3600) / 60);
                const s = state.remainingTimeSeconds % 60;
                if (timeDisplay) timeDisplay.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    setupSubmission() {
        const submitBtn = document.getElementById('submit-test-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                document.getElementById('submit-modal').classList.add('active');
            });
        }

        const cancelBtn = document.getElementById('cancel-submit');
        const confirmBtn = document.getElementById('confirm-submit');

        if (cancelBtn) cancelBtn.addEventListener('click', () => document.getElementById('submit-modal').classList.remove('active'));
        if (confirmBtn) confirmBtn.addEventListener('click', () => {
            document.getElementById('submit-modal').classList.remove('active');
            this.submitTest();
        });
    }

    async submitTest() {
        if (state.testSubmitted) return;
        state.testSubmitted = true;
        console.log("Submitting test...");

        try {
            // Check for speaking blob to upload
            if (state.answers.speaking && state.answers.speaking.part1 instanceof Blob) {
                // Upload logic here or inside api.submitTest wrapper
                const dateStr = new Date().toISOString().split('T')[0];
                await api.uploadSpeaking(state.answers.speaking.part1, state.userName, dateStr);
            }

            const submission = {
                answers: state.answers,
                timeSpent: state.totalTimeSeconds - state.remainingTimeSeconds,
                userName: state.userName
            };

            const result = await api.submitTest(submission);

            const resultsModal = document.getElementById('results-modal');
            if (resultsModal) {
                resultsModal.classList.add('active');
                document.getElementById('overall-band').textContent = result.results?.overallBand || "7.5";
            }

        } catch (e) {
            console.error("Submission failed", e);
            alert("Error submitting test. See console.");
            state.testSubmitted = false;
        }
    }
}

// Global Error Handler for Mobile/User debugging
window.onerror = function (msg, url, line) {
    // alert(`JS Error: ${msg} \nLine: ${line}`); // Uncomment for extreme debugging
    console.error("Global Error:", msg, url, line);
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        new App();
    } catch (e) {
        console.error("App Crash:", e);
    }
});
