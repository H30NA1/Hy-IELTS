# IELTS Starter 1.0 Practice Test System

A modern, mobile-friendly IELTS practice test application with server-side functionality, answer storage, and PDF generation.

## Features

- **Modern UI/UX**: Clean, responsive design optimized for mobile devices
- **Real-time Timer**: Tracks test duration
- **Progress Tracking**: Visual progress bar showing completion status
- **Answer Highlighting**: Shows correct/incorrect answers after submission
- **PDF Generation**: Creates beautiful PDF reports with results
- **Data Storage**: Saves all submissions as JSON files organized by date
- **Question Management**: Loads questions from JSON files for easy updates
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Mobile Optimized**: Works perfectly on Android, iOS, and tablets
- **🔥 Writing Assessment**: AI-powered writing analysis with grammar, mechanics, and content feedback

## Project Structure

```
Hy-IELTS/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   └── script.js          # Frontend JavaScript
├── questions/             # Question sets (JSON files)
│   └── 2025-08-04.json   # Main question set
├── data/                  # User submissions (auto-created)
├── pdfs/                  # Generated PDFs (auto-created)
├── server.js              # Express server
├── package.json           # Dependencies
└── README.md             # This file
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

**🔥 Hot Reload Development (Recommended)**

For the best development experience with automatic browser refresh:

```bash
npm run hot
```

This will:
- Start the server with nodemon (auto-restart on file changes)
- Start browser-sync (automatic browser refresh)
- Open your browser automatically
- Watch for changes in `public/`, `questions/`, and `server.js`

**Alternative Development Commands:**

```bash
# Basic development with nodemon
npm run dev

# Development with detailed file watching
npm run dev:watch

# Development with debugging enabled
npm run dev:debug

# Browser sync only (requires server to be running)
npm run dev:sync

# Full development environment (concurrently)
npm run dev:full
```

### 3. Access the Application

- **Local**: http://localhost:8080
- **Hot Reload**: http://localhost:3000 (when using `npm run hot`)
- **Public (with ngrok)**: `ngrok http 8080`

## Question Management

### Question File Format

Questions are stored in JSON files in the `questions/` directory. The filename format is `YYYY-MM-DD.json`.

Example structure:
```json
{
  "testId": "IELTS_STARTER_1_0",
  "testDate": "2025-08-04",
  "testTitle": "IELTS Starter 1.0 Practice Test",
  "totalQuestions": 50,
  "sections": {
    "grammar": {
      "title": "Section A: Grammar & Vocabulary",
      "description": "30 multiple-choice questions",
      "questions": [...]
    },
    "reading": {
      "title": "Section B: Reading Comprehension",
      "description": "20 multiple-choice questions",
      "passages": [...]
    },
    "writing": {
      "title": "Section C: Writing",
      "description": "3 writing tasks",
      "tasks": [...]
    }
  }
}
```

### Adding New Question Sets

1. Create a new JSON file in the `questions/` directory
2. Follow the format of `2025-08-04.json`
3. The server will automatically load the appropriate file based on the date

### API Endpoints for Question Management

- `GET /api/questions/list` - List all available question sets
- `POST /api/questions/upload` - Upload a new question set
- `GET /api/test-data/:date` - Get test data for a specific date

## Writing Assessment

### AI-Powered Writing Analysis

The system includes a comprehensive writing assessment service that analyzes student writing in real-time:

#### **Assessment Criteria:**

1. **Grammar (30% weight)**
   - Sentence structure analysis
   - Common grammar error detection
   - Spelling correction
   - Verb tense consistency

2. **Mechanics (20% weight)**
   - Capitalization rules
   - Punctuation accuracy
   - Spacing and formatting
   - Line break consistency

3. **Content (50% weight)**
   - Theme relevance matching
   - Task completion assessment
   - Word count compliance
   - Paragraph structure

#### **Real-time Features:**

- **Instant Feedback**: Writing is analyzed as you type (2-second delay)
- **Detailed Scoring**: Individual scores for grammar, mechanics, and content
- **Specific Suggestions**: Actionable improvement recommendations
- **Theme Matching**: Ensures content aligns with task requirements
- **Word Count Monitoring**: Tracks compliance with word limits

#### **Writing Assessment API Endpoints:**

- `POST /api/writing/check` - Check individual writing task
- `POST /api/writing/check-all` - Check all writing tasks at once
- `GET /api/writing/sample-feedback` - Get sample feedback for task types

#### **Supported Task Types:**

- **Thank You Notes**: Evaluates gratitude expressions and gift offerings
- **Opinion Essays**: Checks for clear position statements and reasoning
- **Data Descriptions**: Analyzes chart interpretation and comparisons

#### **Feedback Categories:**

- **Strengths**: Highlights what the student did well
- **Areas for Improvement**: Identifies specific weaknesses
- **Suggestions**: Provides actionable improvement tips
- **Word Count**: Monitors compliance with requirements

## Data Storage

### User Submissions

All test submissions are stored in the `data/` directory, organized by date:

```
data/
├── 2025-08-04/
│   ├── abc123_14-30-25.json
│   └── def456_15-45-12.json
└── 2025-08-05/
    └── ghi789_09-15-30.json
```

Each submission file contains:
- User answers
- Test results
- Timestamp
- Time spent
- User information

### PDF Reports

Generated PDFs are stored in the `pdfs/` directory with the submission ID as the filename.

## API Endpoints

### Test Data
- `GET /api/test-data` - Get current test data
- `GET /api/test-data/:date` - Get test data for specific date

### Test Submission
- `POST /api/submit-test` - Submit test answers
- `GET /api/download-pdf/:submissionId` - Download PDF report

### Question Management
- `GET /api/questions/list` - List question sets
- `POST /api/questions/upload` - Upload question set

### Writing Assessment
- `POST /api/writing/check` - Check individual writing task
- `POST /api/writing/check-all` - Check all writing tasks
- `GET /api/writing/sample-feedback` - Get sample feedback

## Configuration

### Environment Variables

- `PORT` - Server port (default: 8080)

### Server Configuration

The server automatically:
- Creates necessary directories (`data/`, `pdfs/`)
- Loads questions from JSON files
- Handles CORS for cross-origin requests
- Compresses responses for better performance
- Implements security headers with Helmet

## Deployment

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Access at http://localhost:8080

### Production Deployment

1. Set up a Node.js environment
2. Install dependencies: `npm install --production`
3. Start the server: `npm start`
4. Use a process manager like PM2 for production

### Using ngrok for Public Access

```bash
# Install ngrok
npm install -g ngrok

# Start the server
npm start

# In another terminal, expose the server
ngrok http 8080
```

The ngrok URL can be shared with candidates to access the test.

## Features in Detail

### Mobile Optimization

- Responsive design that works on all screen sizes
- Touch-friendly interface
- Optimized for mobile keyboards
- Fast loading with compression

### Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Focus management

### Security

- Input validation
- XSS protection
- CSRF protection
- Secure headers

### Performance

- Response compression
- Static file serving
- Efficient JSON parsing
- Optimized PDF generation

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the PORT environment variable
2. **PDF generation fails**: Ensure Puppeteer dependencies are installed
3. **Questions not loading**: Check the JSON file format in the questions directory

### Logs

The server provides detailed logging:
- Question loading status
- API request logs
- Error messages
- PDF generation status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check the server logs
4. Create an issue in the repository

---

**IELTS Starter 1.0** - Making IELTS practice accessible and effective.