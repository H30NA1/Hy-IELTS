/**
 * Simple Start Script
 * Just run: node start.js
 * Configure URLs in urls.json
 */

const fs = require('fs');
const BrowserSession = require('./browser-session');
const { getRandomDeviceAny } = require('./config/devices');
const { getRandomProxy, getAllProxies } = require('./config/proxies');
const { fetchHTTPProxies } = require('./utils/proxy-fetcher');
const { sleep } = require('./utils/helpers');
const { loadCachedProxies, saveCachedProxies, markProxySuccess, markProxyFailure, getBestProxies } = require('./utils/proxy-cache');
const { fetchCustomProxies } = require('./utils/custom-proxy-api');

class SimpleRunner {
  constructor() {
    this.config = this.loadConfig();
    this.urls = this.config.urls;
    this.sessionDuration = (this.config.settings.sessionDuration || 120) * 1000;
    this.concurrentBrowsers = this.config.settings.concurrentBrowsers || 3;
    this.delayBetween = (this.config.settings.delayBetween || 5) * 1000;
    this.useCustomAPI = this.config.settings.useCustomAPI || false; // Use custom proxy API
    this.useLiveProxies = this.config.settings.useLiveProxies !== false; // Default true
    
    this.totalSessions = 0;
    this.successCount = 0;
    this.isRunning = false;
    this.liveProxies = [];
  }

  loadConfig() {
    try {
      const configFile = fs.readFileSync('./urls.json', 'utf8');
      return JSON.parse(configFile);
    } catch (error) {
      console.error('❌ Could not load urls.json. Make sure it exists!');
      process.exit(1);
    }
  }

  async loadLiveProxies() {
    // Priority 1: Try custom API if enabled
    if (this.useCustomAPI) {
      console.log('🔑 Using custom proxy API...\n');
      try {
        const customProxies = await fetchCustomProxies();
        if (customProxies.length > 0) {
          this.liveProxies = customProxies;
          console.log(`✅ Using ${customProxies.length} proxies from custom API\n`);
          saveCachedProxies(customProxies);
          return;
        } else {
          console.log('⚠️  Custom API returned no proxies, falling back to free proxies...\n');
        }
      } catch (error) {
        console.log('⚠️  Custom API failed, falling back to free proxies...\n');
      }
    }

    // Priority 2: Built-in proxies if live proxies disabled
    if (!this.useLiveProxies) {
      console.log('ℹ️  Using built-in proxy list\n');
      return;
    }

    try {
      // Try to load cached proxies first
      const cached = loadCachedProxies();
      if (cached && cached.length > 0) {
        this.liveProxies = getBestProxies(cached);
        console.log(`💾 Using ${this.liveProxies.length} cached proxies (sorted by success rate)\n`);
        return;
      }

      console.log('🔍 Fetching and testing proxies (this will take 1-2 minutes)...\n');
      
      // Fetch proxies from multiple sources
      const allProxies = await fetchHTTPProxies();
      console.log(`📥 Total: ${allProxies.length} unique HTTP proxies\n`);
      
      // Test proxies with actual HTTP requests (more accurate)
      const testCount = Math.min(100, allProxies.length); // Test fewer but more accurately
      console.log(`🧪 Testing ${testCount} random proxies with HTTP requests...\n`);
      const { getWorkingProxies } = require('./utils/proxy-fetcher');
      
      // Shuffle and take random proxies
      const shuffled = allProxies.sort(() => Math.random() - 0.5);
      const toTest = shuffled.slice(0, testCount);
      
      const workingProxies = await getWorkingProxies(toTest, testCount);
      
      if (workingProxies.length >= 5) {
        this.liveProxies = workingProxies;
        console.log(`\n✅ SUCCESS! Found ${workingProxies.length} WORKING HTTP proxies!`);
        console.log('   These passed actual HTTP requests and will work in browser.\n');
        // Cache for next run
        saveCachedProxies(workingProxies);
      } else if (workingProxies.length >= 2) {
        this.liveProxies = workingProxies;
        console.log(`\n⚠️  Found ${workingProxies.length} working HTTP proxies.`);
        console.log('   Limited pool - adding built-in proxies as backup.\n');
        saveCachedProxies(workingProxies);
        // Add built-in proxies as backup
        this.liveProxies.push(...getAllProxies());
      } else if (workingProxies.length === 1) {
        this.liveProxies = workingProxies;
        console.log(`\n⚠️  Only 1 working proxy found.`);
        console.log('   Adding built-in proxies as backup.\n');
        this.liveProxies.push(...getAllProxies());
      } else {
        console.log('\n❌ No working free HTTP proxies found.');
        console.log('   Using built-in proxy list (32 proxies) instead.\n');
        this.liveProxies = getAllProxies();
      }
    } catch (error) {
      console.log('⚠️  Error fetching proxies, using built-in list\n');
      console.log(`   Error: ${error.message}\n`);
      this.liveProxies = [];
    }
  }

  getProxy() {
    if (this.liveProxies.length > 0) {
      // Use live proxy from GitHub
      return this.liveProxies[Math.floor(Math.random() * this.liveProxies.length)];
    } else {
      // Fallback to built-in proxies
      return getRandomProxy();
    }
  }

  async start() {
    this.isRunning = true;
    
    console.log('\n' + '═'.repeat(80));
    console.log('🚀 STARTING NON-STOP BROWSER AUTOMATION');
    console.log('═'.repeat(80));
    console.log('\nConfiguration:');
    console.log(`  URLs to visit:        ${this.urls.length}`);
    console.log(`  Session duration:     ${this.sessionDuration / 1000}s`);
    console.log(`  Concurrent browsers:  ${this.concurrentBrowsers}`);
    console.log(`  Delay between:        ${this.delayBetween / 1000}s`);
    console.log(`  Live proxies:         ${this.useLiveProxies ? 'Yes (from GitHub)' : 'No (built-in)'}`);
    console.log('\nURLs:');
    this.urls.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`);
    });
    console.log('\n' + '═'.repeat(80));
    
    // Load live proxies if enabled
    if (this.useLiveProxies) {
      await this.loadLiveProxies();
    }
    
    console.log('⚠️  Press Ctrl+C to stop');
    console.log('💡 Browsers will be VISIBLE!');
    console.log('🔄 Proxies are tested before use (auto-fallback to direct)\n');
    console.log('═'.repeat(80) + '\n');

    process.on('SIGINT', () => this.stop());

    // Run forever
    while (this.isRunning) {
      await this.runBatch();
      console.log(`\n⏳ Waiting ${this.delayBetween / 1000}s before next batch...\n`);
      await sleep(this.delayBetween);
    }
  }

  async runBatch() {
    const promises = [];
    
    // Start multiple browsers concurrently
    for (let i = 0; i < this.concurrentBrowsers; i++) {
      promises.push(this.runSession(i + 1));
      await sleep(2000); // Small delay between starting each browser
    }

    await Promise.all(promises);
  }

  async runSession(browserNum) {
    this.totalSessions++;
    const sessionStart = Date.now();
    
    // Pick a random URL from the list
    const url = this.urls[Math.floor(Math.random() * this.urls.length)];
    const device = getRandomDeviceAny();
    const proxy = this.getProxy();

    console.log(`\n🌐 Browser ${browserNum} - Session #${this.totalSessions}`);
    console.log(`   URL:     ${url}`);
    console.log(`   Device:  ${device.name} (${device.type})`);
    
    if (proxy.source) {
      console.log(`   Proxy:   ${proxy.ip}:${proxy.port} (Live from GitHub - testing...)`);
    } else {
      console.log(`   Proxy:   ${proxy.country}, ${proxy.city} (Built-in - testing...)`);
    }

    const session = new BrowserSession({
      device,
      proxy,
      sessionId: `auto_${this.totalSessions}_${Date.now()}`
    });

    try {
      const result = await session.visitSpecificPage(url, this.sessionDuration);
      
      const duration = ((Date.now() - sessionStart) / 1000).toFixed(1);
      
      if (result.success && result.proxyWorked) {
        this.successCount++;
        markProxySuccess(proxy); // Track successful proxy
        console.log(`   ✅ Browser ${browserNum} completed WITH PROXY (${duration}s)`);
      } else {
        markProxyFailure(proxy); // Track failed proxy
        console.log(`   ❌ Browser ${browserNum} FAILED - Proxy didn't work (${duration}s)`);
      }
    } catch (error) {
      markProxyFailure(proxy); // Track failed proxy
      const duration = ((Date.now() - sessionStart) / 1000).toFixed(1);
      console.log(`   ❌ Browser ${browserNum} failed (${duration}s): ${error.message}`);
    }
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    console.log('\n\n' + '═'.repeat(80));
    console.log('🛑 STOPPING...');
    console.log('═'.repeat(80));
    console.log(`\n📊 Total Sessions: ${this.totalSessions}`);
    console.log(`✅ Successful (with proxy): ${this.successCount}`);
    console.log(`❌ Failed (proxy didn't work): ${this.totalSessions - this.successCount}`);
    console.log(`📈 Success Rate: ${this.totalSessions > 0 ? ((this.successCount / this.totalSessions) * 100).toFixed(1) : 0}%`);
    console.log('\n' + '═'.repeat(80));
    console.log('👋 Goodbye!\n');
    
    process.exit(0);
  }
}

async function main() {
  const runner = new SimpleRunner();
  await runner.start();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimpleRunner;

