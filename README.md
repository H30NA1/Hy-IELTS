# 🎓 IELTS Practice Test - Full Exam Simulator

A comprehensive IELTS practice test system with automatic audio generation and intelligent grading.

## 🚀 Quick Start

### **One Command to Start Everything:**

```bash
npm start
```

That's it! The system will:
- ✅ Automatically detect if Coqui TTS is installed
- ✅ Start TTS server (if available) for high-quality voices
- ✅ Start the web server
- ✅ Fall back to browser voices if TTS is not available

Then open: **http://localhost:8111**

---

## 📋 Features

### Test Sections
- 🎧 **Listening** (40 questions) - Automated audio playback with natural voices
- 📖 **Reading** (30 questions) - Comprehensive reading passages
- ✏️ **Writing** (10 marks) - Word counting and automatic evaluation
- 📚 **Grammar** (20 questions) - Language use and grammar questions

### Audio System
- 🎤 **Dual TTS Support:**
  - **Coqui TTS** (optional) - Professional, high-quality neural voices
  - **Browser Voices** (built-in) - Always available fallback
- 🔄 **Automatic Detection** - Uses best available option
- 🌍 **Multiple Accents** - US, UK, Australian English (with Coqui TTS)

### Smart Features
- 📊 **Automatic Grading** - IELTS band score calculation
- 📄 **PDF Reports** - Detailed test results with highlighting
- 💾 **User History** - Save and review past tests
- 🌐 **Translation Support** - With penalty tracking
- ⏱️ **Progress Tracking** - Real-time test progress
- 📱 **Responsive Design** - Works on all devices

---

## 🔧 Installation

### 1. **Basic Installation (Required)**

```bash
# Clone the repository
git clone <your-repo-url>
cd ielts-practice-test

# Install Node.js dependencies
npm install

# Start the server
npm start
```

### 2. **Optional: Install High-Quality TTS (Recommended)**

For professional-quality voices, install Coqui TTS:

```bash
# Install Python from python.org (if not already installed)

# Install Coqui TTS
pip install TTS flask flask-cors

# Test installation
python test_tts.py

# Start server (same command!)
npm start
```

**That's it!** The next time you run `npm start`, it will automatically use the high-quality TTS voices.

---

## 📊 Audio Systems Comparison

| Feature | Coqui TTS | Browser Voices |
|---------|-----------|----------------|
| **Quality** | ⭐⭐⭐⭐⭐ Professional | ⭐⭐⭐ Basic |
| **Setup** | 15 min (optional) | None (built-in) |
| **Voices** | 4+ high-quality | 3-30 (varies) |
| **Accents** | US, UK, AU | System-dependent |
| **Cost** | 100% FREE | 100% FREE |
| **Command** | `npm start` | `npm start` |

**Both work with the same `npm start` command!**

---

## 💻 Available Commands

```bash
# Start everything (TTS + Web Server)
npm start

# Start only web server (no TTS)
npm run start:simple

# Development mode with auto-reload
npm run dev

# Run only TTS server
npm run tts
```

---

## 📁 Project Structure

```
ielts-practice-test/
│
├── server.js                    # Main Node.js server
├── start-with-tts.js           # Smart startup script
├── tts_server.py               # Coqui TTS server (optional)
├── package.json                # Node.js dependencies
├── requirements.txt            # Python dependencies
│
├── public/                     # Frontend files
│   ├── index.html             # Main HTML
│   ├── styles.css             # Styles
│   └── js/
│       └── modules/           # JavaScript modules
│           ├── core.js        # Core application logic
│           ├── listening.js   # Listening section with TTS
│           ├── reading.js     # Reading section
│           ├── grammar.js     # Grammar section
│           ├── writing.js     # Writing section
│           ├── grading.js     # Grading system
│           ├── pdf.js         # PDF generation
│           └── coqui-tts.js   # Coqui TTS client
│
├── questions/                  # Test data
│   └── 2025-10-18.json        # Current test
│
├── user-data/                  # User test results
│   └── [username]/
│       ├── answers/           # Saved answers (JSON)
│       └── pdfs/              # Generated PDFs
│
└── docs/                       # Documentation
    ├── README_TTS.md          # TTS system guide
    ├── SETUP_COQUI_TTS.md     # Detailed TTS setup
    └── ...
```

---

## 🎯 How It Works

### Automatic TTS Detection

```
npm start
    ↓
Check for Python & Coqui TTS
    ↓
    ├─→ TTS Found    → Start TTS Server (port 5050) + Web Server (port 8111)
    │                   → Use Professional Voices ⭐⭐⭐⭐⭐
    │
    └─→ TTS Not Found → Start Web Server only (port 8111)
                        → Use Browser Voices ⭐⭐⭐
```

**The system automatically uses the best available option!**

---

## 🔍 Testing the System

### 1. **Test Audio System**
```bash
npm start
# Open http://localhost:8111
# Go to Listening section
# Click "Play Part 1 Audio"
# Check browser console (F12) to see which TTS is being used
```

### 2. **Check TTS Installation**
```bash
python test_tts.py
```

### 3. **Check Available Voices**
- Open the test in your browser
- Press F12 to open console
- Look for "ALL AVAILABLE VOICES" section
- You'll see a list of all voices your browser/TTS has

---

## 💡 Tips for Best Experience

### **For Best Audio Quality:**
1. ✅ Install Coqui TTS (one-time, 15 minutes)
2. ✅ Use `npm start` - it handles everything automatically

### **For Quick Testing (No Setup):**
1. ✅ Just run `npm start`
2. ✅ Use **Google Chrome** browser (30+ built-in voices)
3. ✅ Accept basic voice quality

### **Voice Variety:**
- **With Coqui TTS:** 4+ professional voices (US, UK, AU accents)
- **Chrome Browser:** 30+ Google voices
- **Edge Browser:** 10-20 Microsoft voices
- **Firefox:** 3 system voices

---

## 🐛 Troubleshooting

### "Audio not playing"
1. Check browser console (F12) for errors
2. Try using Google Chrome
3. Make sure you clicked "Play Part X Audio" button

### "Only 3 voices available"
- **Solution 1:** Install Coqui TTS: `pip install TTS flask flask-cors`
- **Solution 2:** Use Google Chrome (has 30+ voices)
- **Solution 3:** Use Edge browser (has 10-20 voices)

### "Python not found"
- Install Python from https://python.org
- Make sure to check "Add Python to PATH"
- Restart terminal after installation

### "TTS module not found"
```bash
pip install TTS flask flask-cors
```

### "Port 8111 already in use"
```bash
# Windows
taskkill /F /IM node.exe

# Then restart
npm start
```

---

## 📚 Documentation

- **[README_TTS.md](README_TTS.md)** - Complete TTS system documentation
- **[SETUP_COQUI_TTS.md](SETUP_COQUI_TTS.md)** - Detailed TTS installation guide

---

## 🎉 Key Benefits

✅ **One Command Start** - `npm start` does everything  
✅ **Automatic Detection** - Uses best available TTS automatically  
✅ **No Breaking Changes** - Works with or without TTS installation  
✅ **100% Free** - All features, no trials, no limits  
✅ **Professional Quality** - With optional Coqui TTS  
✅ **Always Works** - Falls back to browser voices gracefully  
✅ **Easy Setup** - 3 commands for full installation  
✅ **Intelligent** - Detects what's installed and adapts  

---

## 🌟 System Highlights

### Smart Startup
- Automatically detects Python and TTS availability
- Starts TTS server only if installed
- Falls back gracefully to browser voices
- Shows clear status messages

### Flexible Audio
- Professional TTS when available
- Browser voices as reliable fallback
- No code changes needed
- Works on any system

### User-Friendly
- Single command to start everything
- Clear console messages
- Helpful setup hints
- Works immediately after clone

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Read `README_TTS.md` for audio system details
3. Read `SETUP_COQUI_TTS.md` for TTS setup help

---

## 📝 License

MIT License - Feel free to use and modify!

---

## 🎓 Summary

```bash
# That's all you need!
npm install
npm start

# Optional (for better voices):
pip install TTS flask flask-cors
npm start  # Same command!
```

**The system handles the rest automatically!** 🎉

Enjoy your IELTS practice! Good luck! 🍀

