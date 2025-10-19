# 🔄 Non-Stop Continuous Running Guide

## 🎯 What This Does

The continuous runner makes browsers run **non-stop**, with each session lasting **more than 1 minute** (up to 3 minutes). It will keep running indefinitely until you stop it with `Ctrl+C`.

---

## 🚀 Quick Start

### Run Non-Stop (Default Settings)
```bash
npm run continuous
```

**What happens:**
- Each session lasts **1.5 - 3 minutes**
- Visits **5 pages** per session
- **5 second delay** between sessions
- Runs **forever** until you press Ctrl+C

---

## ⚙️ Custom Options

### Set Session Duration
```bash
# Each session lasts 2 minutes minimum
node continuous-runner.js --duration 2

# Each session lasts 3 minutes minimum
node continuous-runner.js --duration 3
```

### Visit More Pages
```bash
# Visit 10 pages per session (takes longer)
node continuous-runner.js --pages 10
```

### Change Delay Between Sessions
```bash
# 10 second delay between sessions
node continuous-runner.js --delay 10

# 30 second delay between sessions
node continuous-runner.js --delay 30
```

### Stop After X Sessions
```bash
# Run 20 sessions then stop
node continuous-runner.js --max-sessions 20

# Run 50 sessions then stop
node continuous-runner.js --max-sessions 50
```

### Combine Options
```bash
# 3 minute sessions, 10 pages, 15 second delay
node continuous-runner.js --duration 3 --pages 10 --delay 15

# 2 minute sessions, stop after 100 sessions
node continuous-runner.js -d 2 -m 100
```

---

## 📊 What You'll See

```
═══════════════════════════════════════════════════════════════════════════════
🔄 CONTINUOUS RUNNER - NON-STOP MODE
═══════════════════════════════════════════════════════════════════════════════

Configuration:
  Min Session Duration:  90s
  Max Session Duration:  180s
  Pages Per Session:     5
  Delay Between:         5s
  Run Indefinitely:      YES
  Max Sessions:          ∞

═══════════════════════════════════════════════════════════════════════════════

⚠️  Press Ctrl+C to stop at any time

═══════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
🚀 SESSION #1 - 10:30:45 AM
────────────────────────────────────────────────────────────────────────────────
📱 Device:  iPhone 15 Pro Max (iOS)
🌐 Proxy:   45.76.96.192:8080 (USA, New York)
────────────────────────────────────────────────────────────────────────────────

  → Behavior: Deep Explorer (Extended)

✅ Session #1 completed successfully (127.3s)

────────────────────────────────────────────────────────────────────────────────
📊 STATISTICS
────────────────────────────────────────────────────────────────────────────────
  Total Sessions:   1
  ✅ Successful:     1
  ❌ Failed:         0
  📈 Success Rate:   100.0%
  ⏱️  Uptime:         127s
────────────────────────────────────────────────────────────────────────────────

⏳ Waiting 5s before next session...
```

---

## 🎭 Extended Behaviors

Each session uses one of 5 **extended behaviors** that take 1.5-3 minutes:

1. **Deep Explorer**
   - Slow, thorough scrolling
   - Hovers over images
   - Multiple section visits
   - Time: 2-3 minutes

2. **Careful Shopper**
   - Checks prices multiple times
   - Reads product details
   - Looks for shipping info
   - Time: 2-3 minutes

3. **Research Mode**
   - Methodical reading
   - Long pauses at each section
   - Checks headings and links
   - Time: 2-3 minutes

4. **Detailed Comparer**
   - Compares multiple aspects
   - Checks tables and features
   - Reads specifications
   - Time: 2-3 minutes

5. **Engaged Browser**
   - High interaction
   - Clicks and expands sections
   - Progressive scrolling
   - Time: 1.5-2 minutes

---

## 🛑 How to Stop

Press **Ctrl+C** at any time.

You'll see:
```
═══════════════════════════════════════════════════════════════════════════════
🛑 STOPPING CONTINUOUS RUNNER
═══════════════════════════════════════════════════════════════════════════════

📊 STATISTICS
────────────────────────────────────────────────────────────────────────────────
  Total Sessions:   15
  ✅ Successful:     14
  ❌ Failed:         1
  📈 Success Rate:   93.3%
  ⏱️  Uptime:         2145s
────────────────────────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════════════════════
👋 Continuous runner stopped. Goodbye!
═══════════════════════════════════════════════════════════════════════════════
```

---

## 📋 Quick Command Reference

| Command | Description |
|---------|-------------|
| `npm run continuous` | Run non-stop (default: 1.5min sessions) |
| `npm run nonstop` | Same as continuous |
| `node continuous-runner.js -d 2` | 2 minute sessions |
| `node continuous-runner.js -p 10` | Visit 10 pages per session |
| `node continuous-runner.js --delay 15` | 15 second delay between |
| `node continuous-runner.js -m 50` | Stop after 50 sessions |
| `node continuous-runner.js --help` | Show all options |

---

## 💡 Tips

### For Longer Sessions
```bash
# 3 minute minimum per session, visit 10 pages
node continuous-runner.js --duration 3 --pages 10
```

### For Maximum Activity
```bash
# Visit many pages with minimal delay
node continuous-runner.js --pages 15 --delay 2
```

### For Testing
```bash
# Run just 5 sessions to test
node continuous-runner.js --max-sessions 5
```

### For Long-Term Running
```bash
# Let it run overnight
node continuous-runner.js --duration 2 --pages 8 --delay 10
```

---

## 📂 Output Files

All sessions are logged and captured:

**Logs:** `./logs/continuous_*.json`
- Full action history
- Behavior patterns applied
- Errors and warnings
- Session duration

**Screenshots:** `./screenshots/continuous_*.png`
- Search results
- Each page visited
- Visual proof of activity

---

## ⚠️ Important Notes

1. **Monitor System Resources**
   - Each session uses ~200-300MB RAM
   - Chrome process stays open during session
   - Closes between sessions

2. **Disk Space**
   - Screenshots accumulate (~200KB each)
   - Logs accumulate (~20KB per session)
   - Clean up periodically

3. **Network Usage**
   - Continuous running uses bandwidth
   - Each session visits 5-15 pages
   - Consider your connection

4. **Ethical Use**
   - Only use on authorized sites
   - Respect rate limits
   - Follow terms of service

---

## 🔧 Troubleshooting

### Sessions Too Short?
```bash
# Increase duration and pages
node continuous-runner.js --duration 3 --pages 10
```

### Too Fast Between Sessions?
```bash
# Increase delay
node continuous-runner.js --delay 30
```

### Want to See Browser Window?
Edit `browser-session.js` line 34:
```javascript
headless: false  // Change from true to false
```

### Memory Issues?
```bash
# Reduce concurrent activity, increase delays
node continuous-runner.js --delay 30 --pages 5
```

---

## 🎯 Example Usage Scenarios

### Light Continuous Testing
```bash
# 1.5 minute sessions, moderate delay
npm run continuous
```

### Heavy Traffic Simulation
```bash
# 3 minute sessions, many pages
node continuous-runner.js -d 3 -p 12 --delay 5
```

### Overnight Running
```bash
# Balanced settings for long term
node continuous-runner.js -d 2 -p 7 --delay 15
```

### Quick Burst Test
```bash
# Run 10 sessions then stop
node continuous-runner.js --max-sessions 10
```

---

## 📊 Performance Expectations

**Per Session:**
- Duration: 90-180 seconds (1.5-3 minutes)
- Pages: 5-15 (configurable)
- Screenshots: 5-15 images
- Log file: ~20-50KB

**Continuous Running:**
- Sessions per hour: ~20-40 (depending on settings)
- Screenshots per hour: ~100-600 images
- Data per hour: ~2-20MB
- Bandwidth: Moderate to high

---

## ✅ Ready to Go!

Start now:
```bash
npm run continuous
```

Or with custom settings:
```bash
node continuous-runner.js --duration 2 --pages 8
```

**Press Ctrl+C to stop anytime!**

---

**Happy Continuous Testing! 🚀**

