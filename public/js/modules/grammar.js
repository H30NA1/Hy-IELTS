// IELTS Grammar Module
class IELTSGrammar {
    constructor() {
        this.currentQuestion = 1;
        this.totalQuestions = 20;
        this.questions = this.generateGrammarQuestions();
    }

    initialize() {
        console.log('Grammar module initialized');
        this.renderQuestions();
        this.setupEventListeners();
    }

    generateGrammarQuestions() {
        return [
            {
                id: 'grammar-q1',
                type: 'multiple-choice',
                questionText: 'She _____ to the gym every morning.',
                options: ['A) go', 'B) goes', 'C) going', 'D) gone'],
                correctAnswer: 'B',
                explanation: 'Present simple third person singular takes -s/-es',
                translation: 'Cô ấy đi đến phòng tập mỗi sáng.'
            },
            {
                id: 'grammar-q2',
                type: 'multiple-choice',
                questionText: 'If I _____ rich, I would travel the world.',
                options: ['A) am', 'B) was', 'C) were', 'D) be'],
                correctAnswer: 'C',
                explanation: 'Second conditional uses "were" for all subjects',
                translation: 'Nếu tôi giàu, tôi sẽ du lịch khắp thế giới.'
            },
            {
                id: 'grammar-q3',
                type: 'multiple-choice',
                questionText: 'They _____ studying English for three years.',
                options: ['A) have been', 'B) has been', 'C) are', 'D) were'],
                correctAnswer: 'A',
                explanation: 'Present perfect continuous with "for" duration',
                translation: 'Họ đã học tiếng Anh được ba năm.'
            },
            {
                id: 'grammar-q4',
                type: 'multiple-choice',
                questionText: 'The report must _____ by tomorrow.',
                options: ['A) finish', 'B) be finished', 'C) finishing', 'D) finished'],
                correctAnswer: 'B',
                explanation: 'Passive voice with modal verb',
                translation: 'Báo cáo phải được hoàn thành trước ngày mai.'
            },
            {
                id: 'grammar-q5',
                type: 'multiple-choice',
                questionText: 'I wish I _____ more time to study.',
                options: ['A) have', 'B) had', 'C) has', 'D) having'],
                correctAnswer: 'B',
                explanation: '"I wish" + past simple for present unreal situations',
                translation: 'Tôi ước tôi có nhiều thời gian hơn để học.'
            },
            {
                id: 'grammar-q6',
                type: 'multiple-choice',
                questionText: '_____ is your favorite color?',
                options: ['A) What', 'B) Which', 'C) Who', 'D) Where'],
                correctAnswer: 'A',
                explanation: 'Use "What" for open questions about things',
                translation: 'Màu yêu thích của bạn là gì?'
            },
            {
                id: 'grammar-q7',
                type: 'multiple-choice',
                questionText: 'He told me that he _____ the book.',
                options: ['A) has read', 'B) had read', 'C) reads', 'D) reading'],
                correctAnswer: 'B',
                explanation: 'Past perfect in reported speech',
                translation: 'Anh ấy nói với tôi rằng anh ấy đã đọc cuốn sách.'
            },
            {
                id: 'grammar-q8',
                type: 'multiple-choice',
                questionText: 'Neither of the answers _____ correct.',
                options: ['A) is', 'B) are', 'C) be', 'D) being'],
                correctAnswer: 'A',
                explanation: '"Neither" is singular and takes singular verb',
                translation: 'Không câu trả lời nào đúng.'
            },
            {
                id: 'grammar-q9',
                type: 'multiple-choice',
                questionText: 'She suggested _____ a movie.',
                options: ['A) watch', 'B) to watch', 'C) watching', 'D) watched'],
                correctAnswer: 'C',
                explanation: '"Suggest" is followed by gerund (-ing form)',
                translation: 'Cô ấy đề nghị xem phim.'
            },
            {
                id: 'grammar-q10',
                type: 'multiple-choice',
                questionText: 'The car, _____ was very expensive, broke down.',
                options: ['A) who', 'B) which', 'C) whose', 'D) where'],
                correctAnswer: 'B',
                explanation: 'Use "which" for things in non-defining relative clauses',
                translation: 'Chiếc xe, cái mà rất đắt, đã hỏng.'
            },
            {
                id: 'grammar-q11',
                type: 'multiple-choice',
                questionText: 'By next year, I _____ in this company for 10 years.',
                options: ['A) work', 'B) will work', 'C) will have worked', 'D) worked'],
                correctAnswer: 'C',
                explanation: 'Future perfect for actions completed before a future time',
                translation: 'Đến năm sau, tôi sẽ đã làm việc ở công ty này được 10 năm.'
            },
            {
                id: 'grammar-q12',
                type: 'multiple-choice',
                questionText: 'She rarely _____ late to work.',
                options: ['A) come', 'B) comes', 'C) coming', 'D) came'],
                correctAnswer: 'B',
                explanation: 'Present simple with frequency adverbs',
                translation: 'Cô ấy hiếm khi đi làm muộn.'
            },
            {
                id: 'grammar-q13',
                type: 'multiple-choice',
                questionText: 'Would you mind _____ the window?',
                options: ['A) close', 'B) to close', 'C) closing', 'D) closed'],
                correctAnswer: 'C',
                explanation: '"Would you mind" + gerund (-ing)',
                translation: 'Bạn có phiền đóng cửa sổ không?'
            },
            {
                id: 'grammar-q14',
                type: 'multiple-choice',
                questionText: 'He was made _____ extra hours.',
                options: ['A) work', 'B) to work', 'C) working', 'D) worked'],
                correctAnswer: 'B',
                explanation: 'Passive causative "be made" + to infinitive',
                translation: 'Anh ấy bị bắt làm thêm giờ.'
            },
            {
                id: 'grammar-q15',
                type: 'multiple-choice',
                questionText: 'Despite _____ hard, he failed the exam.',
                options: ['A) study', 'B) to study', 'C) studying', 'D) studied'],
                correctAnswer: 'C',
                explanation: '"Despite" is followed by gerund or noun',
                translation: 'Mặc dù học chăm chỉ, anh ấy vẫn trượt kỳ thi.'
            },
            {
                id: 'grammar-q16',
                type: 'multiple-choice',
                questionText: 'The house _____ we lived was very old.',
                options: ['A) which', 'B) where', 'C) who', 'D) when'],
                correctAnswer: 'B',
                explanation: 'Use "where" for places in relative clauses',
                translation: 'Ngôi nhà nơi chúng tôi sống rất cũ.'
            },
            {
                id: 'grammar-q17',
                type: 'multiple-choice',
                questionText: 'No sooner had he arrived _____ it started raining.',
                options: ['A) when', 'B) than', 'C) then', 'D) as'],
                correctAnswer: 'B',
                explanation: '"No sooner... than" for immediate sequence',
                translation: 'Ngay sau khi anh ấy đến thì trời bắt đầu mưa.'
            },
            {
                id: 'grammar-q18',
                type: 'multiple-choice',
                questionText: 'She speaks English _____ than her brother.',
                options: ['A) more fluently', 'B) most fluently', 'C) fluent', 'D) fluently'],
                correctAnswer: 'A',
                explanation: 'Comparative adverbs for comparing two things',
                translation: 'Cô ấy nói tiếng Anh trôi chảy hơn anh trai cô ấy.'
            },
            {
                id: 'grammar-q19',
                type: 'multiple-choice',
                questionText: 'I would rather _____ at home than go out.',
                options: ['A) stay', 'B) to stay', 'C) staying', 'D) stayed'],
                correctAnswer: 'A',
                explanation: '"Would rather" + base form of verb',
                translation: 'Tôi thà ở nhà hơn là đi ra ngoài.'
            },
            {
                id: 'grammar-q20',
                type: 'multiple-choice',
                questionText: 'It is high time you _____ your homework.',
                options: ['A) do', 'B) did', 'C) done', 'D) doing'],
                correctAnswer: 'B',
                explanation: '"It is high time" + past simple',
                translation: 'Đã đến lúc bạn làm bài tập về nhà.'
            }
        ];
    }

    renderQuestions() {
        const container = document.getElementById('grammar-questions');
        if (!container) return;

        let html = `
            <div class="section-intro">
                <h2>Section 4: Grammar and Language Use</h2>
                <p class="section-description">
                    20 questions • Approximately 15 minutes<br>
                    Choose the correct answer for each grammar question.
                </p>
            </div>
            <div class="questions-grid">
        `;

        this.questions.forEach((question, index) => {
            html += `
                <div class="question-item" data-question-id="${question.id}">
                    <h4>Question ${index + 1}</h4>
                    <p class="question-text">${question.questionText}</p>
                    <div class="options">
                        ${question.options.map((option, optIndex) => `
                            <div class="option" data-question="${question.id}" data-option="${optIndex}">
                                <div class="option-label">${option[0]}</div>
                                <div class="option-text">${option}</div>
                                <input type="radio" 
                                       name="${question.id}" 
                                       id="${question.id}-${option[0]}" 
                                       value="${option[0]}"
                                       style="display: none;">
                            </div>
                        `).join('')}
                    </div>
                    ${this.translationEnabled ? `<p class="translation" style="display: none;">${question.translation}</p>` : ''}
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    setupEventListeners() {
        // Option selection (only for grammar section)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option')) {
                const option = e.target.closest('.option');
                // Only process if this option is in the grammar section
                const grammarSection = option.closest('#grammar');
                if (!grammarSection) return;
                
                const questionId = option.dataset.question;
                
                // Remove selection from all options for this question
                const questionContainer = option.closest('.question-item');
                questionContainer.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                
                // Select this option
                option.classList.add('selected');
                
                // Get the option letter (A, B, C, D)
                const optionLabel = option.querySelector('.option-label').textContent;
                
                // Check the hidden radio button
                const radio = option.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
                
                this.saveAnswer(questionId, optionLabel);
            }
        });
    }

    saveAnswer(questionId, answer) {
        if (!window.ieltsTest) return;
        if (!window.ieltsTest.answers.grammar) {
            window.ieltsTest.answers.grammar = {};
        }
        window.ieltsTest.answers.grammar[questionId] = answer;
        console.log(`Grammar answer saved: ${questionId} = ${answer}`);
    }

    reset() {
        if (window.ieltsTest && window.ieltsTest.answers) {
            window.ieltsTest.answers.grammar = {};
        }
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
    }

    getAnswers() {
        return window.ieltsTest?.answers?.grammar || {};
    }
}

// Export for use in main application
window.IELTSGrammar = IELTSGrammar;

