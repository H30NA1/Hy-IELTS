#!/usr/bin/env python3
"""
Coqui TTS Server for IELTS Practice Test
Provides high-quality, FREE, local text-to-speech with multiple English voices
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from TTS.api import TTS
import os
import hashlib
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
TTS_CACHE_DIR = Path("tts_cache")
TTS_CACHE_DIR.mkdir(exist_ok=True)

# Available English models with different accents
ENGLISH_MODELS = {
    'en-us': 'tts_models/en/ljspeech/tacotron2-DDC',           # US Female
    'en-us-male': 'tts_models/en/ljspeech/glow-tts',           # US Male
    'en-uk': 'tts_models/en/jenny/jenny',                      # UK Female
    'en-multi': 'tts_models/multilingual/multi-dataset/your_tts'  # Multi-accent (US, UK, AU)
}

# Initialize TTS models (lazy loading)
tts_models = {}

def get_tts_model(model_key='en-us'):
    """Get or initialize a TTS model"""
    if model_key not in tts_models:
        try:
            model_name = ENGLISH_MODELS.get(model_key, ENGLISH_MODELS['en-us'])
            logger.info(f"Loading TTS model: {model_name}")
            tts_models[model_key] = TTS(model_name)
            logger.info(f"✅ Model loaded: {model_key}")
        except Exception as e:
            logger.error(f"❌ Failed to load model {model_key}: {e}")
            # Fallback to default
            if model_key != 'en-us':
                return get_tts_model('en-us')
            raise
    return tts_models[model_key]

def get_cache_path(text, model_key):
    """Generate cache file path based on text and model"""
    text_hash = hashlib.md5(f"{text}_{model_key}".encode()).hexdigest()
    return TTS_CACHE_DIR / f"{text_hash}.wav"

@app.route('/api/tts/voices', methods=['GET'])
def list_voices():
    """List available English voice models"""
    return jsonify({
        'success': True,
        'voices': [
            {'id': 'en-us',      'name': 'US English Female',     'accent': 'US',  'gender': 'female'},
            {'id': 'en-us-male', 'name': 'US English Male',       'accent': 'US',  'gender': 'male'},
            {'id': 'en-uk',      'name': 'UK English Female',     'accent': 'UK',  'gender': 'female'},
            {'id': 'en-multi',   'name': 'Multi-Accent English',  'accent': 'Various', 'gender': 'various'}
        ]
    })

@app.route('/api/tts/synthesize', methods=['POST'])
def synthesize():
    """
    Synthesize speech from text
    
    Request body:
    {
        "text": "Text to synthesize",
        "voice": "en-us" (optional, default: en-us),
        "speed": 1.0 (optional, default: 1.0)
    }
    """
    try:
        data = request.json
        text = data.get('text', '').strip()
        voice = data.get('voice', 'en-us')
        speed = data.get('speed', 1.0)
        
        if not text:
            return jsonify({'success': False, 'error': 'No text provided'}), 400
        
        # Check cache first
        cache_path = get_cache_path(text, voice)
        
        if not cache_path.exists():
            logger.info(f"🎤 Synthesizing: {text[:50]}... (voice: {voice})")
            
            # Get TTS model
            tts = get_tts_model(voice)
            
            # Generate speech
            tts.tts_to_file(
                text=text,
                file_path=str(cache_path)
            )
            
            logger.info(f"✅ Generated and cached: {cache_path.name}")
        else:
            logger.info(f"📦 Using cached audio: {cache_path.name}")
        
        # Return audio file
        return send_file(
            str(cache_path),
            mimetype='audio/wav',
            as_attachment=False
        )
        
    except Exception as e:
        logger.error(f"❌ TTS Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tts/clear-cache', methods=['POST'])
def clear_cache():
    """Clear TTS cache"""
    try:
        count = 0
        for file in TTS_CACHE_DIR.glob('*.wav'):
            file.unlink()
            count += 1
        logger.info(f"🗑️ Cleared {count} cached files")
        return jsonify({'success': True, 'cleared': count})
    except Exception as e:
        logger.error(f"❌ Cache clear error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'running',
        'models_loaded': list(tts_models.keys()),
        'available_voices': len(ENGLISH_MODELS)
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Coqui TTS Server...")
    logger.info(f"📂 Cache directory: {TTS_CACHE_DIR.absolute()}")
    logger.info(f"🎭 Available voices: {len(ENGLISH_MODELS)}")
    
    # Pre-load default model
    try:
        get_tts_model('en-us')
        logger.info("✅ Default model pre-loaded")
    except Exception as e:
        logger.error(f"⚠️ Could not pre-load default model: {e}")
    
    # Run server
    app.run(host='0.0.0.0', port=5050, debug=False)

