/**
 * Helper Utilities
 * Common functions for realistic browser automation
 */

/**
 * Sleep for a random duration within a range
 */
async function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Simple sleep function
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Smooth scroll simulation
 * @param {Object} page - Puppeteer page object
 * @param {string} speed - 'slow', 'medium', 'fast'
 * @param {number} percentage - Scroll to percentage of page (0-1), null for full page
 * @param {Object} element - Optional element to scroll within
 */
async function smoothScroll(page, speed = 'medium', percentage = null, element = null) {
  const speeds = {
    slow: 100,
    medium: 50,
    fast: 20
  };
  
  const scrollDelay = speeds[speed] || 50;
  
  if (percentage !== null) {
    // Scroll to specific percentage
    await page.evaluate((pct) => {
      const targetY = document.body.scrollHeight * pct;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }, percentage);
    await sleep(1000);
  } else {
    // Scroll full page incrementally
    await page.evaluate(async (delay) => {
      await new Promise((resolve) => {
        let totalHeight     = 0;
        const distance      = 100;
        const scrollHeight  = document.body.scrollHeight;
        
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve();
          }
        }, delay);
      });
    }, scrollDelay);
  }
}

/**
 * Random mouse movements to simulate human behavior
 */
async function randomMouseMove(page, count = 5) {
  const viewport = page.viewport();
  
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * viewport.width);
    const y = Math.floor(Math.random() * viewport.height);
    
    try {
      await page.mouse.move(x, y, { steps: 10 });
      await randomDelay(200, 500);
    } catch (e) {
      // Ignore mouse move errors
    }
  }
}

/**
 * Type text with human-like delays
 */
async function humanTypeText(page, selector, text) {
  await page.waitForSelector(selector);
  const element = await page.$(selector);
  
  for (const char of text) {
    await element.type(char, { delay: Math.random() * 100 + 50 });
  }
}

/**
 * Random click on page elements
 */
async function randomClick(page, selector) {
  try {
    const elements = await page.$$(selector);
    if (elements.length > 0) {
      const randomIndex = Math.floor(Math.random() * elements.length);
      await elements[randomIndex].click();
      return true;
    }
  } catch (e) {
    console.log(`Could not click ${selector}:`, e.message);
  }
  return false;
}

/**
 * Get current timestamp for logging
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Format duration in seconds to readable format
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Generate random email
 */
function generateRandomEmail() {
  const names    = ['john', 'jane', 'alex', 'sarah', 'mike', 'emma', 'david', 'lisa'];
  const domains  = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'proton.me'];
  const name     = names[Math.floor(Math.random() * names.length)];
  const domain   = domains[Math.floor(Math.random() * domains.length)];
  const random   = Math.floor(Math.random() * 10000);
  
  return `${name}${random}@${domain}`;
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

module.exports = {
  randomDelay,
  sleep,
  smoothScroll,
  randomMouseMove,
  humanTypeText,
  randomClick,
  getTimestamp,
  formatDuration,
  generateRandomEmail,
  extractDomain
};

