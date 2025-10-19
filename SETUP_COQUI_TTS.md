# 🎤 Coqui TTS Setup Guide

## What is Coqui TTS?

**Coqui TTS** is a FREE, OPEN-SOURCE, professional-grade text-to-speech library that runs **100% locally** on your computer. No trials, no internet required (after setup), no limitations!

Based on: https://github.com/coqui-ai/TTS

## Features

- ✅ **100% FREE & Open Source**
- ✅ **High-Quality Neural Voices** (much better than Windows voices)
- ✅ **Multiple English Accents** (US, UK, Australian)
- ✅ **Runs Locally** (no internet required after installation)
- ✅ **No Limitations** (unlimited usage)
- ✅ **Professional Quality** (used in research and production)

---

## Installation Steps

### 1. Install Python (if not already installed)

**Download Python 3.9 or higher:**
- Go to https://www.python.org/downloads/
- Download Python 3.9+ for Windows
- **IMPORTANT:** Check "Add Python to PATH" during installation

Verify installation:
```powershell
python --version
```

### 2. Install Coqui TTS

Open PowerShell and run:

```powershell
# Install Coqui TTS
pip install TTS

# Install Flask (for the TTS server)
pip install flask flask-cors

# Verify installation
tts --list_models
```

This will download Coqui TTS and its dependencies.

### 3. Download Voice Models (One-time, ~500MB each)

The first time you use a voice, it will be downloaded automatically. To pre-download:

```powershell
# Download US English Female (default)
tts --text "Test" --model_name "tts_models/en/ljspeech/tacotron2-DDC" --out_path test.wav

# Download UK English Female
tts --text "Test" --model_name "tts_models/en/jenny/jenny" --out_path test.wav

# Download Multi-accent model (US, UK, AU)
tts --text "Test" --model_name "tts_models/multilingual/multi-dataset/your_tts" --out_path test.wav
```

**Note:** Models are downloaded to `C:\Users\[YourName]\.local\share\tts\` and only need to be downloaded once.

---

## Running the TTS Server

### Option 1: Manual Start

1. Open PowerShell in the project directory
2. Run:
```powershell
python tts_server.py
```

3. You should see:
```
🚀 Starting Coqui TTS Server...
✅ Default model pre-loaded
 * Running on http://0.0.0.0:5050
```

4. Keep this window open while using the IELTS test

### Option 2: Automatic Start (Recommended)

Create `start_all.ps1`:

```powershell
# Start TTS Server in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python tts_server.py"

# Wait 5 seconds for TTS server to start
Start-Sleep -Seconds 5

# Start Node server
node server.js
```

Then just run:
```powershell
.\start_all.ps1
```

---

## Testing the Installation

1. Start the TTS server: `python tts_server.py`
2. In another PowerShell window, test the API:
```powershell
Invoke-WebRequest -Uri "http://localhost:5050/health" -Method GET
```

You should see:
```json
{
  "success": true,
  "status": "running",
  "models_loaded": ["en-us"],
  "available_voices": 4
}
```

---

## How It Works

1. **TTS Server (`tts_server.py`)** runs on port 5050
   - Provides REST API for text-to-speech
   - Manages voice models
   - Caches generated audio for faster playback

2. **Frontend (`coqui-tts.js`)** connects to the TTS server
   - Sends text to be synthesized
   - Receives high-quality audio
   - Falls back to browser voices if server is unavailable

3. **Listening Module (`listening.js`)** uses Coqui TTS automatically
   - Detects if TTS server is available
   - Uses Coqui TTS for high-quality voices
   - Falls back to browser voices if server is offline

---

## Troubleshooting

### "Module not found: TTS"
```powershell
pip install TTS
```

### "Python not found"
- Reinstall Python with "Add to PATH" checked
- Or manually add Python to PATH

### "Port 5050 already in use"
- Another TTS server instance is running
- Kill it: `taskkill /F /IM python.exe`

### "Model download failed"
- Check internet connection
- Try downloading a different model
- Models download automatically on first use

### Audio not working in IELTS test
1. Check TTS server is running: `http://localhost:5050/health`
2. Check browser console for errors
3. If Coqui TTS fails, it will automatically fall back to browser voices

---

## Cache Management

Generated audio is cached in `tts_cache/` directory.

To clear cache:
```powershell
# Via API
Invoke-WebRequest -Uri "http://localhost:5050/api/tts/clear-cache" -Method POST

# Or manually
Remove-Item tts_cache\*.wav
```

---

## Comparison: Coqui TTS vs Browser Voices

| Feature | Coqui TTS | Browser Voices |
|---------|-----------|----------------|
| **Quality** | ⭐⭐⭐⭐⭐ Professional | ⭐⭐⭐ Basic |
| **Voices** | 4+ English (expandable) | 3 (Windows default) |
| **Accents** | US, UK, AU | US only (usually) |
| **Naturalness** | Very natural | Robotic |
| **Cost** | FREE | FREE |
| **Setup** | Requires Python | Built-in |
| **Internet** | No (after setup) | No |
| **Variety** | High | Low (system-dependent) |

---

## Advanced: Adding More Voices

Coqui TTS supports **1100+ languages** and many models. To add more English voices:

1. List all available models:
```powershell
tts --list_models | findstr "en/"
```

2. Add to `tts_server.py` `ENGLISH_MODELS` dictionary:
```python
ENGLISH_MODELS = {
    'en-us': 'tts_models/en/ljspeech/tacotron2-DDC',
    'en-your-new-model': 'tts_models/en/.../model-name',  # Add here
}
```

3. Update `api/tts/voices` endpoint to include the new voice

---

## Support

- **Coqui TTS Docs:** https://tts.readthedocs.io/
- **GitHub:** https://github.com/coqui-ai/TTS
- **Issues:** Check console logs and TTS server output

---

## Summary

✅ **100% FREE** - No trials, no subscriptions
✅ **High Quality** - Professional neural voices
✅ **Local** - No internet needed after setup
✅ **Multiple Accents** - US, UK, Australian English
✅ **Easy Fallback** - Auto-switches to browser voices if server is down

**Total Setup Time:** ~10-15 minutes (mostly downloading models)
**Disk Space:** ~1-2GB for all English models
**Once installed:** Works forever, completely offline! 🎉

