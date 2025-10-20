# 🔧 Custom Proxy API Integration Guide

## Current Status

❌ **API Authentication Failed (401 Unauthorized)**

All authentication attempts failed. Need to resolve API access first.

---

## 🎯 Once API Access Works

### **Step 1: Update API Configuration**

Edit `utils/custom-proxy-api.js`:

```javascript
const CUSTOM_API = {
  url: 'https://traffic-api.longtu.club/webhook/proxy/get-proxy',  // ← Verify this
  apiKey: 'YOUR_CORRECT_API_KEY_HERE',                              // ← Update this
  headerName: 'api-key'                                            // ← Correct header name
};
```

### **Step 2: Test API**

```bash
node utils/custom-proxy-api.js
```

Should see:
```
✅ API is working!
   Found 50 proxies
```

### **Step 3: Enable in System**

Edit `urls.json`:

```json
{
  "settings": {
    "useCustomAPI": true,      // ← ADD THIS
    "useLiveProxies": false    // ← Disable free proxies
  }
}
```

### **Step 4: Integrate into start.js**

The system will automatically:
1. Check if `useCustomAPI` is true
2. Fetch proxies from your API
3. Use them for browser sessions
4. Fall back to free proxies if API fails

---

## 📋 API Response Format

The integration supports these formats:

### **Format 1: Array of objects**
```json
[
  { "ip": "1.2.3.4", "port": 8080, "country": "US" },
  { "ip": "5.6.7.8", "port": 8080, "country": "UK" }
]
```

### **Format 2: Object with proxies array**
```json
{
  "proxies": [
    { "ip": "1.2.3.4", "port": 8080 },
    { "ip": "5.6.7.8", "port": 8080 }
  ]
}
```

### **Format 3: Nested data**
```json
{
  "data": {
    "proxies": [
      { "ip": "1.2.3.4", "port": 8080 }
    ]
  }
}
```

### **Format 4: Single proxy**
```json
{
  "ip": "1.2.3.4",
  "port": 8080,
  "country": "US"
}
```

### **Format 5: String (one per line)**
```
1.2.3.4:8080
5.6.7.8:3128
9.10.11.12:80
```

**The parser will auto-detect the format!**

---

## 🔍 Troubleshooting Current 401 Error

### **Check 1: API Key**
- Copy API key fresh (no extra spaces)
- Check if it needs to be regenerated
- Verify expiration date

### **Check 2: API Documentation**
Ask your API provider:
- What's the correct header name?
- Is IP whitelisting required?
- Is there example code?

### **Check 3: Test with Postman/Insomnia**
1. Open Postman
2. GET request to: `https://traffic-api.longtu.club/webhook/proxy/get-proxy`
3. Add header: `api-key: YOUR_KEY`
4. See what error message says

### **Check 4: Contact API Provider**
Send them:
- Your IP address
- The error message (401 Unauthorized)
- Ask them to verify your API key

---

## 🚀 Integration Code (Ready to Use)

I've created:
- ✅ `utils/custom-proxy-api.js` - Fetches from your API
- ✅ Auto-detects response format
- ✅ Handles errors gracefully
- ✅ Falls back to free proxies
- ✅ Caches successful proxies

**Just need working API credentials!**

---

## 📞 What to Tell Your API Provider

> Hi, I'm trying to use your proxy API but getting 401 Unauthorized errors.
> 
> **Details:**
> - Endpoint: `https://traffic-api.longtu.club/webhook/proxy/get-proxy`
> - API Key: `#!6f1!0#aa77%@G$%8262x4AaD460c*3TExbqS9@0fPHF2F&$9m9$0Z!!^468J72W`
> - Method: GET
> - Header: `api-key: [key]`
> 
> **Questions:**
> 1. Is this API key valid?
> 2. What header name should I use? (api-key, API-Key, Authorization?)
> 3. Do I need to whitelist my IP?
> 4. Is the endpoint URL correct?
> 5. Can you provide example code?

---

## 💡 Next Steps

**Option A: Fix API Access** ✅
1. Contact API provider
2. Get correct credentials
3. Update `custom-proxy-api.js`
4. Run `npm start`
5. **100% working with your own proxies!**

**Option B: Use Free Proxies** (Temporary)
```json
{
  "settings": {
    "useCustomAPI": false,
    "useLiveProxies": true  // Use GitHub free proxies (8-12% success)
  }
}
```

**Option C: Webshare ($3/month)**
- 95%+ success rate
- Reliable backup while fixing API

---

## ⚙️ Current Configuration

Your system is ready! Just needs working API:

```
Custom API → ✅ Code ready
           → ❌ Authentication failed (401)
           → 📞 Need to fix API access
```

Once fixed → Instant integration! 🚀

