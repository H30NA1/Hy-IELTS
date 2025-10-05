// IELTS Listening Module
class IELTSListening {
    constructor() {
        this.currentPart = 1;
        this.questions = [];
        this.audioElements = {};
        this.speechSynthesis = window.speechSynthesis;
        this.voices = [];
        this.speakers = {
            male: null,
            female: null,
            narrator: null
        };
        this.isPlaying = false;
        this.audioScripts = {};
        this.currentUtterance = null;
        this.speechQueue = [];
        this.isProcessingQueue = false;
        this.voiceProfiles = {};
        this.testData = null;
    }

    async initialize() {
        await this.loadTestData();
        this.loadVoiceProfilesFromData();
        this.initializeSpeechSynthesis();
        this.renderQuestions();
        this.setupEventListeners();
        this.generateAudioScripts();
    }

    async loadTestData() {
        try {
            const response = await fetch('/api/test-data');
            const data = await response.json();
            this.testData = data;
            console.log('Test data loaded for voice profiles:', data);
        } catch (error) {
            console.error('Failed to load test data:', error);
            // Fallback to default profiles if data loading fails
            this.initializeDefaultVoiceProfiles();
        }
    }

    loadVoiceProfilesFromData() {
        if (!this.testData || !this.testData.sections) {
            console.warn('No test data available, using default voice profiles');
            this.initializeDefaultVoiceProfiles();
            return;
        }

        // Handle both array and object formats for sections
        let sections;
        if (Array.isArray(this.testData.sections)) {
            sections = this.testData.sections;
        } else if (typeof this.testData.sections === 'object') {
            sections = Object.values(this.testData.sections);
        } else {
            console.warn('Invalid sections format in test data, using default voice profiles');
            this.initializeDefaultVoiceProfiles();
            return;
        }

        // Find the listening section
        const listeningSection = sections.find(section => section.id === 'listening' || section.title?.includes('Listening'));
        if (!listeningSection) {
            console.warn('No listening section found in test data, using default voice profiles');
            this.initializeDefaultVoiceProfiles();
            return;
        }

        // Check if the listening section has parts or scripts
        if (listeningSection.parts) {
            // New format with parts
            this.voiceProfiles = {};
            console.log('Loading voice profiles from parts:', listeningSection.parts.length, 'parts found');
            listeningSection.parts.forEach(part => {
                if (part.voiceProfiles) {
                    this.voiceProfiles[`part${part.partNumber}`] = part.voiceProfiles;
                    console.log(`Loaded voice profiles for Part ${part.partNumber}:`, part.voiceProfiles);
                } else {
                    console.warn(`No voice profiles found for Part ${part.partNumber}`);
                }
            });
            console.log('Final voice profiles object:', this.voiceProfiles);
        } else if (listeningSection.scripts) {
            // Old format with scripts - create default profiles
            console.log('Using old script format, creating default voice profiles');
            this.initializeDefaultVoiceProfiles();
        } else {
            console.warn('No parts or scripts found in listening section, using default voice profiles');
            this.initializeDefaultVoiceProfiles();
            return;
        }

        // If no voice profiles were loaded, use defaults
        if (Object.keys(this.voiceProfiles).length === 0) {
            console.warn('No voice profiles found in test data, using default voice profiles');
            this.initializeDefaultVoiceProfiles();
        }
    }

    initializeDefaultVoiceProfiles() {
        // Fallback voice profiles when data is not available
        this.voiceProfiles = {
            part1: {
                male: { 
                    pitch: 0.7, rate: 0.85, volume: 0.9, name: 'Male Speaker',
                    variation: 0.08, accent: 'casual', emotion: 'friendly', speakingType: 'conversational'
                },
                female: { 
                    pitch: 1.1, rate: 0.9, volume: 0.95, name: 'Female Speaker',
                    variation: 0.06, accent: 'professional', emotion: 'helpful', speakingType: 'service'
                },
                narrator: { 
                    pitch: 1.0, rate: 0.8, volume: 1.0, name: 'IELTS Narrator',
                    variation: 0.02, accent: 'formal', emotion: 'neutral', speakingType: 'instructional'
                }
            },
            part2: {
                female: { 
                    pitch: 1.2, rate: 0.75, volume: 0.9, name: 'Female Speaker',
                    variation: 0.07, accent: 'enthusiastic', emotion: 'engaging', speakingType: 'presentation'
                },
                narrator: { 
                    pitch: 1.0, rate: 0.8, volume: 1.0, name: 'IELTS Narrator',
                    variation: 0.02, accent: 'formal', emotion: 'neutral', speakingType: 'instructional'
                }
            },
            part3: {
                male: { 
                    pitch: 0.8, rate: 0.7, volume: 0.9, name: 'Male Speaker',
                    variation: 0.05, accent: 'academic', emotion: 'authoritative', speakingType: 'lecture'
                },
                female: { 
                    pitch: 1.15, rate: 0.85, volume: 0.9, name: 'Female Speaker',
                    variation: 0.08, accent: 'young', emotion: 'curious', speakingType: 'discussion'
                },
                narrator: { 
                    pitch: 1.0, rate: 0.8, volume: 1.0, name: 'IELTS Narrator',
                    variation: 0.02, accent: 'formal', emotion: 'neutral', speakingType: 'instructional'
                }
            },
            part4: {
                male: { 
                    pitch: 0.75, rate: 0.65, volume: 0.95, name: 'Male Speaker',
                    variation: 0.04, accent: 'scholarly', emotion: 'informed', speakingType: 'lecture'
                },
                narrator: { 
                    pitch: 1.0, rate: 0.8, volume: 1.0, name: 'IELTS Narrator',
                    variation: 0.02, accent: 'formal', emotion: 'neutral', speakingType: 'instructional'
                }
            }
        };
    }

    initializeSpeechSynthesis() {
        if (this.speechSynthesis) {
            // Load voices
            this.loadVoices();
            
            // Handle voice loading
            if (this.speechSynthesis.onvoiceschanged !== undefined) {
                this.speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
        }
    }

    loadVoices() {
        this.voices = this.speechSynthesis.getVoices();
        
        // Prefer English voices
        const englishVoices = this.voices.filter(voice => 
            voice.lang.startsWith('en') || voice.lang.includes('English')
        );
        
        if (englishVoices.length > 0) {
            // Select different voices for different speakers
            this.selectSpeakerVoices(englishVoices);
        } else if (this.voices.length > 0) {
            // Fallback to any available voices
            this.speakers.male = this.voices[0];
            this.speakers.female = this.voices[1] || this.voices[0];
            this.speakers.narrator = this.voices[2] || this.voices[0];
        }
        
        console.log('Speech synthesis voices loaded:', this.voices.length);
        console.log('Selected speakers:', {
            male: this.speakers.male ? this.speakers.male.name : 'None',
            female: this.speakers.female ? this.speakers.female.name : 'None',
            narrator: this.speakers.narrator ? this.speakers.narrator.name : 'None'
        });
    }

    selectSpeakerVoices(englishVoices) {
        // Find female voices
        const femaleVoices = englishVoices.filter(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('susan') ||
            voice.name.toLowerCase().includes('karen') ||
            voice.name.toLowerCase().includes('zira') ||
            voice.name.toLowerCase().includes('hazel')
        );
        
        // Find male voices
        const maleVoices = englishVoices.filter(voice => 
            voice.name.toLowerCase().includes('male') || 
            voice.name.toLowerCase().includes('man') ||
            voice.name.toLowerCase().includes('david') ||
            voice.name.toLowerCase().includes('mark') ||
            voice.name.toLowerCase().includes('richard') ||
            voice.name.toLowerCase().includes('daniel')
        );
        
        // Assign voices
        this.speakers.female = femaleVoices[0] || englishVoices[0];
        this.speakers.male = maleVoices[0] || englishVoices[1] || englishVoices[0];
        this.speakers.narrator = englishVoices[2] || englishVoices[0];
        
        // Ensure we have different voices for male and female
        if (this.speakers.male === this.speakers.female && englishVoices.length > 1) {
            this.speakers.male = englishVoices[1];
        }
    }

    generateAudioScripts() {
        // Generate scripts from test data if available, otherwise use default
        if (this.testData && this.testData.sections) {
            const listeningSection = this.testData.sections.find(section => section.id === 'listening');
            if (listeningSection && listeningSection.parts) {
                this.audioScripts = {};
                listeningSection.parts.forEach(part => {
                    this.audioScripts[`part${part.partNumber}`] = this.generateScriptFromData(part);
                });
            } else {
                this.generateDefaultScripts();
            }
        } else {
            this.generateDefaultScripts();
        }
    }

    generateDefaultScripts() {
        // Generate realistic IELTS listening scripts for each part
        this.audioScripts = {
            part1: this.generatePart1Script(),
            part2: this.generatePart2Script(),
            part3: this.generatePart3Script(),
            part4: this.generatePart4Script()
        };
    }

    generateScriptFromData(partData) {
        // Use the actual script data from JSON if available
        if (partData.script) {
            return {
                narrator: partData.script.narrator,
                conversation: partData.script.conversation
            };
        }
        
        // Fallback to generated script if no script data
        const partNumber = partData.partNumber;
        
        // Create narrator introduction
        const narrator = `Good morning, this is the International English Language Testing System, IELTS. You will hear a number of different recordings and you will have to answer questions on what you hear. There will be time for you to read the instructions and questions and you will have a chance to check your work. All the recordings will be played once only. The test is in four parts. At the end of the test you will be given ten minutes to transfer your answers to an answer sheet.

Now turn to Part ${partNumber}. ${partData.instructions || 'Listen to the recording and answer the questions.'} Look at questions ${this.getQuestionRange(partNumber)}. You now have some time to look at the questions.

[Pause]

Now listen carefully and answer the questions.`;

        // Generate conversation based on part type and questions
        const conversation = this.generateConversationFromQuestions(partData.questions, partNumber);
        
        return {
            narrator: narrator,
            conversation: conversation
        };
    }

    getQuestionRange(partNumber) {
        const ranges = {
            1: '1 to 10',
            2: '11 to 20', 
            3: '21 to 30',
            4: '31 to 40'
        };
        return ranges[partNumber] || '1 to 10';
    }

    generateConversationFromQuestions(questions, partNumber) {
        // Generate realistic conversation based on questions
        const conversations = {
            1: this.generatePart1Conversation(questions),
            2: this.generatePart2Conversation(questions),
            3: this.generatePart3Conversation(questions),
            4: this.generatePart4Conversation(questions)
        };
        
        return conversations[partNumber] || [];
    }

    generatePart1Conversation(questions) {
        // Generate Part 1 conversation (everyday social context)
        return [
            { speaker: "female", text: "Good morning, how can I help you today?" },
            { speaker: "male", text: "Good morning, I'd like to book a hotel room for next week, please." },
            { speaker: "female", text: "Certainly, sir. What dates are you looking for?" },
            { speaker: "male", text: "I need a room from Monday the 15th to Friday the 19th." },
            { speaker: "female", text: "Let me check availability for you. Yes, we have rooms available. What type of room would you prefer?" },
            { speaker: "male", text: "I'd like a single room with a sea view if possible." },
            { speaker: "female", text: "I can offer you a single room with sea view for 120 pounds per night." },
            { speaker: "male", text: "That sounds reasonable. Does that include breakfast?" },
            { speaker: "female", text: "Yes, continental breakfast is included. May I take your name and contact details?" },
            { speaker: "male", text: "Of course, my name is David Thompson, that's D-A-V-I-D T-H-O-M-P-S-O-N." },
            { speaker: "female", text: "Thank you, Mr. Thompson. And your phone number?" },
            { speaker: "male", text: "It's 0789 456 1234." },
            { speaker: "female", text: "Perfect. I'll send you a confirmation email. Is there anything else I can help you with?" },
            { speaker: "male", text: "Actually, yes. What time is check-in and check-out?" },
            { speaker: "female", text: "Check-in is from 2 PM and check-out is by 11 AM. Is there anything else?" },
            { speaker: "male", text: "No, that's everything. Thank you very much for your help." },
            { speaker: "female", text: "You're welcome, Mr. Thompson. Have a wonderful stay with us." }
        ];
    }

    generatePart2Conversation(questions) {
        // Generate Part 2 monologue (everyday social context)
        return [
            { speaker: "female", text: "Welcome to the National History Museum. I'm Sarah, your guide for today's tour. The museum was established in 1923 and has been showcasing artifacts from around the world for over a century. Our most popular exhibit is the Egyptian collection, which features several mummies and artifacts from ancient tombs. The collection was expanded in 2000 with a special donation from the British Museum. We welcome over one million visitors annually, making us one of the most visited museums in the country. Adult admission is ten pounds, and we're open every day except Monday. The museum opens at 10 AM and closes at 6 PM. Our gift shop is located on the ground floor near the main entrance. This evening, we have a special lecture on ancient civilizations at 7 PM in the main auditorium." }
        ];
    }

    generatePart3Conversation(questions) {
        // Generate Part 3 conversation (educational context)
        return [
            { speaker: "male", text: "Today we're discussing renewable energy sources and their impact on the environment. Sarah, what do you think is the biggest challenge facing renewable energy adoption?" },
            { speaker: "female", text: "I think the main challenge is cost, Professor. Initial setup costs can be quite high, even though the long-term benefits are significant." },
            { speaker: "male", text: "That's a valid point. Currently, about 25% of our energy comes from renewable sources. Which renewable source do you think is most efficient?" },
            { speaker: "female", text: "I believe hydropower is the most efficient because it can generate electricity consistently and has a high energy conversion rate." },
            { speaker: "male", text: "Interesting perspective. However, I think the timeline for achieving 50% renewable energy might be too optimistic. What's your view on this?" },
            { speaker: "female", text: "I think 15 to 20 years is realistic if governments invest properly in infrastructure and technology." },
            { speaker: "male", text: "The main advantage, as you mentioned, is the cleaner environment. Denmark is a great example - they generate over 50% of their electricity from wind power." },
            { speaker: "female", text: "That's impressive. I think the key to success is having skilled practitioners who can implement these technologies effectively." },
            { speaker: "male", text: "Exactly. Now, let's move on to discussing the economic implications of this transition." }
        ];
    }

    generatePart4Conversation(questions) {
        // Generate Part 4 monologue (academic subject)
        return [
            { speaker: "male", text: "Today's lecture focuses on machine learning, a subset of artificial intelligence that enables systems to learn from data without explicit programming. Machine learning was first developed in the 1950s, marking a significant milestone in computer science. Supervised learning involves training algorithms with labeled examples, where the system learns to make predictions based on input-output pairs. Decision trees are particularly effective for classification tasks, as they can handle both numerical and categorical data. Typically, we use 80% of our data for training and reserve 20% for testing. The main challenge in machine learning is ensuring data quality, as poor data leads to unreliable models. Healthcare is the industry that benefits most from machine learning applications, particularly in diagnostic imaging and drug discovery. Deep learning uses multiple neural layers to process complex patterns in data. I predict that machine learning development will accelerate significantly in the coming years, driven by advances in computing power and data availability. The key to success in machine learning is having skilled practitioners who understand both the technical aspects and the domain knowledge required for effective implementation." }
        ];
    }

    generatePart1Script() {
        return {
            narrator: "Good morning, this is the International English Language Testing System, IELTS. You will hear a number of different recordings and you will have to answer questions on what you hear. There will be time for you to read the instructions and questions and you will have a chance to check your work. All the recordings will be played once only. The test is in four parts. At the end of the test you will be given ten minutes to transfer your answers to an answer sheet.\n\nNow turn to Part 1. You will hear a conversation between two people in an everyday social context. Look at questions 1 to 10. You now have some time to look at the questions.\n\n[Pause]\n\nNow listen carefully and answer questions 1 to 10.",
            conversation: [
                { speaker: "female", text: "Good morning, how can I help you today?" },
                { speaker: "male", text: "Good morning, I'd like to book a hotel room for next week, please." },
                { speaker: "female", text: "Certainly, sir. What dates are you looking for?" },
                { speaker: "male", text: "I need a room from Monday the 15th to Friday the 19th." },
                { speaker: "female", text: "Let me check availability for you. Yes, we have rooms available. What type of room would you prefer?" },
                { speaker: "male", text: "I'd like a single room with a sea view if possible." },
                { speaker: "female", text: "I can offer you a single room with sea view for 120 pounds per night." },
                { speaker: "male", text: "That sounds reasonable. Does that include breakfast?" },
                { speaker: "female", text: "Yes, continental breakfast is included. May I take your name and contact details?" },
                { speaker: "male", text: "Of course, my name is David Thompson, that's D-A-V-I-D T-H-O-M-P-S-O-N." },
                { speaker: "female", text: "Thank you, Mr. Thompson. And your phone number?" },
                { speaker: "male", text: "It's 0789 456 1234." },
                { speaker: "female", text: "Perfect. I'll send you a confirmation email. Is there anything else I can help you with?" },
                { speaker: "male", text: "Yes, could you recommend some good restaurants in the area?" },
                { speaker: "female", text: "Certainly. There's a lovely Italian restaurant called Bella Vista about five minutes walk from the hotel, and a seafood restaurant called The Harbour which is very popular with our guests." },
                { speaker: "male", text: "That sounds great. Thank you very much for your help." },
                { speaker: "female", text: "You're welcome, Mr. Thompson. We look forward to welcoming you next week." }
            ]
        };
    }

    generatePart2Script() {
        return {
            narrator: "You will hear a monologue in an everyday social context. Look at questions 11 to 20. You now have some time to look at the questions.\n\n[Pause]\n\nNow listen carefully and answer questions 11 to 20.",
            conversation: [
                { speaker: "female", text: "Good afternoon, everyone. Welcome to the City Museum. My name is Sarah and I'll be your guide for today's tour. Before we begin, I'd like to give you some important information about our museum." },
                { speaker: "female", text: "The museum was established in 1892 and houses over 50,000 artifacts from around the world. Our most popular exhibition is the Ancient Civilizations section, which features artifacts from Egypt, Greece, and Rome. This exhibition is located on the ground floor and is open from 9 AM to 6 PM daily." },
                { speaker: "female", text: "The museum has three floors. The ground floor contains the Ancient Civilizations exhibition and our gift shop. The first floor houses our Natural History collection, including dinosaur fossils and geological specimens. The second floor is dedicated to modern art and contemporary exhibitions." },
                { speaker: "female", text: "We offer guided tours every hour on the hour, starting at 10 AM. The last tour begins at 4 PM. Each tour lasts approximately 45 minutes and covers all three floors. If you prefer to explore on your own, audio guides are available for rent at the information desk for 3 pounds." },
                { speaker: "female", text: "The museum has a café on the first floor that serves light meals and refreshments. It's open from 10 AM to 5 PM. We also have a library on the second floor that contains over 10,000 books and journals related to our collections." },
                { speaker: "female", text: "Photography is allowed in most areas, but please note that flash photography is prohibited in the Ancient Civilizations section to protect the delicate artifacts. We also ask that you keep your voices down to maintain a peaceful atmosphere for all visitors." },
                { speaker: "female", text: "If you have any questions during your visit, please don't hesitate to ask any of our staff members. We're here to help make your visit enjoyable and educational." }
            ]
        };
    }

    generatePart3Script() {
        return {
            narrator: "You will hear a conversation between up to four people in an educational or training context. Look at questions 21 to 30. You now have some time to look at the questions.\n\n[Pause]\n\nNow listen carefully and answer questions 21 to 30.",
            conversation: [
                { speaker: "male", text: "Good morning, everyone. Today we're going to discuss renewable energy sources and their impact on the environment. Let's start with solar energy. Sarah, what can you tell us about solar power?" },
                { speaker: "female", text: "Well, Professor, solar energy is one of the cleanest forms of renewable energy. It works by converting sunlight directly into electricity using photovoltaic cells. The main advantage is that it produces no greenhouse gas emissions during operation." },
                { speaker: "male", text: "That's correct. And what about the disadvantages?" },
                { speaker: "female", text: "The main disadvantages are the high initial cost of installation and the fact that solar panels only work when the sun is shining. We also need large areas of land for solar farms." },
                { speaker: "male", text: "Good points. Now, let's talk about wind energy. Mike, what are your thoughts on wind power?" },
                { speaker: "male", text: "Wind energy is another excellent renewable source. Wind turbines convert the kinetic energy of wind into electrical energy. It's particularly effective in coastal areas and on hilltops where wind speeds are higher." },
                { speaker: "male", text: "And the challenges with wind energy?" },
                { speaker: "male", text: "Well, wind is intermittent, so we need backup power sources. There are also concerns about noise pollution and the impact on bird populations. Some people also find wind turbines visually unappealing." },
                { speaker: "male", text: "Excellent. Now, let's consider hydroelectric power. Lisa, can you explain how it works?" },
                { speaker: "female", text: "Hydroelectric power uses the energy of flowing water to generate electricity. Water is stored in reservoirs and released through turbines. It's very reliable and can provide consistent power output." },
                { speaker: "male", text: "What about the environmental impact?" },
                { speaker: "female", text: "While hydroelectric power is clean in terms of emissions, it can have significant environmental impacts. Large dams can disrupt ecosystems, displace communities, and affect fish migration patterns." },
                { speaker: "male", text: "Very good. Now, let's discuss the future of renewable energy. What do you think are the main challenges we need to address?" }
            ]
        };
    }

    generatePart4Script() {
        return {
            narrator: "You will hear a monologue on an academic subject. Look at questions 31 to 40. You now have some time to look at the questions.\n\n[Pause]\n\nNow listen carefully and answer questions 31 to 40.",
            conversation: [
                { speaker: "male", text: "Today I'd like to discuss the fascinating field of marine biology and the incredible diversity of life in our oceans. The study of marine ecosystems has revealed some remarkable discoveries in recent years." },
                { speaker: "male", text: "The ocean covers approximately 71 percent of the Earth's surface and contains 97 percent of the planet's water. Despite this vast coverage, we have only explored about 5 percent of the world's oceans. This means that 95 percent of our oceans remain unexplored, making marine biology one of the most exciting and mysterious fields of scientific research." },
                { speaker: "male", text: "Marine ecosystems are incredibly diverse, ranging from the sunlit surface waters to the dark depths of the abyssal zone. The photic zone, which extends to about 200 meters below the surface, is where most marine life is concentrated. This is because sunlight can penetrate to this depth, allowing photosynthesis to occur." },
                { speaker: "male", text: "Coral reefs are among the most biodiverse ecosystems on Earth. Although they cover less than 1 percent of the ocean floor, they support approximately 25 percent of all marine species. These incredible structures are built by tiny coral polyps over thousands of years." },
                { speaker: "male", text: "The deep sea, however, presents a completely different environment. At depths greater than 1,000 meters, there is no sunlight, temperatures are near freezing, and pressure can be hundreds of times greater than at the surface. Despite these harsh conditions, life has found a way to thrive." },
                { speaker: "male", text: "Deep-sea creatures have developed remarkable adaptations to survive in this extreme environment. Many species produce their own light through bioluminescence, which they use for communication, hunting, and defense. Some fish have developed transparent bodies to avoid detection, while others have evolved enormous mouths to capture any available prey." },
                { speaker: "male", text: "Recent discoveries in marine biology have included new species of fish, jellyfish, and even sharks. In 2020, scientists discovered a new species of whale that had been previously unknown to science. This discovery highlights how much we still have to learn about our oceans." },
                { speaker: "male", text: "The study of marine biology is not just about discovering new species. It's also crucial for understanding climate change, as oceans play a vital role in regulating the Earth's climate. Marine plants, particularly phytoplankton, produce about 50 percent of the world's oxygen through photosynthesis." },
                { speaker: "male", text: "However, marine ecosystems are facing unprecedented threats from human activities. Overfishing, pollution, climate change, and ocean acidification are all having devastating effects on marine life. Coral reefs, for example, are experiencing widespread bleaching due to rising ocean temperatures." },
                { speaker: "male", text: "Understanding these threats and finding solutions is one of the most important challenges facing marine biologists today. The future of our planet may well depend on our ability to protect and preserve these vital marine ecosystems." }
            ]
        };
    }

    renderQuestions() {
        const container = document.getElementById('listening');
        if (!container) return;

        // Clear existing content but keep the section header
        const sectionHeader = container.querySelector('.section-header');
        const existingParts = container.querySelectorAll('.listening-part');
        existingParts.forEach(part => part.remove());

        // Load content from test data
        if (this.testData && this.testData.sections) {
            const listeningSection = this.testData.sections.find(section => section.id === 'listening');
            if (listeningSection && listeningSection.parts) {
                listeningSection.parts.forEach(part => {
                    this.renderPartFromData(part);
                });
            } else {
                // Fallback to default rendering
                this.renderDefaultParts();
            }
        } else {
            // Fallback to default rendering
            this.renderDefaultParts();
        }
    }

    renderDefaultParts() {
        // Render Part 1 questions (Questions 1-10)
        this.renderPart(1, 1, 10, 'listening-part1-questions');
        
        // Render Part 2 questions (Questions 11-20)
        this.renderPart(2, 11, 20, 'listening-part2-questions');
        
        // Render Part 3 questions (Questions 21-30)
        this.renderPart(3, 21, 30, 'listening-part3-questions');
        
        // Render Part 4 questions (Questions 31-40)
        this.renderPart(4, 31, 40, 'listening-part4-questions');
    }

    renderPartFromData(partData) {
        const container = document.getElementById('listening');
        if (!container) return;

        // Create part container
        const partContainer = IELTSUtils.createElement('div', 'listening-part');
        
        // Add part title from data
        const titleElement = IELTSUtils.createElement('h3', '');
        titleElement.textContent = partData.title;
        partContainer.appendChild(titleElement);

        // Add instructions from data
        if (partData.instructions) {
            const instructionsElement = IELTSUtils.createElement('p', 'part-instructions');
            instructionsElement.textContent = partData.instructions;
            partContainer.appendChild(instructionsElement);
        }

        // Add play button for this part
        const playButton = IELTSUtils.createElement('div', 'listening-controls');
        playButton.innerHTML = `
            <div class="audio-controls">
                <button class="btn btn-primary play-audio-btn" data-part="${partData.partNumber}">
                    <i class="fas fa-play"></i>
                    Play Part ${partData.partNumber} Audio
                </button>
                <span class="audio-duration" id="duration-part${partData.partNumber}">Duration: ~${this.getPartDuration(partData.partNumber)}</span>
            </div>
            <div class="speaker-indicator" id="speaker-indicator-part${partData.partNumber}">
                <div class="speaker-icon"></div>
                <span class="speaker-name">Now speaking: </span>
            </div>
        `;
        partContainer.appendChild(playButton);

        // Create questions container
        const questionsContainer = IELTSUtils.createElement('div', 'questions-container');
        questionsContainer.id = `listening-part${partData.partNumber}-questions`;

        // Add questions from data
        if (partData.questions) {
            partData.questions.forEach(question => {
                const questionDiv = this.createQuestionElementFromData(question, partData.partNumber);
                questionsContainer.appendChild(questionDiv);
            });
        }

        partContainer.appendChild(questionsContainer);
        container.appendChild(partContainer);
    }

    createQuestionElementFromData(questionData, partNumber) {
        const questionDiv = IELTSUtils.createElement('div', 'question');
        
        questionDiv.innerHTML = `
            <h4>Question ${questionData.id.replace('listening-q', '')}</h4>
            <p>${questionData.questionText}</p>
            <div class="options">
                ${questionData.options.map(option => `
                    <label>
                        <input type="radio" name="${questionData.id}" value="${option.charAt(0)}">
                        ${option}
                    </label>
                `).join('')}
            </div>
        `;
        
        return questionDiv;
    }

    renderPart(partNumber, startQuestion, endQuestion, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Add play button for this part
        const playButton = IELTSUtils.createElement('div', 'listening-controls');
        playButton.innerHTML = `
            <div class="audio-controls">
                <button class="btn btn-primary play-audio-btn" data-part="${partNumber}">
                    <i class="fas fa-play"></i>
                    Play Part ${partNumber} Audio
                </button>
                <span class="audio-duration" id="duration-part${partNumber}">Duration: ~${this.getPartDuration(partNumber)}</span>
            </div>
            <div class="speaker-indicator" id="speaker-indicator-part${partNumber}">
                <div class="speaker-icon"></div>
                <span class="speaker-name">Now speaking: </span>
            </div>
        `;
        container.appendChild(playButton);

        // Add questions
        for (let i = startQuestion; i <= endQuestion; i++) {
            const questionDiv = this.createQuestionElement(i, partNumber);
            container.appendChild(questionDiv);
        }
    }

    getPartDuration(partNumber) {
        const durations = {
            1: '3 minutes',
            2: '3 minutes', 
            3: '4 minutes',
            4: '4 minutes'
        };
        return durations[partNumber] || '3 minutes';
    }

    createQuestionElement(questionNumber, partNumber) {
        const questionDiv = IELTSUtils.createElement('div', 'question');
        
        // Sample question content - in real implementation, this would come from test data
        const sampleQuestions = {
            1: "What is the man's name?",
            2: "Where does the woman work?",
            3: "What time does the meeting start?",
            4: "How many people are expected?",
            5: "What is the main topic?",
            6: "Which room is booked?",
            7: "What is the phone number?",
            8: "When is the deadline?",
            9: "Who is the speaker?",
            10: "What is the purpose?"
        };

        const questionText = sampleQuestions[questionNumber] || `Question ${questionNumber}`;
        
        questionDiv.innerHTML = `
            <div class="question-header">
                <div class="question-header-top">
                    <span class="question-number">Question ${questionNumber}</span>
                    <button class="translate-btn" data-question="${questionNumber}" title="Translate to Vietnamese (0.5 grade penalty)">
                        <i class="fas fa-language"></i>
                        <span>Translate</span>
                    </button>
                </div>
                <div class="question-text" id="question-text-${questionNumber}">${questionText}</div>
                <div class="question-translation" id="question-translation-${questionNumber}" style="display: none;">
                    <p class="translation-label">Vietnamese Translation:</p>
                    <p class="translation-text" id="translation-text-${questionNumber}">Translating...</p>
                </div>
            </div>
            <div class="options">
                <div class="option" data-question="${questionNumber}" data-option="0">
                    <div class="option-label">A</div>
                    <div class="option-text" id="option-text-${questionNumber}-0">Option A</div>
                    <div class="option-translation" id="option-translation-${questionNumber}-0" style="display: none;">
                        <p class="translation-label">Vietnamese Translation:</p>
                        <p class="translation-text" id="option-translation-text-${questionNumber}-0">Translating...</p>
                    </div>
                </div>
                <div class="option" data-question="${questionNumber}" data-option="1">
                    <div class="option-label">B</div>
                    <div class="option-text" id="option-text-${questionNumber}-1">Option B</div>
                    <div class="option-translation" id="option-translation-${questionNumber}-1" style="display: none;">
                        <p class="translation-label">Vietnamese Translation:</p>
                        <p class="translation-text" id="option-translation-text-${questionNumber}-1">Translating...</p>
                    </div>
                </div>
                <div class="option" data-question="${questionNumber}" data-option="2">
                    <div class="option-label">C</div>
                    <div class="option-text" id="option-text-${questionNumber}-2">Option C</div>
                    <div class="option-translation" id="option-translation-${questionNumber}-2" style="display: none;">
                        <p class="translation-label">Vietnamese Translation:</p>
                        <p class="translation-text" id="option-translation-text-${questionNumber}-2">Translating...</p>
                    </div>
                </div>
                <div class="option" data-question="${questionNumber}" data-option="3">
                    <div class="option-label">D</div>
                    <div class="option-text" id="option-text-${questionNumber}-3">Option D</div>
                    <div class="option-translation" id="option-translation-${questionNumber}-3" style="display: none;">
                        <p class="translation-label">Vietnamese Translation:</p>
                        <p class="translation-text" id="option-translation-text-${questionNumber}-3">Translating...</p>
                    </div>
                </div>
            </div>
        `;

        return questionDiv;
    }

    setupEventListeners() {
        // Option selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option')) {
                const option = e.target.closest('.option');
                const questionId = option.dataset.question;
                const optionIndex = option.dataset.option;
                
                this.selectOption(questionId, optionIndex);
            }
        });

        // Translation buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.translate-btn')) {
                const btn = e.target.closest('.translate-btn');
                const questionId = btn.dataset.question;
                this.translateQuestion(questionId);
            }
        });

        // Audio play buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.play-audio-btn')) {
                const btn = e.target.closest('.play-audio-btn');
                const partNumber = btn.dataset.part;
                this.playAudio(partNumber);
            }
        });

        // Radio button changes for listening questions
        document.addEventListener('change', (e) => {
            if (e.target.type === 'radio' && e.target.name.startsWith('listening-')) {
                const questionId = e.target.name;
                const selectedValue = e.target.value;
                this.saveListeningAnswer(questionId, selectedValue);
            }
        });
    }

    saveListeningAnswer(questionId, selectedValue) {
        // Store answer in the core module
        if (window.ieltsTest) {
            if (!window.ieltsTest.answers.listening) {
                window.ieltsTest.answers.listening = {};
            }
            window.ieltsTest.answers.listening[questionId] = selectedValue;
            window.ieltsTest.updateActivity();
            console.log(`🎧 Saved listening answer: ${questionId} = ${selectedValue}`);
        }
    }

    selectOption(questionId, optionIndex) {
        // Remove previous selection for this question
        const questionContainer = document.querySelector(`[data-question="${questionId}"]`).closest('.question');
        const allOptions = questionContainer.querySelectorAll('.option');
        allOptions.forEach(option => option.classList.remove('selected'));

        // Select new option
        const selectedOption = document.querySelector(`[data-question="${questionId}"][data-option="${optionIndex}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }

        // Store answer
        if (window.ieltsTest) {
            if (!window.ieltsTest.answers.listening) {
                window.ieltsTest.answers.listening = {};
            }
            window.ieltsTest.answers.listening[questionId] = optionIndex;
            window.ieltsTest.updateActivity();
        }
    }

    translateQuestion(questionId) {
        const translationDiv = document.getElementById(`question-translation-${questionId}`);
        const translationText = document.getElementById(`translation-text-${questionId}`);
        
        if (!translationDiv || !translationText) return;

        if (translationDiv.style.display === 'none') {
            translationDiv.style.display = 'block';
            translationText.textContent = 'Translating...';
            
            // Simulate translation (in real implementation, this would call translation API)
            setTimeout(() => {
                translationText.textContent = `Vietnamese translation for question ${questionId}`;
            }, 1000);

            // Add translation penalty
            if (window.ieltsTest) {
                window.ieltsTest.translatedQuestions.add(parseInt(questionId));
            }
        } else {
            translationDiv.style.display = 'none';
        }
    }

    getAnswers() {
        const answers = {};
        const selectedOptions = document.querySelectorAll('.option.selected');
        
        selectedOptions.forEach(option => {
            const questionId = option.dataset.question;
            const optionIndex = option.dataset.option;
            answers[questionId] = optionIndex;
        });

        return answers;
    }

    playAudio(partNumber) {
        if (this.isPlaying) {
            this.stopAudio();
            return;
        }

        const script = this.audioScripts[`part${partNumber}`];
        if (!script) {
            console.error(`No script found for part ${partNumber}`);
            return;
        }

        if (!this.speechSynthesis || !this.speakers.male || !this.speakers.female) {
            console.error('Speech synthesis not available');
            IELTSUtils.showNotification('Audio playback not available. Please check your browser settings.', 'error');
            return;
        }

        // Stop any current speech
        this.speechSynthesis.cancel();
        this.speechQueue = [];
        this.isProcessingQueue = false;

        // Update button state
        const playBtn = document.querySelector(`[data-part="${partNumber}"]`);
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Audio';
            playBtn.classList.add('playing');
        }

        this.isPlaying = true;

        // Build speech queue
        this.buildSpeechQueue(script, partNumber);

        // Start processing the queue
        this.processSpeechQueue(partNumber);
    }

    buildSpeechQueue(script, partNumber) {
        // Add narrator introduction
        if (script.narrator) {
            const narratorVoice = this.getVoiceForSpeaker('narrator', partNumber);
            console.log(`Part ${partNumber} - Narrator voice:`, narratorVoice?.name);
            this.speechQueue.push({
                text: script.narrator,
                voice: narratorVoice,
                speaker: 'narrator'
            });
        }

        // Add conversation parts
        if (script.conversation && Array.isArray(script.conversation)) {
            script.conversation.forEach((part, index) => {
                const voice = this.getVoiceForSpeaker(part.speaker, partNumber);
                console.log(`Part ${partNumber} - ${part.speaker} voice:`, voice?.name);
                this.speechQueue.push({
                    text: part.text,
                    voice: voice,
                    speaker: part.speaker,
                    index: index
                });
            });
        }

        console.log(`Built speech queue for Part ${partNumber}:`, this.speechQueue.length, 'utterances');
    }

    getVoiceForSpeaker(speaker, partNumber = null) {
        // Get available voices
        const voices = this.speechSynthesis.getVoices();
        const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
        
        if (englishVoices.length === 0) {
            return this.speakers.narrator || voices[0];
        }
        
        // Select different voices based on speaker type AND part number
        let voiceIndex = 0;
        
        switch (speaker) {
            case 'male':
                // Try to find male-sounding voices
                const maleVoices = englishVoices.filter(voice => 
                    voice.name.toLowerCase().includes('male') || 
                    voice.name.toLowerCase().includes('man') ||
                    voice.name.toLowerCase().includes('david') ||
                    voice.name.toLowerCase().includes('mark') ||
                    voice.name.toLowerCase().includes('richard') ||
                    voice.name.toLowerCase().includes('daniel') ||
                    voice.name.toLowerCase().includes('alex')
                );
                
                // Use different male voices for different parts
                if (partNumber) {
                    voiceIndex = (partNumber - 1) % maleVoices.length;
                }
                return maleVoices[voiceIndex] || englishVoices[0];
                
            case 'female':
                // Try to find female-sounding voices
                const femaleVoices = englishVoices.filter(voice => 
                    voice.name.toLowerCase().includes('female') || 
                    voice.name.toLowerCase().includes('woman') ||
                    voice.name.toLowerCase().includes('zira') ||
                    voice.name.toLowerCase().includes('susan') ||
                    voice.name.toLowerCase().includes('hazel') ||
                    voice.name.toLowerCase().includes('catherine') ||
                    voice.name.toLowerCase().includes('sarah')
                );
                
                // Use different female voices for different parts
                if (partNumber) {
                    voiceIndex = (partNumber - 1) % femaleVoices.length;
                }
                return femaleVoices[voiceIndex] || englishVoices[1] || englishVoices[0];
                
            case 'narrator':
            default:
                // Use different narrator voices for different parts
                if (partNumber) {
                    voiceIndex = (partNumber - 1) % englishVoices.length;
                }
                return englishVoices[voiceIndex] || englishVoices[0];
        }
    }

    processSpeechQueue(partNumber) {
        if (this.isProcessingQueue || this.speechQueue.length === 0) {
            if (this.speechQueue.length === 0 && this.isPlaying) {
                // Queue is empty, audio finished
                this.finishAudio(partNumber);
            }
            return;
        }

        this.isProcessingQueue = true;
        const speechItem = this.speechQueue.shift();

        // Get voice profile for this part and speaker
        const voiceProfile = this.getVoiceProfile(partNumber, speechItem.speaker);
        
        // Create speech utterance with dynamic voice characteristics
        const utterance = new SpeechSynthesisUtterance(speechItem.text);
        
        // Apply voice profile FIRST, then set the voice object
        utterance.rate = voiceProfile.rate;
        utterance.pitch = voiceProfile.pitch;
        utterance.volume = voiceProfile.volume;
        
        // Set the voice object AFTER applying profile settings
        utterance.voice = speechItem.voice;

        // Add some randomness to make it more natural
        this.addVoiceVariation(utterance, speechItem.speaker, partNumber);
        
        // Debug logging
        console.log(`Part ${partNumber} - ${speechItem.speaker}:`, {
            voice: speechItem.voice?.name,
            pitch: utterance.pitch,
            rate: utterance.rate,
            volume: utterance.volume,
            profile: voiceProfile
        });

        // Handle speech events
        utterance.onstart = () => {
            console.log(`Speaking: ${voiceProfile.name} (${speechItem.speaker}) - "${speechItem.text.substring(0, 50)}..."`);
            this.showSpeakerIndicator(partNumber, speechItem.speaker, voiceProfile.name);
        };

        utterance.onend = () => {
            console.log(`Finished: ${voiceProfile.name}`);
            this.isProcessingQueue = false;
            
            // Add a small pause between speakers (varies by speaker type)
            const pauseDuration = this.getPauseDuration(speechItem.speaker);
            setTimeout(() => {
                this.processSpeechQueue(partNumber);
            }, pauseDuration);
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isProcessingQueue = false;
            this.finishAudio(partNumber);
            IELTSUtils.showNotification('Audio playback failed. Please try again.', 'error');
        };

        // Start speaking
        this.speechSynthesis.speak(utterance);
    }

    getVoiceProfile(partNumber, speaker) {
        const partKey = `part${partNumber}`;
        const profile = this.voiceProfiles[partKey]?.[speaker];
        
        console.log(`Getting voice profile for Part ${partNumber}, Speaker ${speaker}:`, {
            partKey,
            availableProfiles: Object.keys(this.voiceProfiles),
            profile: profile
        });
        
        if (profile) {
            return profile;
        }
        
        // Fallback profile
        const fallback = {
            pitch: speaker === 'male' ? 0.8 : speaker === 'female' ? 1.2 : 1.0,
            rate: 0.9,
            volume: 1.0,
            name: speaker === 'male' ? 'Male Speaker' : speaker === 'female' ? 'Female Speaker' : 'Narrator'
        };
        
        console.log(`Using fallback profile for Part ${partNumber}, Speaker ${speaker}:`, fallback);
        return fallback;
    }

    addVoiceVariation(utterance, speaker, partNumber = null) {
        // Get variation amount from voice profile or use default
        let variation = 0.15; // Increased default variation to 15%
        
        if (partNumber) {
            const partKey = `part${partNumber}`;
            const profile = this.voiceProfiles[partKey]?.[speaker];
            if (profile && profile.variation) {
                variation = profile.variation;
            }
        }
        
        console.log(`Adding voice variation for Part ${partNumber}, Speaker ${speaker}:`, {
            originalPitch: utterance.pitch,
            originalRate: utterance.rate,
            originalVolume: utterance.volume,
            variation: variation
        });
        
        // Random pitch variation
        const pitchVariation = (Math.random() - 0.5) * variation;
        utterance.pitch = Math.max(0.1, Math.min(2.0, utterance.pitch + pitchVariation));
        
        // Random rate variation
        const rateVariation = (Math.random() - 0.5) * variation;
        utterance.rate = Math.max(0.1, Math.min(2.0, utterance.rate + rateVariation));
        
        // Random volume variation (smaller range)
        const volumeVariation = (Math.random() - 0.5) * (variation * 0.5);
        utterance.volume = Math.max(0.1, Math.min(1.0, utterance.volume + volumeVariation));
        
        console.log(`After variation:`, {
            newPitch: utterance.pitch,
            newRate: utterance.rate,
            newVolume: utterance.volume
        });
        
        // Add some additional character-based variations
        this.addCharacterVariations(utterance, speaker, partNumber);
    }

    addCharacterVariations(utterance, speaker, partNumber) {
        if (!partNumber) return;
        
        const partKey = `part${partNumber}`;
        const profile = this.voiceProfiles[partKey]?.[speaker];
        if (!profile) return;
        
        // Apply character-specific variations based on accent and emotion
        switch (profile.accent) {
            case 'casual':
                // Slightly faster and more relaxed
                utterance.rate *= 1.05;
                utterance.pitch *= 0.98;
                break;
            case 'professional':
                // Clear and steady
                utterance.rate *= 0.98;
                utterance.volume *= 1.02;
                break;
            case 'enthusiastic':
                // Higher pitch and faster rate
                utterance.pitch *= 1.05;
                utterance.rate *= 1.08;
                break;
            case 'academic':
                // Slower and more deliberate
                utterance.rate *= 0.92;
                utterance.volume *= 1.03;
                break;
            case 'young':
                // Higher pitch and faster
                utterance.pitch *= 1.08;
                utterance.rate *= 1.06;
                break;
            case 'scholarly':
                // Very deliberate and clear
                utterance.rate *= 0.88;
                utterance.volume *= 1.05;
                break;
        }
        
        // Apply emotion-based variations
        switch (profile.emotion) {
            case 'friendly':
                utterance.pitch *= 1.02;
                utterance.rate *= 1.03;
                break;
            case 'helpful':
                utterance.volume *= 1.02;
                utterance.rate *= 0.98;
                break;
            case 'engaging':
                utterance.pitch *= 1.04;
                utterance.rate *= 1.05;
                break;
            case 'authoritative':
                utterance.pitch *= 0.96;
                utterance.volume *= 1.04;
                break;
            case 'curious':
                utterance.pitch *= 1.06;
                utterance.rate *= 1.04;
                break;
            case 'informed':
                utterance.rate *= 0.94;
                utterance.volume *= 1.03;
                break;
        }
    }

    getPauseDuration(speaker) {
        // Different pause durations for different speaker types
        const basePause = 200;
        const variations = {
            narrator: 300, // Longer pause after narrator
            male: 250,    // Medium pause for male speakers
            female: 200   // Shorter pause for female speakers
        };
        
        return variations[speaker] || basePause;
    }

    showSpeakerIndicator(partNumber, speaker, customName = null) {
        const indicator = document.getElementById(`speaker-indicator-part${partNumber}`);
        if (!indicator) return;

        // Update speaker name and icon
        const speakerName = customName || this.getSpeakerDisplayName(speaker);
        const speakerIcon = indicator.querySelector('.speaker-icon');
        const speakerNameSpan = indicator.querySelector('.speaker-name');

        if (speakerNameSpan) {
            speakerNameSpan.textContent = `Now speaking: ${speakerName}`;
        }

        if (speakerIcon) {
            speakerIcon.textContent = this.getSpeakerIcon(speaker);
        }

        // Update classes
        indicator.className = `speaker-indicator ${speaker} active`;
    }

    getSpeakerDisplayName(speaker) {
        switch (speaker) {
            case 'male':
                return 'Male Speaker';
            case 'female':
                return 'Female Speaker';
            case 'narrator':
                return 'Narrator';
            default:
                return 'Speaker';
        }
    }

    getSpeakerIcon(speaker) {
        switch (speaker) {
            case 'male':
                return '♂';
            case 'female':
                return '♀';
            case 'narrator':
                return '📢';
            default:
                return '👤';
        }
    }

    hideSpeakerIndicator(partNumber) {
        const indicator = document.getElementById(`speaker-indicator-part${partNumber}`);
        if (indicator) {
            indicator.classList.remove('active');
        }
    }

    finishAudio(partNumber) {
        console.log(`Finished playing Part ${partNumber} audio`);
        this.isPlaying = false;
        this.isProcessingQueue = false;
        
        // Hide speaker indicator
        this.hideSpeakerIndicator(partNumber);
        
        const playBtn = document.querySelector(`[data-part="${partNumber}"]`);
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-play"></i> Play Part ' + partNumber + ' Audio';
            playBtn.classList.remove('playing');
        }
    }

    stopAudio() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        this.isPlaying = false;
        this.isProcessingQueue = false;
        this.speechQueue = [];

        // Hide all speaker indicators
        for (let i = 1; i <= 4; i++) {
            this.hideSpeakerIndicator(i);
        }

        // Reset all play buttons
        document.querySelectorAll('.play-audio-btn').forEach(btn => {
            const partNumber = btn.dataset.part;
            btn.innerHTML = '<i class="fas fa-play"></i> Play Part ' + partNumber + ' Audio';
            btn.classList.remove('playing');
        });
    }

    reset() {
        this.stopAudio();
        
        const allOptions = document.querySelectorAll('.option');
        allOptions.forEach(option => option.classList.remove('selected'));
        
        const allTranslations = document.querySelectorAll('.question-translation');
        allTranslations.forEach(translation => translation.style.display = 'none');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IELTSListening;
}
