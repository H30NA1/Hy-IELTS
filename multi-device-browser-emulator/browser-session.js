/**
 * Browser Session Manager
 * Handles individual browser sessions with device and proxy configuration
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Logger = require('./utils/logger');
const { randomDelay, extractDomain } = require('./utils/helpers');
const { getBehaviorForDevice } = require('./behaviors/browsing-patterns');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

class BrowserSession {
  constructor(config = {}) {
    this.device    = config.device;
    this.proxy     = config.proxy;
    this.sessionId = config.sessionId || Date.now();
    this.logger    = new Logger();
    this.browser   = null;
    this.page      = null;
    this.proxyWorked = false; // Track if proxy actually worked
  }

  /**
   * Test if proxy can connect to Google
   */
  async testProxyConnection() {
    if (!this.proxy) return true; // No proxy to test

    const proxyDisplay = this.proxy.country || this.proxy.source || 'Unknown';
    this.logger.info(`Testing proxy: ${this.proxy.ip}:${this.proxy.port} (${proxyDisplay})`);

    let testBrowser = null;
    try {
      // Fix memory leak: set max listeners
      process.setMaxListeners(50);
      
      // Launch a test browser with proxy
      testBrowser = await puppeteer.launch({
        headless: 'new', // Use new headless mode (fixes warning)
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          `--proxy-server=http://${this.proxy.ip}:${this.proxy.port}`,
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const testPage = await testBrowser.newPage();
      
      // Set a simple user agent
      await testPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Try to load a simple page with 12 second timeout
      await testPage.goto('http://www.google.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 12000 
      });

      await testBrowser.close();
      this.logger.success(`✓ Proxy working: ${proxyDisplay}`);
      return true;
    } catch (error) {
      if (testBrowser) {
        try { await testBrowser.close(); } catch (e) {}
      }
      
      const errorMsg = error.message.includes('ERR_TUNNEL_CONNECTION_FAILED') 
        ? 'Dead proxy or SOCKS (need HTTP)' 
        : error.message.includes('ERR_PROXY_CONNECTION_FAILED')
        ? 'Proxy refused connection'
        : error.message.includes('ERR_EMPTY_RESPONSE')
        ? 'Proxy gave empty response'
        : error.message.includes('timeout')
        ? 'Too slow (timeout)'
        : error.message.substring(0, 40);
      
      this.logger.warn(`✗ Proxy failed: ${proxyDisplay} - ${errorMsg}`);
      return false;
    }
  }

  /**
   * Initialize the browser with device and proxy settings
   */
  async initialize() {
    this.logger.info('Initializing browser session', {
      sessionId: this.sessionId,
      device: this.device.name,
      deviceType: this.device.type,
      proxy: this.proxy ? `${this.proxy.ip}:${this.proxy.port}` : 'Direct Connection'
    });

    // Test proxy first if one is provided
    let useProxy = false;
    if (this.proxy) {
      useProxy = await this.testProxyConnection();
      
      if (!useProxy) {
        this.logger.warn('⚠️  Proxy failed - SESSION WILL BE MARKED AS FAILED');
        console.log(`   ❌ Proxy failed - this session will be counted as FAILURE`);
        this.proxyWorked = false;
        this.proxy = null; // Remove failed proxy
      } else {
        console.log(`   ✓ Using proxy: ${this.proxy.country || this.proxy.source}`);
        this.proxyWorked = true;
      }
    } else {
      console.log(`   ℹ️  Using DIRECT CONNECTION (no proxy)`);
      this.proxyWorked = false; // No proxy means no proxy success
    }

    const launchOptions = {
      headless: false, // Non-headless - you can see the browser!
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--start-maximized',
        '--disable-dev-shm-usage'
      ]
    };
    
    // Fix memory leak
    process.setMaxListeners(50);

    // Add proxy if available and working
    if (this.proxy && useProxy) {
      launchOptions.args.push(`--proxy-server=http://${this.proxy.ip}:${this.proxy.port}`);
    }

    try {
      this.browser = await puppeteer.launch(launchOptions);
      this.page    = await this.browser.newPage();

      // Set device viewport and user agent
      await this.page.setViewport(this.device.viewport);
      await this.page.setUserAgent(this.device.userAgent);

      // Override navigator properties
      await this.page.evaluateOnNewDocument((platform) => {
        Object.defineProperty(navigator, 'platform', {
          get: () => platform
        });
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
      }, this.device.platform);

      this.logger.success('Browser initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize browser', { error: error.message });
      return false;
    }
  }

  /**
   * Search for a keyword on Google
   */
  async searchGoogle(keyword) {
    this.logger.info(`Searching Google for: "${keyword}"`);

    try {
      await this.page.goto('https://www.google.com', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      await randomDelay(1000, 2000);

      // Accept cookies if present
      try {
        const cookieButton = await this.page.$('button[id*="accept"], button[id*="agree"]');
        if (cookieButton) {
          await cookieButton.click();
          await randomDelay(500, 1000);
        }
      } catch (e) {
        // Ignore cookie button errors
      }

      // Find search box and type keyword
      await this.page.waitForSelector('input[name="q"], textarea[name="q"]', { timeout: 5000 });
      await this.page.type('input[name="q"], textarea[name="q"]', keyword, { delay: 100 });
      
      await randomDelay(500, 1000);

      // Submit search
      await this.page.keyboard.press('Enter');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      this.logger.success('Search completed', { keyword });
      
      // Take screenshot of search results
      await this.takeScreenshot('search-results');

      return true;
    } catch (error) {
      this.logger.error('Search failed', { error: error.message });
      return false;
    }
  }

  /**
   * Browse search results and visit pages
   */
  async browseSearchResults(maxPages = 3) {
    this.logger.info(`Browsing search results (max ${maxPages} pages)`);

    try {
      // Get search result links
      const links = await this.page.$$('a[href*="zentha"]');
      
      if (links.length === 0) {
        this.logger.warn('No relevant links found in search results');
        // Get all links as fallback
        const allLinks = await this.page.$$('div#search a[href^="http"]');
        this.logger.info(`Found ${allLinks.length} total links`);
      }

      const linksToVisit = Math.min(links.length || 3, maxPages);

      for (let i = 0; i < linksToVisit; i++) {
        try {
          // Get fresh links (page might have changed)
          const currentLinks = await this.page.$$('div#search a[href^="http"]');
          
          if (currentLinks.length > i) {
            const href = await currentLinks[i].evaluate(el => el.href);
            
            if (!href || href.includes('google.com') || href.includes('youtube.com')) {
              continue;
            }

            this.logger.info(`Visiting page ${i + 1}: ${extractDomain(href)}`);

            await currentLinks[i].click();
            await this.page.waitForNavigation({ 
              waitUntil: 'networkidle2', 
              timeout: 30000 
            }).catch(() => {
              this.logger.warn('Navigation timeout, continuing...');
            });

            // Take screenshot
            await this.takeScreenshot(`page-${i + 1}`);

            // Apply behavior pattern
            await this.applyBehaviorPattern();

            // Go back to search results
            if (i < linksToVisit - 1) {
              await this.page.goBack();
              await randomDelay(2000, 3000);
            }
          }
        } catch (error) {
          this.logger.warn(`Error visiting page ${i + 1}`, { error: error.message });
          // Try to go back to search results
          try {
            await this.page.goto(this.page.url().includes('google.com') 
              ? this.page.url() 
              : 'https://www.google.com');
          } catch (e) {
            // Ignore
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Browsing failed', { error: error.message });
      return false;
    }
  }

  /**
   * Apply realistic behavior pattern based on device type
   */
  async applyBehaviorPattern() {
    const behaviorFunc = getBehaviorForDevice(this.device.type);
    
    try {
      const result = await behaviorFunc(this.page);
      this.logger.info('Behavior pattern applied', result);
    } catch (error) {
      this.logger.warn('Behavior pattern error', { error: error.message });
    }
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name) {
    try {
      const filename = `./screenshots/${this.sessionId}_${name}_${Date.now()}.png`;
      await this.page.screenshot({ 
        path: filename, 
        fullPage: false 
      });
      this.logger.info('Screenshot saved', { filename });
    } catch (error) {
      this.logger.warn('Screenshot failed', { error: error.message });
    }
  }

  /**
   * Run complete session
   */
  async runSession(keyword = 'zentha matcha', maxPages = 3) {
    const startTime = Date.now();

    this.logger.info('Starting browser session', {
      sessionId: this.sessionId,
      keyword,
      maxPages
    });

    const initialized = await this.initialize();
    if (!initialized) {
      this.logger.error('Session failed: Could not initialize browser');
      return false;
    }

    await randomDelay(2000, 3000);

    // Search
    const searchSuccess = await this.searchGoogle(keyword);
    if (!searchSuccess) {
      this.logger.error('Session failed: Search failed');
      await this.close();
      return false;
    }

    await randomDelay(2000, 4000);

    // Browse results
    const browseSuccess = await this.browseSearchResults(maxPages);

    // Close session
    await this.close();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.success('Session completed', { 
      duration: `${duration}s`,
      success: browseSuccess 
    });

    // Save session log
    this.logger.saveSession(this.sessionId);

    return browseSuccess;
  }

  /**
   * Run extended session (1+ minutes)
   */
  async runExtendedSession(keyword = 'zentha matcha', maxPages = 5, minDuration = 90000) {
    const startTime = Date.now();

    this.logger.info('Starting EXTENDED browser session', {
      sessionId: this.sessionId,
      keyword,
      maxPages,
      minDuration: `${minDuration / 1000}s`
    });

    const initialized = await this.initialize();
    if (!initialized) {
      this.logger.error('Session failed: Could not initialize browser');
      return false;
    }

    await randomDelay(3000, 5000);

    // Search
    const searchSuccess = await this.searchGoogle(keyword);
    if (!searchSuccess) {
      this.logger.error('Session failed: Search failed');
      await this.close();
      return false;
    }

    await randomDelay(3000, 5000);

    // Browse results with extended behavior
    const browseSuccess = await this.browseSearchResultsExtended(maxPages);

    // Ensure minimum duration
    const elapsed = Date.now() - startTime;
    if (elapsed < minDuration) {
      const remaining = minDuration - elapsed;
      this.logger.info(`Ensuring minimum duration (waiting ${(remaining / 1000).toFixed(1)}s more)`);
      await randomDelay(remaining - 2000, remaining);
    }

    // Close session
    await this.close();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.success('Extended session completed', { 
      duration: `${duration}s`,
      success: browseSuccess 
    });

    // Save session log
    this.logger.saveSession(this.sessionId);

    return browseSuccess;
  }

  /**
   * Browse search results with extended behavior (longer interactions)
   */
  async browseSearchResultsExtended(maxPages = 5) {
    this.logger.info(`Browsing search results EXTENDED (max ${maxPages} pages)`);

    try {
      const allLinks = await this.page.$$('div#search a[href^="http"]');
      this.logger.info(`Found ${allLinks.length} total links`);

      const linksToVisit = Math.min(allLinks.length, maxPages);

      for (let i = 0; i < linksToVisit; i++) {
        try {
          const currentLinks = await this.page.$$('div#search a[href^="http"]');
          
          if (currentLinks.length > i) {
            const href = await currentLinks[i].evaluate(el => el.href);
            
            if (!href || href.includes('google.com') || href.includes('youtube.com')) {
              continue;
            }

            this.logger.info(`Visiting page ${i + 1}/${linksToVisit}: ${extractDomain(href)}`);

            await currentLinks[i].click();
            await this.page.waitForNavigation({ 
              waitUntil: 'networkidle2', 
              timeout: 30000 
            }).catch(() => {
              this.logger.warn('Navigation timeout, continuing...');
            });

            await randomDelay(2000, 3000);

            // Take screenshot
            await this.takeScreenshot(`page-${i + 1}`);

            // Apply EXTENDED behavior pattern (takes longer)
            await this.applyExtendedBehaviorPattern();

            // Additional random actions
            await this.performRandomActions();

            // Go back to search results
            if (i < linksToVisit - 1) {
              await this.page.goBack();
              await randomDelay(3000, 5000);
            }
          }
        } catch (error) {
          this.logger.warn(`Error visiting page ${i + 1}`, { error: error.message });
          try {
            await this.page.goto(this.page.url().includes('google.com') 
              ? this.page.url() 
              : 'https://www.google.com');
          } catch (e) {
            // Ignore
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Extended browsing failed', { error: error.message });
      return false;
    }
  }

  /**
   * Apply extended behavior pattern (longer duration)
   */
  async applyExtendedBehaviorPattern() {
    const { getRandomExtendedBehavior } = require('./behaviors/extended-behaviors');
    const behaviorFunc = getRandomExtendedBehavior();
    
    try {
      const result = await behaviorFunc(this.page);
      this.logger.info('Extended behavior pattern applied', result);
    } catch (error) {
      this.logger.warn('Extended behavior pattern error', { error: error.message });
    }
  }

  /**
   * Perform random actions on page
   */
  async performRandomActions() {
    try {
      // Random chance to scroll again
      if (Math.random() < 0.5) {
        await this.page.evaluate(() => {
          window.scrollTo({ 
            top: Math.random() * document.body.scrollHeight, 
            behavior: 'smooth' 
          });
        });
        await randomDelay(2000, 3000);
      }

      // Random chance to hover over elements
      if (Math.random() < 0.7) {
        const elements = await this.page.$$('a, button, img');
        if (elements.length > 0) {
          const randomEl = elements[Math.floor(Math.random() * elements.length)];
          await randomEl.hover();
          await randomDelay(1000, 2000);
        }
      }

      // Random mouse movements
      await randomMouseMove(this.page, 3);
    } catch (error) {
      // Ignore errors in random actions
    }
  }

  /**
   * Visit a specific URL directly (no search)
   */
  async visitSpecificPage(url, duration = 90000) {
    const startTime = Date.now();

    this.logger.info('Starting direct page visit', {
      sessionId: this.sessionId,
      url,
      minDuration: `${duration / 1000}s`
    });

    const initialized = await this.initialize();
    if (!initialized) {
      this.logger.error('Session failed: Could not initialize browser');
      return { success: false, proxyWorked: false };
    }

    // If proxy didn't work, stop here and return failure
    if (!this.proxyWorked) {
      this.logger.warn('Session stopped: Proxy failed, not using direct connection');
      await this.close();
      return { success: false, proxyWorked: false };
    }

    await randomDelay(2000, 3000);

    try {
      // Navigate directly to the URL
      this.logger.info(`Navigating to: ${url}`);
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      await randomDelay(2000, 3000);

      // Take screenshot
      await this.takeScreenshot('page-loaded');

      // Apply extended behavior
      await this.applyExtendedBehaviorPattern();

      // Additional interactions
      await this.performRandomActions();

      // Take another screenshot
      await this.takeScreenshot('after-interaction');

      // Ensure minimum duration
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const remaining = duration - elapsed;
        this.logger.info(`Ensuring minimum duration (waiting ${(remaining / 1000).toFixed(1)}s more)`);
        await randomDelay(remaining - 2000, remaining);
      }

      // Close session
      await this.close();

      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.success('Direct page visit completed WITH PROXY', { 
        duration: `${totalDuration}s`,
        url 
      });

      // Save session log
      this.logger.saveSession(this.sessionId);

      return { success: true, proxyWorked: true };
    } catch (error) {
      this.logger.error('Direct page visit failed', { error: error.message });
      await this.close();
      return { success: false, proxyWorked: this.proxyWorked };
    }
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.logger.info('Browser closed');
    }
  }
}

module.exports = BrowserSession;

