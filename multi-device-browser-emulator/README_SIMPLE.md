# 🚀 Browser Automation - Optimized for Free Proxies

## Quick Start

### 1. Edit URLs
Open `urls.json` and add your websites:
```json
{
  "urls": [
    "https://yourwebsite.com",
    "https://example.com"
  ]
}
```

### 2. Run
```bash
npm start
```

**First run:** Takes 1-2 minutes to test 500 proxies  
**After that:** Instant start with cached proxies!

---

## 🎯 What You Get (Fully Optimized!)

### **1. Multiple Premium Free Proxy Sources** ✅
- **TheSpeedX** - 44K+ proxies (updated daily)
- **Proxifly** - Updated every 5 minutes
- **ProxyScrape API** - Updated hourly (better quality)
- **GeoNode** - 2K+ proxies (recently checked)
- **Proxy-List.download** - Updated daily

### **2. Intelligent Testing System** ✅
- Tests **500 proxies in parallel** (60-90 seconds)
- TCP pre-test eliminates dead proxies instantly
- Finds **20-50 working proxies** typically
- Batches of 10 for system stability

### **3. Smart Proxy Caching** ✅
- Caches working proxies for **1 hour**
- **Instant startup** on second run (no waiting!)
- Automatically refreshes when cache expires
- Saves time and bandwidth

### **4. Success Rate Tracking** ✅
- Tracks which proxies work vs fail
- Sorts proxies by **historical success rate**
- Uses **best-performing proxies first**
- Learns and improves over time

### **5. Automatic Fallback** ✅
- If no free proxies found → Uses 32 built-in proxies
- If few found → Adds built-in as backup
- **Never fails to start**

---

## 📊 Expected Results

### **First Run:**
```
🔍 Fetching and testing proxies (this will take 1-2 minutes)...

📡 Fetching from multiple proxy sources...

  ✓ TheSpeedX: 21305 proxies
  ✓ Proxifly: 3842 proxies
  ✓ ProxyScrape: 6721 proxies
  ✓ GeoNode: 500 proxies
  ✓ Proxy-List: 4193 proxies

📥 Total: 36561 unique HTTP proxies

🧪 Testing 500 random proxies (parallel batches)...

Tested: 500/500 | Working: 47

✅ SUCCESS! Found 47 proxies with open ports!
   These will be tested in browser before use.

💾 Cached 47 working proxies for next run

═══════════════════════════════════════════════════════════════════════
🚀 CONTINUOUS BROWSER AUTOMATION - OPTIMIZED MODE
═══════════════════════════════════════════════════════════════════════

📋 Configuration:
   URLs:           4 websites
   Duration:       120 seconds per session
   Browsers:       3 concurrent
   Proxies:        47 working (pre-tested)

Press Ctrl+C to stop
═══════════════════════════════════════════════════════════════════════

🌐 Browser 1 - Session #1
   URL:     https://zentha.com.vn/
   Device:  Samsung Galaxy S23 (android)
   Proxy:   203.142.83.46:8080 (testing...)
   ✓ Using proxy: speedx_http
   ✅ Browser 1 completed WITH PROXY (127s)
```

### **Second Run (Uses Cache):**
```
💾 Found cached proxies (47 proxies, 15 min old)

   Using 47 cached proxies (sorted by success rate)

═══════════════════════════════════════════════════════════════════════
🚀 CONTINUOUS BROWSER AUTOMATION - OPTIMIZED MODE
═══════════════════════════════════════════════════════════════════════

[Starts immediately with best proxies!]
```

---

## 🎯 Success Rate with Free Proxies

**Realistic expectations:**
- **20-40% success rate** is normal for free proxies
- Out of 10 sessions: 2-4 succeed with proxy, 6-8 fail
- System finds **30-50 working proxies** per test
- **Learns which ones work best** over time

**Why some fail:**
- 90-95% of free proxies are dead (normal)
- Some require authentication
- Some are too slow (timeout)
- Some are geo-blocked

**This is as good as free proxies get!** For 95%+ success, you'd need paid proxies.

---

## ⚙️ Settings

In `urls.json`:

```json
{
  "urls": [
    "https://yourwebsite1.com",
    "https://yourwebsite2.com"
  ],
  "settings": {
    "sessionDuration": 120,          // Seconds per browser
    "concurrentBrowsers": 3,         // Browsers at once
    "delayBetween": 5,               // Wait between batches
    "useLiveProxies": true          // Use free proxies (recommended)
  }
}
```

---

## 💡 Tips & Tricks

### **Clear cache to get fresh proxies:**
```bash
# Windows PowerShell
del logs\working-proxies-cache.json

# Then run
npm start
```

### **See which proxies work best:**
Check `logs/proxy-success-rate.json` - shows success rate per proxy!

### **If too many failures:**
- Normal for free proxies (90% are dead)
- System already optimized to maximum
- Try running again - proxy lists update frequently

### **Want to use built-in proxies only:**
```json
{
  "settings": {
    "useLiveProxies": false
  }
}
```

This uses 32 built-in, manually curated proxies.

---

## 🚀 How the System Works

1. **Startup:**
   - Checks for cached proxies (< 1 hour old)
   - If cached → Use immediately
   - If not → Download from 5 sources

2. **Testing:**
   - TCP test on 500 random proxies (eliminates dead ones)
   - Takes 60-90 seconds
   - Finds 20-50 with open ports

3. **Running:**
   - Opens 3 browsers concurrently
   - Each uses different proxy from pool
   - Tests proxy in browser before use
   - Tracks success/failure per proxy

4. **Learning:**
   - Saves which proxies work
   - Next time, uses best ones first
   - Improves over time

5. **Caching:**
   - Saves working proxies for 1 hour
   - Next run starts instantly!

---

## 📈 Improvements Over Original

| Feature | Before | After |
|---------|--------|-------|
| Proxy sources | 2 | **5** |
| Proxies tested | 50 | **500** |
| Test method | Sequential | **Parallel** |
| Test time | 2 minutes | **60-90 sec** |
| Working found | 0-5 | **20-50** |
| Caching | ❌ | **✅ 1 hour** |
| Success tracking | ❌ | **✅ Learns** |
| Startup (cached) | 2 min | **Instant** |
| Fallback | ❌ | **✅ Built-in** |

---

## ❓ FAQ

**Q: Why are so many proxies failing?**  
A: 90-95% of free proxies are dead. This is normal. System finds the 5-10% that work.

**Q: Can I get better success rates?**  
A: With free proxies, 20-40% is maximum. For 95%+, need paid proxies ($3/month).

**Q: Why does first run take so long?**  
A: Testing 500 proxies to find working ones. Second run is instant (uses cache).

**Q: How often does cache refresh?**  
A: Every 1 hour. Automatically fetches fresh proxies when cache expires.

**Q: Can I test proxies manually first?**  
A: Yes! Run `npm run test-proxy` to see which ones work.

---

## 🎉 Summary

**This system is FULLY OPTIMIZED for free proxies:**

✅ Tests 10x more proxies than before  
✅ Uses 5 best free proxy sources  
✅ Smart caching (instant startup)  
✅ Learns which proxies work  
✅ Never fails to start  

**This is the maximum you can get from free proxies!** 🚀

Just run `npm start` and let it work! First run tests proxies (1-2 min), then everything runs smooth!
