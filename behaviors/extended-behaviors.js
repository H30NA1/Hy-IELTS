/**
 * Extended Browsing Behaviors
 * Longer, more realistic browsing patterns for extended sessions
 */

const { sleep, randomDelay, smoothScroll, randomMouseMove } = require('../utils/helpers');

/**
 * Deep Explorer - Spends 2-3 minutes thoroughly exploring
 */
async function deepExplorer(page) {
  console.log('  → Behavior: Deep Explorer (Extended)');
  
  await randomDelay(2000, 3000);
  
  // Slow, thorough scrolling
  for (let i = 0; i < 3; i++) {
    await smoothScroll(page, 'slow', i * 0.3);
    await randomDelay(3000, 5000);
    
    // Random mouse movements
    await randomMouseMove(page, 5);
    await randomDelay(2000, 3000);
  }
  
  // Try to interact with images
  try {
    const images = await page.$$('img');
    if (images.length > 0) {
      for (let i = 0; i < Math.min(3, images.length); i++) {
        await images[i].hover();
        await randomDelay(2000, 3000);
      }
    }
  } catch (e) {
    console.log('    Could not interact with images');
  }
  
  // Scroll to different sections multiple times
  await smoothScroll(page, 'medium', 0.5);
  await randomDelay(4000, 6000);
  
  await smoothScroll(page, 'slow', 0.7);
  await randomDelay(3000, 5000);
  
  // Scroll to bottom
  await page.evaluate(() => window.scrollTo({ 
    top: document.body.scrollHeight, 
    behavior: 'smooth' 
  }));
  await randomDelay(3000, 5000);
  
  // Scroll back up
  await smoothScroll(page, 'medium', 0.5);
  await randomDelay(2000, 4000);
  
  await randomMouseMove(page, 8);
  
  return {
    duration: 'very-long',
    engagement: 'very-high',
    timeSpent: '2-3 minutes'
  };
}

/**
 * Careful Shopper - Checks everything before deciding
 */
async function carefulShopper(page) {
  console.log('  → Behavior: Careful Shopper (Extended)');
  
  await randomDelay(2000, 3000);
  
  // Look for product details
  await smoothScroll(page, 'slow');
  await randomDelay(3000, 5000);
  
  // Check prices multiple times
  try {
    const priceElements = await page.$$('[class*="price"], [class*="cost"]');
    if (priceElements.length > 0) {
      for (let i = 0; i < Math.min(3, priceElements.length); i++) {
        await priceElements[i].hover();
        await randomDelay(2000, 3000);
        await randomMouseMove(page, 3);
      }
    }
  } catch (e) {
    console.log('    Could not find price elements');
  }
  
  // Look for product descriptions
  await smoothScroll(page, 'slow', 0.4);
  await randomDelay(4000, 6000);
  
  // Check reviews/ratings
  await smoothScroll(page, 'medium', 0.6);
  await randomDelay(3000, 5000);
  
  // Look for shipping/delivery info
  await smoothScroll(page, 'slow', 0.8);
  await randomDelay(3000, 5000);
  
  // Try to find and hover over buttons
  try {
    const buttons = await page.$$('button, a[class*="button"]');
    if (buttons.length > 0) {
      for (let i = 0; i < Math.min(4, buttons.length); i++) {
        await buttons[i].hover();
        await randomDelay(1500, 2500);
      }
    }
  } catch (e) {
    console.log('    Could not interact with buttons');
  }
  
  await randomMouseMove(page, 6);
  
  // Scroll back to top to review
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await randomDelay(2000, 3000);
  
  return {
    duration: 'very-long',
    engagement: 'high',
    timeSpent: '2-3 minutes'
  };
}

/**
 * Research Mode - Reads everything, takes time
 */
async function researchMode(page) {
  console.log('  → Behavior: Research Mode (Extended)');
  
  await randomDelay(2000, 4000);
  
  // Methodical reading
  for (let section = 0; section < 5; section++) {
    const scrollPos = section * 0.2;
    await smoothScroll(page, 'slow', scrollPos);
    await randomDelay(4000, 7000); // Long pauses to "read"
    
    await randomMouseMove(page, 4);
    await randomDelay(2000, 3000);
  }
  
  // Look for specific elements
  try {
    const headings = await page.$$('h1, h2, h3');
    if (headings.length > 0) {
      for (let i = 0; i < Math.min(3, headings.length); i++) {
        await headings[i].hover();
        await randomDelay(2000, 4000);
      }
    }
  } catch (e) {
    console.log('    Could not find headings');
  }
  
  // Check for links
  try {
    const links = await page.$$('a');
    if (links.length > 0) {
      for (let i = 0; i < Math.min(5, links.length); i++) {
        await links[Math.floor(Math.random() * links.length)].hover();
        await randomDelay(1000, 2000);
      }
    }
  } catch (e) {
    console.log('    Could not interact with links');
  }
  
  // Full page review
  await page.evaluate(() => window.scrollTo({ 
    top: document.body.scrollHeight, 
    behavior: 'smooth' 
  }));
  await randomDelay(3000, 5000);
  
  await randomMouseMove(page, 7);
  
  return {
    duration: 'very-long',
    engagement: 'very-high',
    timeSpent: '2-3 minutes'
  };
}

/**
 * Detailed Comparer - Compares multiple aspects
 */
async function detailedComparer(page) {
  console.log('  → Behavior: Detailed Comparer (Extended)');
  
  await randomDelay(2000, 3000);
  
  // Check different sections
  const sections = [0.2, 0.4, 0.6, 0.8];
  
  for (const section of sections) {
    await smoothScroll(page, 'medium', section);
    await randomDelay(3000, 5000);
    
    // Try to find comparison elements
    try {
      const tables = await page.$$('table, [class*="compare"], [class*="feature"]');
      if (tables.length > 0) {
        await tables[0].hover();
        await randomDelay(3000, 5000);
      }
    } catch (e) {
      // Continue
    }
    
    await randomMouseMove(page, 4);
  }
  
  // Look for specifications
  await smoothScroll(page, 'slow', 0.5);
  await randomDelay(4000, 6000);
  
  // Check for pros/cons or reviews
  await smoothScroll(page, 'slow', 0.7);
  await randomDelay(3000, 5000);
  
  // Back to top for final review
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await randomDelay(2000, 3000);
  
  await randomMouseMove(page, 5);
  
  return {
    duration: 'very-long',
    engagement: 'high',
    timeSpent: '2-3 minutes'
  };
}

/**
 * Engaged Browser - High interaction
 */
async function engagedBrowser(page) {
  console.log('  → Behavior: Engaged Browser (Extended)');
  
  await randomDelay(1500, 2500);
  
  // Progressive scrolling with interactions
  for (let i = 0; i < 6; i++) {
    await smoothScroll(page, 'medium', i * 0.16);
    await randomDelay(2500, 4000);
    
    // Click random elements (non-navigation)
    try {
      const divs = await page.$$('div[class*="card"], div[class*="item"], div[class*="product"]');
      if (divs.length > 0) {
        const randomDiv = divs[Math.floor(Math.random() * divs.length)];
        await randomDiv.hover();
        await randomDelay(2000, 3000);
      }
    } catch (e) {
      // Continue
    }
    
    await randomMouseMove(page, 3);
  }
  
  // Try to expand sections
  try {
    const expandable = await page.$$('button[class*="expand"], [class*="accordion"], details');
    if (expandable.length > 0) {
      for (let i = 0; i < Math.min(2, expandable.length); i++) {
        await expandable[i].click();
        await randomDelay(2000, 3000);
      }
    }
  } catch (e) {
    console.log('    Could not expand sections');
  }
  
  // Final scroll through
  await smoothScroll(page, 'medium', 1);
  await randomDelay(2000, 3000);
  
  await randomMouseMove(page, 6);
  
  return {
    duration: 'long',
    engagement: 'very-high',
    timeSpent: '1.5-2 minutes'
  };
}

/**
 * Get a random extended behavior
 */
function getRandomExtendedBehavior() {
  const behaviors = [
    deepExplorer,
    carefulShopper,
    researchMode,
    detailedComparer,
    engagedBrowser
  ];
  
  return behaviors[Math.floor(Math.random() * behaviors.length)];
}

module.exports = {
  deepExplorer,
  carefulShopper,
  researchMode,
  detailedComparer,
  engagedBrowser,
  getRandomExtendedBehavior
};

