const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const sentenceTokenizer = new natural.SentenceTokenizer();

class WritingChecker {
    constructor() {
        this.grammarRules = {
            capitalization: [
                { pattern: /^[a-z]/, message: "Sentence should start with capital letter" },
                { pattern: /[.!?]\s+[a-z]/, message: "New sentence should start with capital letter" },
                { pattern: /\b(i)\b/, message: "Personal pronoun 'I' should be capitalized" }
            ],
            spacing: [
                { pattern: /\s{2,}/, message: "Multiple spaces detected" },
                { pattern: /\s+[.!?]/, message: "No space before punctuation" },
                { pattern: /[.!?]\s*[a-zA-Z]/, message: "Space needed after punctuation" }
            ],
            punctuation: [
                { pattern: /[.!?]{2,}/, message: "Multiple punctuation marks" },
                { pattern: /[a-z]\s*[A-Z]/, message: "Missing punctuation between sentences" }
            ]
        };

        this.commonErrors = {
            grammar: [
                { pattern: /\b(am|is|are)\s+(am|is|are)\b/, message: "Double verb usage" },
                { pattern: /\b(do|does|did)\s+(do|does|did)\b/, message: "Double auxiliary verb" },
                { pattern: /\b(has|have|had)\s+(has|have|had)\b/, message: "Double auxiliary verb" },
                { pattern: /\b(was|were)\s+(was|were)\b/, message: "Double past tense verb" },
                { pattern: /\b(will|would|can|could|should|might|may)\s+(will|would|can|could|should|might|may)\b/, message: "Double modal verb" }
            ],
            spelling: [
                { pattern: /\b(recieve)\b/, message: "Incorrect spelling: 'receive'" },
                { pattern: /\b(seperate)\b/, message: "Incorrect spelling: 'separate'" },
                { pattern: /\b(occured)\b/, message: "Incorrect spelling: 'occurred'" },
                { pattern: /\b(accomodate)\b/, message: "Incorrect spelling: 'accommodate'" },
                { pattern: /\b(neccessary)\b/, message: "Incorrect spelling: 'necessary'" },
                { pattern: /\b(definately)\b/, message: "Incorrect spelling: 'definitely'" },
                { pattern: /\b(occassion)\b/, message: "Incorrect spelling: 'occasion'" },
                { pattern: /\b(embarass)\b/, message: "Incorrect spelling: 'embarrass'" }
            ]
        };

        this.themeKeywords = {
            travel_recommendations: [
                'visit', 'place', 'food', 'restaurant', 'museum', 'park', 'attraction',
                'tourist', 'local', 'recommend', 'suggest', 'try', 'see', 'experience',
                'delicious', 'famous', 'popular', 'beautiful', 'interesting', 'amazing'
            ],
            family_meals_technology: [
                'family', 'meal', 'dinner', 'lunch', 'breakfast', 'phone', 'mobile',
                'technology', 'device', 'screen', 'conversation', 'communication',
                'together', 'quality time', 'distraction', 'rule', 'policy', 'agree',
                'disagree', 'benefit', 'disadvantage', 'relationship', 'bonding'
            ],
            leisure_activities: [
                'activity', 'hobby', 'entertainment', 'relaxation', 'free time',
                'leisure', 'recreation', 'pastime', 'enjoyment', 'preference',
                'percentage', 'popular', 'common', 'favorite', 'choice', 'option'
            ]
        };
    }

    checkWriting(text, taskType, wordLimit = null) {
        const results = {
            overall: {
                score: 0,
                grade: '',
                feedback: []
            },
            grammar: {
                score: 0,
                errors: [],
                suggestions: []
            },
            mechanics: {
                score: 0,
                errors: [],
                suggestions: []
            },
            content: {
                score: 0,
                feedback: [],
                themeMatch: 0
            },
            wordCount: {
                current: 0,
                required: wordLimit,
                feedback: ''
            }
        };

        // Basic text analysis
        const sentences = sentenceTokenizer.tokenize(text);
        const words = tokenizer.tokenize(text);
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);

        // Word count analysis
        results.wordCount.current = words.length;
        if (wordLimit) {
            if (words.length < wordLimit.min) {
                results.wordCount.feedback = `Too few words. You need at least ${wordLimit.min} words.`;
                results.overall.score -= 10;
            } else if (words.length > wordLimit.max) {
                results.wordCount.feedback = `Too many words. Limit to ${wordLimit.max} words.`;
                results.overall.score -= 5;
            } else {
                results.wordCount.feedback = `Good word count (${words.length} words).`;
                results.overall.score += 5;
            }
        }

        // Grammar and mechanics check
        this.checkGrammarAndMechanics(text, results);
        
        // Content and theme check
        this.checkContentAndTheme(text, taskType, results);
        
        // Calculate overall score
        this.calculateOverallScore(results);

        return results;
    }

    checkGrammarAndMechanics(text, results) {
        let grammarScore = 100;
        let mechanicsScore = 100;

        // Check capitalization rules
        this.grammarRules.capitalization.forEach(rule => {
            const matches = text.match(new RegExp(rule.pattern, 'g'));
            if (matches) {
                results.mechanics.errors.push({
                    type: 'capitalization',
                    message: rule.message,
                    count: matches.length
                });
                mechanicsScore -= matches.length * 2;
            }
        });

        // Check spacing rules
        this.grammarRules.spacing.forEach(rule => {
            const matches = text.match(new RegExp(rule.pattern, 'g'));
            if (matches) {
                results.mechanics.errors.push({
                    type: 'spacing',
                    message: rule.message,
                    count: matches.length
                });
                mechanicsScore -= matches.length * 1;
            }
        });

        // Check punctuation rules
        this.grammarRules.punctuation.forEach(rule => {
            const matches = text.match(new RegExp(rule.pattern, 'g'));
            if (matches) {
                results.mechanics.errors.push({
                    type: 'punctuation',
                    message: rule.message,
                    count: matches.length
                });
                mechanicsScore -= matches.length * 2;
            }
        });

        // Check common grammar errors
        this.commonErrors.grammar.forEach(rule => {
            const matches = text.match(new RegExp(rule.pattern, 'gi'));
            if (matches) {
                results.grammar.errors.push({
                    type: 'grammar',
                    message: rule.message,
                    count: matches.length
                });
                grammarScore -= matches.length * 5;
            }
        });

        // Check spelling errors
        this.commonErrors.spelling.forEach(rule => {
            const matches = text.match(new RegExp(rule.pattern, 'gi'));
            if (matches) {
                results.grammar.errors.push({
                    type: 'spelling',
                    message: rule.message,
                    count: matches.length
                });
                grammarScore -= matches.length * 3;
            }
        });

        // Check sentence structure
        const sentences = sentenceTokenizer.tokenize(text);
        sentences.forEach((sentence, index) => {
            const words = tokenizer.tokenize(sentence);
            
            // Check for very short sentences
            if (words.length < 3) {
                results.grammar.errors.push({
                    type: 'structure',
                    message: `Sentence ${index + 1} is too short`,
                    count: 1
                });
                grammarScore -= 3;
            }

            // Check for very long sentences
            if (words.length > 25) {
                results.grammar.errors.push({
                    type: 'structure',
                    message: `Sentence ${index + 1} is too long`,
                    count: 1
                });
                grammarScore -= 2;
            }
        });

        // Ensure scores don't go below 0
        results.grammar.score = Math.max(0, grammarScore);
        results.mechanics.score = Math.max(0, mechanicsScore);
    }

    checkContentAndTheme(text, taskType, results) {
        let contentScore = 100;
        const words = tokenizer.tokenize(text.toLowerCase());
        const themeKeywords = this.themeKeywords[taskType] || [];

        // Check theme relevance
        let themeMatches = 0;
        themeKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) {
                themeMatches += matches.length;
            }
        });

        const themeMatchPercentage = (themeMatches / words.length) * 100;
        results.content.themeMatch = themeMatchPercentage;

        if (themeMatchPercentage < 5) {
            results.content.feedback.push("Content doesn't seem to match the task theme well.");
            contentScore -= 20;
        } else if (themeMatchPercentage > 15) {
            results.content.feedback.push("Good use of relevant vocabulary.");
            contentScore += 10;
        }

        // Check for task-specific requirements
        switch (taskType) {
            case 'thank_you_note':
                if (!text.toLowerCase().includes('thank')) {
                    results.content.feedback.push("Thank you note should include expressions of gratitude.");
                    contentScore -= 15;
                }
                if (!text.toLowerCase().includes('gift')) {
                    results.content.feedback.push("Should mention offering a gift in return.");
                    contentScore -= 10;
                }
                break;

            case 'opinion_essay':
                const opinionWords = ['agree', 'disagree', 'think', 'believe', 'opinion', 'view'];
                const hasOpinion = opinionWords.some(word => text.toLowerCase().includes(word));
                if (!hasOpinion) {
                    results.content.feedback.push("Opinion essay should clearly state your position.");
                    contentScore -= 15;
                }
                break;

            case 'data_description':
                const dataWords = ['percent', 'percentage', 'chart', 'data', 'shows', 'indicates'];
                const hasData = dataWords.some(word => text.toLowerCase().includes(word));
                if (!hasData) {
                    results.content.feedback.push("Data description should reference the chart information.");
                    contentScore -= 15;
                }
                break;
        }

        // Check paragraph structure
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        if (paragraphs.length < 2) {
            results.content.feedback.push("Consider using paragraphs to organize your ideas.");
            contentScore -= 10;
        }

        results.content.score = Math.max(0, contentScore);
    }

    calculateOverallScore(results) {
        const grammarWeight = 0.3;
        const mechanicsWeight = 0.2;
        const contentWeight = 0.5;

        const overallScore = Math.round(
            (results.grammar.score * grammarWeight) +
            (results.mechanics.score * mechanicsWeight) +
            (results.content.score * contentWeight)
        );

        results.overall.score = overallScore;
        results.overall.grade = this.getGrade(overallScore);

        // Generate overall feedback
        if (results.grammar.score < 70) {
            results.overall.feedback.push("Focus on improving grammar accuracy.");
        }
        if (results.mechanics.score < 70) {
            results.overall.feedback.push("Pay attention to capitalization and punctuation.");
        }
        if (results.content.score < 70) {
            results.overall.feedback.push("Work on content relevance and task completion.");
        }
        if (results.overall.score >= 80) {
            results.overall.feedback.push("Excellent work! Keep up the good writing.");
        }
    }

    getGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'B-';
        if (score >= 60) return 'C+';
        if (score >= 55) return 'C';
        if (score >= 50) return 'C-';
        if (score >= 45) return 'D+';
        if (score >= 40) return 'D';
        return 'F';
    }

    generateDetailedFeedback(results) {
        const feedback = {
            summary: `Overall Grade: ${results.overall.grade} (${results.overall.score}/100)`,
            strengths: [],
            areas: [],
            suggestions: []
        };

        // Identify strengths
        if (results.grammar.score >= 80) {
            feedback.strengths.push("Good grammar usage");
        }
        if (results.mechanics.score >= 80) {
            feedback.strengths.push("Good use of capitalization and punctuation");
        }
        if (results.content.score >= 80) {
            feedback.strengths.push("Content is relevant and well-structured");
        }
        if (results.wordCount.feedback.includes("Good word count")) {
            feedback.strengths.push("Appropriate word count");
        }

        // Identify areas for improvement
        if (results.grammar.score < 70) {
            feedback.areas.push("Grammar accuracy needs improvement");
        }
        if (results.mechanics.score < 70) {
            feedback.areas.push("Mechanics (capitalization, punctuation, spacing) need attention");
        }
        if (results.content.score < 70) {
            feedback.areas.push("Content relevance and task completion need work");
        }

        // Generate specific suggestions
        results.grammar.errors.forEach(error => {
            feedback.suggestions.push(`${error.message} (${error.count} occurrence${error.count > 1 ? 's' : ''})`);
        });

        results.mechanics.errors.forEach(error => {
            feedback.suggestions.push(`${error.message} (${error.count} occurrence${error.count > 1 ? 's' : ''})`);
        });

        results.content.feedback.forEach(feedback => {
            feedback.suggestions.push(feedback);
        });

        return feedback;
    }
}

module.exports = WritingChecker; 