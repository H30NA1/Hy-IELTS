# 🎤 IELTS Practice Test - TTS Voice System

## Overview

This IELTS practice test now supports **TWO audio systems**:

1. **Coqui TTS** (Recommended) - Professional, high-quality, 100% FREE local TTS
2. **Browser Voices** (Fallback) - Built-in browser speech synthesis

The system **automatically detects** which one is available and uses the best option!

---

## 🎯 Quick Start

### Option 1: Use Browser Voices (No Setup)

Just start the server and use your browser's built-in voices:

```powershell
node server.js
```

Then open http://localhost:8111

**Voice Quality:** Basic (depends on your browser)
**Setup Time:** 0 minutes
**Voices Available:** 3-30 (depends on browser/system)

### Option 2: Use Coqui TTS (Recommended - Better Quality)

1. **Install Python** (if not installed):
   - Download from https://www.python.org/downloads/
   - Check "Add Python to PATH"

2. **Install Coqui TTS:**
   ```powershell
   pip install TTS flask flask-cors
   ```

3. **Test installation:**
   ```powershell
   python test_tts.py
   ```

4. **Start both servers:**
   ```powershell
   .\start_all.ps1
   ```

**Voice Quality:** Professional, very natural
**Setup Time:** ~15 minutes (first time only)
**Voices Available:** 4+ high-quality English voices

---

## 📊 Comparison

| Feature | Coqui TTS | Browser Voices |
|---------|-----------|----------------|
| **Voice Quality** | ⭐⭐⭐⭐⭐ Professional | ⭐⭐⭐ Basic |
| **Naturalness** | Very natural, neural TTS | Robotic |
| **Accents** | US, UK, Australian | System-dependent |
| **Setup** | 15 min (one-time) | No setup |
| **Cost** | 100% FREE | 100% FREE |
| **Internet Required** | No (after setup) | No |
| **Voices Available** | 4+ (expandable) | 3-30 (varies) |
| **Consistency** | Same on all computers | Varies by system |

---

## 🔧 Installation Options

### Windows (PowerShell)

#### Browser Voices Only:
```powershell
# Just start the server
node server.js
```

#### With Coqui TTS (Better Quality):
```powershell
# 1. Install Python dependencies
pip install TTS flask flask-cors

# 2. Test installation
python test_tts.py

# 3. Start all servers
.\start_all.ps1
```

---

## 🎭 Available Voices

### Coqui TTS (when installed):
- **US English Female** - Natural, professional
- **US English Male** - Clear, articulate
- **UK English Female** - British accent, refined
- **Multi-Accent** - Various English accents

### Browser Voices (fallback):
Depends on your system:
- **Windows:** Usually 3 voices (Microsoft Zira, David, Mark)
- **Chrome:** 30+ Google voices (if using Chrome browser)
- **Edge:** 10-20 Microsoft voices
- **Firefox:** System voices only

**💡 TIP:** For best browser voices, use **Google Chrome** - it has 30+ built-in voices!

---

## 🚀 How It Works

```
┌─────────────────────────────────────────┐
│  IELTS Test Frontend (Browser)         │
│  • Plays audio for listening section    │
│  • Detects available TTS systems        │
└──────────────┬──────────────────────────┘
               │
               ├───────────────┬───────────────┐
               │               │               │
       Try Coqui TTS    If available   If not available
               │               │               │
               ▼               ▼               ▼
   ┌──────────────────┐   ┌─────────────────────────┐
   │  TTS Server      │   │  Browser Speech         │
   │  (Port 5050)     │   │  Synthesis (Built-in)   │
   │  • High quality  │   │  • Basic quality        │
   │  • Professional  │   │  • Always available     │
   │  • Local         │   │  • No setup needed      │
   └──────────────────┘   └─────────────────────────┘
```

---

## 📝 File Structure

```
project/
│
├── tts_server.py           # Coqui TTS server (Python)
├── test_tts.py             # Test script for TTS installation
├── start_all.ps1           # Start all servers (PowerShell)
│
├── public/
│   └── js/
│       └── modules/
│           ├── coqui-tts.js    # Coqui TTS client
│           └── listening.js    # Listening module with TTS support
│
├── SETUP_COQUI_TTS.md      # Detailed setup guide
├── README_TTS.md           # This file
└── requirements.txt        # Python dependencies
```

---

## 🐛 Troubleshooting

### "Python not found"
- Install Python 3.9+ from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

### "TTS module not found"
```powershell
pip install TTS
```

### "Audio not playing"
1. Check browser console for errors (F12)
2. If using Coqui TTS, check if server is running:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:5050/health"
   ```
3. The system will automatically fall back to browser voices if TTS server is unavailable

### "Only seeing 3 voices"
- You're using Windows default voices
- **Solution 1:** Install Coqui TTS (see above)
- **Solution 2:** Use Google Chrome browser (has 30+ built-in voices)
- **Solution 3:** Install more Windows language packs:
  1. Settings → Time & Language → Language
  2. Add English (UK), English (India), etc.

### "TTS Server not starting"
```powershell
# Check Python and TTS installation
python test_tts.py

# Check if port 5050 is in use
netstat -ano | findstr :5050

# Kill existing Python processes
taskkill /F /IM python.exe
```

---

## 🔄 Switching Between Systems

The system automatically chooses the best available TTS:

1. **First Try:** Coqui TTS Server (if running)
2. **Fallback:** Browser Speech Synthesis

You can force browser voices by simply not starting the TTS server:

```powershell
# Use browser voices only
node server.js

# Use Coqui TTS (if installed)
.\start_all.ps1
```

---

## 💾 Disk Space & Performance

### Coqui TTS:
- **Initial Download:** ~500MB per model
- **Cache:** ~1MB per minute of speech
- **Models stored:** `C:\Users\[You]\.local\share\tts\`
- **Audio cache:** `./tts_cache/` (in project folder)

### Browser Voices:
- **Disk Space:** 0 bytes (built into browser)
- **No cache needed**

To clear Coqui TTS cache:
```powershell
Remove-Item tts_cache\*.wav
```

---

## 🌟 Recommended Setup

For the **best experience**:

1. ✅ Install **Coqui TTS** (15 min setup, amazing quality)
2. ✅ Use **Google Chrome** browser (30+ voices as fallback)
3. ✅ Use `.\start_all.ps1` to start everything

For **quick testing** (no setup):

1. ✅ Just run `node server.js`
2. ✅ Use Google Chrome browser
3. ✅ Accept basic voice quality

---

## 📚 More Information

- **Coqui TTS Setup Guide:** See `SETUP_COQUI_TTS.md`
- **Coqui TTS GitHub:** https://github.com/coqui-ai/TTS
- **Browser Speech API:** https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

---

## ❓ FAQ

**Q: Do I need to install Coqui TTS?**
A: No, it's optional. Browser voices work fine without it.

**Q: Is Coqui TTS really free?**
A: Yes! 100% free and open source. No trials, no limits.

**Q: Does it work offline?**
A: Yes! Both systems work completely offline (after initial model download for Coqui).

**Q: Which browser is best?**
A: Google Chrome has the most built-in voices (30+).

**Q: Can I use both systems?**
A: Yes! The app automatically uses Coqui TTS if available, otherwise browser voices.

**Q: How much better is Coqui TTS?**
A: Significantly! It sounds much more natural and professional.

---

## 🎉 Summary

You now have a **flexible TTS system** that:
- ✅ Works immediately with browser voices (no setup)
- ✅ Supports professional Coqui TTS (optional, 15 min setup)
- ✅ Automatically chooses the best available option
- ✅ 100% FREE - no trials, no subscriptions
- ✅ Works completely offline

**Just want to test quickly?** → `node server.js`  
**Want professional quality?** → Follow SETUP_COQUI_TTS.md

Enjoy your IELTS practice! 🎓

