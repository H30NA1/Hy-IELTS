#!/usr/bin/env python3
"""
Quick test script to verify Coqui TTS installation
"""

import sys

def test_imports():
    """Test if required packages are installed"""
    print("🧪 Testing Coqui TTS Installation...\n")
    
    # Test Python version
    print(f"✅ Python version: {sys.version.split()[0]}")
    
    # Test TTS import
    try:
        import TTS
        print("✅ TTS package installed")
        print(f"   Version: {TTS.__version__}")
    except ImportError:
        print("❌ TTS package NOT installed")
        print("   Install with: pip install TTS")
        return False
    
    # Test Flask import
    try:
        import flask
        print("✅ Flask installed")
    except ImportError:
        print("❌ Flask NOT installed")
        print("   Install with: pip install flask flask-cors")
        return False
    
    # Test Flask-CORS import
    try:
        import flask_cors
        print("✅ Flask-CORS installed")
    except ImportError:
        print("❌ Flask-CORS NOT installed")
        print("   Install with: pip install flask-cors")
        return False
    
    # Test TTS API
    try:
        from TTS.api import TTS as TTSApi
        print("✅ TTS API accessible")
        
        # Try to list models
        print("\n📋 Listing available English models...")
        tts_test = TTSApi()
        models = tts_test.list_models()
        
        english_models = [m for m in models if m.startswith('tts_models/en/')]
        print(f"   Found {len(english_models)} English TTS models")
        
        if english_models:
            print("\n   Sample models:")
            for model in english_models[:5]:
                print(f"   • {model}")
        
    except Exception as e:
        print(f"⚠️  Warning: Could not test TTS API: {e}")
    
    print("\n" + "="*50)
    print("✅ All required packages are installed!")
    print("   You can now run: python tts_server.py")
    print("="*50)
    
    return True

if __name__ == '__main__':
    try:
        success = test_imports()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

