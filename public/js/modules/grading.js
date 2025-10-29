// IELTS Grading System Module
class IELTSGrading {
    constructor() {
        this.bandScoreRanges = {
            listening: {
                9.0: { min: 39, max: 40 },
                8.5: { min: 38, max: 38 },
                8.0: { min: 37, max: 37 },
                7.5: { min: 36, max: 36 },
                7.0: { min: 35, max: 35 },
                6.5: { min: 34, max: 34 },
                6.0: { min: 33, max: 33 },
                5.5: { min: 32, max: 32 },
                5.0: { min: 31, max: 31 },
                4.5: { min: 30, max: 30 },
                4.0: { min: 29, max: 29 },
                3.5: { min: 28, max: 28 },
                3.0: { min: 27, max: 27 },
                2.5: { min: 26, max: 26 },
                2.0: { min: 25, max: 25 },
                1.5: { min: 24, max: 24 },
                1.0: { min: 23, max: 23 }
            },
            reading: {
                9.0: { min: 39, max: 40 },
                8.5: { min: 38, max: 38 },
                8.0: { min: 37, max: 37 },
                7.5: { min: 36, max: 36 },
                7.0: { min: 35, max: 35 },
                6.5: { min: 34, max: 34 },
                6.0: { min: 33, max: 33 },
                5.5: { min: 32, max: 32 },
                5.0: { min: 31, max: 31 },
                4.5: { min: 30, max: 30 },
                4.0: { min: 29, max: 29 },
                3.5: { min: 28, max: 28 },
                3.0: { min: 27, max: 27 },
                2.5: { min: 26, max: 26 },
                2.0: { min: 25, max: 25 },
                1.5: { min: 24, max: 24 },
                1.0: { min: 23, max: 23 }
            }
        };
    }

    convertToIELTSBand(rawScore, total, section) {
        const percentage = (rawScore / total) * 100;
        
        switch (section) {
            case 'listening':
                return this.getBandFromPercentage(percentage, 'listening');
            case 'reading':
                return this.getBandFromPercentage(percentage, 'reading');
            case 'writing':
                return this.getWritingBand(percentage);
            case 'grammar':
                return this.getGrammarBand(percentage);
            default:
                return 0.0;
        }
    }

    getGrammarBand(percentage) {
        // Grammar: Based on accuracy and range of structures
        if (percentage >= 95) return 9.0;
        if (percentage >= 90) return 8.5;
        if (percentage >= 85) return 8.0;
        if (percentage >= 80) return 7.5;
        if (percentage >= 75) return 7.0;
        if (percentage >= 70) return 6.5;
        if (percentage >= 65) return 6.0;
        if (percentage >= 60) return 5.5;
        if (percentage >= 55) return 5.0;
        if (percentage >= 50) return 4.5;
        if (percentage >= 45) return 4.0;
        if (percentage >= 40) return 3.5;
        if (percentage >= 35) return 3.0;
        if (percentage >= 30) return 2.5;
        if (percentage >= 25) return 2.0;
        if (percentage >= 20) return 1.5;
        if (percentage >= 15) return 1.0;
        return 0.0;
    }

    getBandFromPercentage(percentage, section) {
        if (percentage >= 97.5) return 9.0;
        if (percentage >= 95) return 8.5;
        if (percentage >= 92.5) return 8.0;
        if (percentage >= 90) return 7.5;
        if (percentage >= 87.5) return 7.0;
        if (percentage >= 85) return 6.5;
        if (percentage >= 82.5) return 6.0;
        if (percentage >= 80) return 5.5;
        if (percentage >= 77.5) return 5.0;
        if (percentage >= 75) return 4.5;
        if (percentage >= 72.5) return 4.0;
        if (percentage >= 70) return 3.5;
        if (percentage >= 67.5) return 3.0;
        if (percentage >= 65) return 2.5;
        if (percentage >= 62.5) return 2.0;
        if (percentage >= 60) return 1.5;
        if (percentage >= 57.5) return 1.0;
        return 0.0;
    }

    getWritingBand(percentage) {
        // Writing: Based on task achievement, coherence, lexical resource, grammar
        if (percentage >= 90) return 9.0;
        if (percentage >= 80) return 8.0;
        if (percentage >= 70) return 7.0;
        if (percentage >= 60) return 6.0;
        if (percentage >= 50) return 5.0;
        if (percentage >= 40) return 4.0;
        if (percentage >= 30) return 3.0;
        if (percentage >= 20) return 2.0;
        if (percentage >= 10) return 1.0;
        return 0.0;
    }

    getSpeakingBand(percentage) {
        // Speaking: Based on fluency, coherence, lexical resource, grammar, pronunciation
        if (percentage >= 90) return 9.0;
        if (percentage >= 80) return 8.0;
        if (percentage >= 70) return 7.0;
        if (percentage >= 60) return 6.0;
        if (percentage >= 50) return 5.0;
        if (percentage >= 40) return 4.0;
        if (percentage >= 30) return 3.0;
        if (percentage >= 20) return 2.0;
        if (percentage >= 10) return 1.0;
        return 0.0;
    }

    calculateOverallBand(listeningBand, readingBand, writingBand, speakingBand, grammarBand) {
        const total = listeningBand + readingBand + writingBand + speakingBand + grammarBand;
        const average = total / 5;
        
        // Round to nearest 0.5
        return Math.round(average * 2) / 2;
    }

    calculateSectionScore(answers, section, totalQuestions, testData) {
        let score = 0;
        let translationPenalty = 0;

        if (!answers[section]) return { score: 0, penalty: 0 };

        // Get the correct answers from test data
        const correctAnswers = this.getCorrectAnswers(section, testData);
        
        Object.entries(answers[section]).forEach(([questionId, selectedOption]) => {
            const isTranslated = answers.translatedQuestions && 
                answers.translatedQuestions.includes(parseInt(questionId));
            
            // Check if the answer is correct
            const correctAnswer = correctAnswers[questionId];
            const isCorrect = this.isAnswerCorrect(selectedOption, correctAnswer);
            
            if (isCorrect) {
                if (isTranslated) {
                    translationPenalty += 0.5;
                    score += 0.5; // Reduced score for translation use
                } else {
                    score += 1; // Full score for correct answer
                }
            }
            // No points for incorrect answers
        });

        return { 
            score: Math.min(score, totalQuestions), 
            penalty: translationPenalty 
        };
    }

    getCorrectAnswers(section, testData) {
        const correctAnswers = {};
        
        if (!testData || !testData.sections) return correctAnswers;
        
        const sectionData = testData.sections.find(s => s.id === section);
        if (!sectionData) return correctAnswers;
        
        if (section === 'listening' && sectionData.parts) {
            sectionData.parts.forEach(part => {
                if (part.questions) {
                    part.questions.forEach(question => {
                        correctAnswers[question.id] = question.correctAnswer;
                    });
                }
            });
        } else if (section === 'reading' && sectionData.passages) {
            sectionData.passages.forEach(passage => {
                if (passage.questions) {
                    passage.questions.forEach(question => {
                        correctAnswers[question.id] = question.correctAnswer;
                    });
                }
            });
        } else if (section === 'grammar' && sectionData.questions) {
            sectionData.questions.forEach(question => {
                correctAnswers[question.id] = question.correctAnswer;
            });
        }
        
        return correctAnswers;
    }

    isAnswerCorrect(selectedOption, correctAnswer) {
        if (!correctAnswer) return false;
        
        // selectedOption is already a letter (A, B, C, D), no conversion needed
        return selectedOption === correctAnswer;
    }

    calculateWritingScore(answers) {
        let totalScore = 0;
        
        if (!answers.writing) return totalScore;

        Object.entries(answers.writing).forEach(([taskKey, text]) => {
            if (text && text.trim().length > 0) {
                const wordCount = IELTSUtils.countWords(text);
                let taskScore = 0;
                
                if (taskKey === 'task1') {
                    // Task 1: 150 words minimum
                    if (wordCount >= 150) {
                        taskScore = 10; // Full points for 150+ words
                    } else if (wordCount >= 100) {
                        taskScore = 7; // Partial points for 100-149 words
                    } else if (wordCount >= 50) {
                        taskScore = 4; // Some points for 50-99 words
                    }
                } else if (taskKey === 'task2') {
                    // Task 2: 250 words minimum
                    if (wordCount >= 250) {
                        taskScore = 10; // Full points for 250+ words
                    } else if (wordCount >= 200) {
                        taskScore = 8; // Good points for 200-249 words
                    } else if (wordCount >= 150) {
                        taskScore = 6; // Partial points for 150-199 words
                    } else if (wordCount >= 100) {
                        taskScore = 4; // Some points for 100-149 words
                    }
                }
                
                totalScore += taskScore;
            }
        });

        return totalScore;
    }

    calculateSpeakingScore(answers) {
        let totalScore = 0;
        
        if (!answers.speaking) return totalScore;

        Object.entries(answers.speaking).forEach(([partKey, text]) => {
            if (text && text.trim().length > 0) {
                const wordCount = IELTSUtils.countWords(text);
                let partScore = 0;
                
                if (partKey === 'part1') {
                    // Part 1: Short answers
                    if (wordCount >= 50) {
                        partScore = 7; // Good response
                    } else if (wordCount >= 30) {
                        partScore = 5; // Adequate response
                    } else if (wordCount >= 15) {
                        partScore = 3; // Basic response
                    }
                } else if (partKey === 'part2') {
                    // Part 2: Long turn (1-2 minutes)
                    if (wordCount >= 200) {
                        partScore = 7; // Excellent long turn
                    } else if (wordCount >= 150) {
                        partScore = 5; // Good long turn
                    } else if (wordCount >= 100) {
                        partScore = 3; // Adequate long turn
                    }
                } else if (partKey === 'part3') {
                    // Part 3: Discussion
                    if (wordCount >= 150) {
                        partScore = 6; // Good discussion
                    } else if (wordCount >= 100) {
                        partScore = 4; // Adequate discussion
                    } else if (wordCount >= 50) {
                        partScore = 2; // Basic discussion
                    }
                }
                
                totalScore += partScore;
            }
        });

        return totalScore;
    }

    calculateResults(answers, testData) {
        const listeningResult = this.calculateSectionScore(answers, 'listening', 40, testData);
        const readingResult = this.calculateSectionScore(answers, 'reading', 30, testData);
        const grammarResult = this.calculateSectionScore(answers, 'grammar', 20, testData);
        const writingScore = this.calculateWritingScore(answers);
        const speakingScore = this.calculateSpeakingScore(answers);
        
        const totalScore = listeningResult.score + readingResult.score + grammarResult.score + writingScore + speakingScore;
        const totalPenalty = listeningResult.penalty + readingResult.penalty + grammarResult.penalty;
        
        // Calculate band scores
        const listeningBand = this.convertToIELTSBand(listeningResult.score, 40, 'listening');
        const readingBand = this.convertToIELTSBand(readingResult.score, 30, 'reading');
        const grammarBand = this.convertToIELTSBand(grammarResult.score, 20, 'grammar');
        const writingBand = this.convertToIELTSBand(writingScore, 20, 'writing');
        const speakingBand = this.convertToIELTSBand(speakingScore, 20, 'speaking');
        const overallBand = this.calculateOverallBand(listeningBand, readingBand, writingBand, speakingBand, grammarBand);
        
        return {
            listening: Math.round(listeningResult.score * 100) / 100,
            reading: Math.round(readingResult.score * 100) / 100,
            grammar: Math.round(grammarResult.score * 100) / 100,
            writing: Math.round(writingScore * 100) / 100,
            speaking: Math.round(speakingScore * 100) / 100,
            total: Math.max(0, Math.round(totalScore * 100) / 100),
            listeningTotal: 40,
            readingTotal: 30,
            grammarTotal: 20,
            writingTotal: 20,
            speakingTotal: 20,
            translationPenalty: Math.round(totalPenalty * 100) / 100,
            bands: {
                listening: listeningBand,
                reading: readingBand,
                grammar: grammarBand,
                writing: writingBand,
                speaking: speakingBand,
                overall: overallBand
            }
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IELTSGrading;
}
