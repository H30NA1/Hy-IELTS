export class BrowserWritingChecker {
    constructor() {
        this.grammarRules = {
            capitalization: [
                { pattern: /^[a-z]/g, message: "Sentence should start with capital letter", fix: (m) => m.toUpperCase() },
                { pattern: /([.!?]\s+)([a-z])/g, message: "New sentence should start with capital letter", fix: (m, p1, p2) => p1 + p2.toUpperCase() },
                { pattern: /\b(i)\b/g, message: "Personal pronoun 'I' should be capitalized", fix: () => "I" }
            ],
            spacing: [
                { pattern: /\s{2,}/g, message: "Multiple spaces detected", fix: () => " " },
                { pattern: /(\s+)([.!?,])/g, message: "No space before punctuation", fix: (m, p1, p2) => p2 },
                { pattern: /([.!?])([a-zA-Z])/g, message: "Space needed after punctuation", fix: (m, p1, p2) => p1 + " " + p2 }
            ],
            punctuation: [
                { pattern: /([.!?]){2,}/g, message: "Multiple punctuation marks", fix: (m, p1) => p1 }
            ]
        };

        this.commonErrors = {
            grammar: [
                { pattern: /\b(am|is|are)\s+(am|is|are)\b/gi, message: "Double verb usage", fix: (m, p1) => p1 },
                { pattern: /\b(do|does|did)\s+(do|does|did)\b/gi, message: "Double auxiliary verb", fix: (m, p1) => p1 },
                { pattern: /\b(has|have|had)\s+(has|have|had)\b/gi, message: "Double auxiliary verb", fix: (m, p1) => p1 }
            ],
            spelling: [
                { pattern: /\b(recieve)\b/gi, message: "Incorrect spelling", suggestion: "receive" },
                { pattern: /\b(seperate)\b/gi, message: "Incorrect spelling", suggestion: "separate" },
                { pattern: /\b(occured)\b/gi, message: "Incorrect spelling", suggestion: "occurred" },
                { pattern: /\b(accomodate)\b/gi, message: "Incorrect spelling", suggestion: "accommodate" },
                { pattern: /\b(neccessary)\b/gi, message: "Incorrect spelling", suggestion: "necessary" },
                { pattern: /\b(definately)\b/gi, message: "Incorrect spelling", suggestion: "definitely" },
                { pattern: /\b(teh)\b/gi, message: "Incorrect spelling", suggestion: "the" },
                { pattern: /\b(wont)\b/gi, message: "Incorrect spelling", suggestion: "won't" },
                { pattern: /\b(dont)\b/gi, message: "Incorrect spelling", suggestion: "don't" },
                { pattern: /\b(cant)\b/gi, message: "Incorrect spelling", suggestion: "can't" }
            ]
        };
    }

    check(text) {
        const issues = [];

        // Check Capitalization
        this.grammarRules.capitalization.forEach(rule => this.findIssues(text, rule, 'capitalization', issues));

        // Check Spacing
        this.grammarRules.spacing.forEach(rule => this.findIssues(text, rule, 'spacing', issues));

        // Check Punctuation
        this.grammarRules.punctuation.forEach(rule => this.findIssues(text, rule, 'punctuation', issues));

        // Check Grammar
        this.commonErrors.grammar.forEach(rule => this.findIssues(text, rule, 'grammar', issues));

        // Check Spelling
        this.commonErrors.spelling.forEach(rule => this.findIssues(text, rule, 'spelling', issues));

        return issues.sort((a, b) => a.index - b.index);
    }

    findIssues(text, rule, type, issues) {
        let match;
        const regex = new RegExp(rule.pattern);

        while ((match = regex.exec(text)) !== null) {
            let suggestion = rule.suggestion || null;

            if (!suggestion && rule.fix) {
                try {
                    suggestion = rule.fix(match[0], ...match.slice(1));
                } catch (e) {
                    // Fallback if fix function fails or arguments mismatch
                    console.warn("Fix generation failed", e);
                }
            }

            issues.push({
                type,
                message: rule.message,
                suggestion: suggestion,
                index: match.index,
                length: match[0].length,
                text: match[0]
            });
        }
    }
}
