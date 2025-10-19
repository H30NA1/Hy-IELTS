/**
 * Realistic Customer Browsing Behavior Patterns
 * Different user personas with unique browsing behaviors
 */

const { sleep, randomDelay, smoothScroll, randomMouseMove } = require('../utils/helpers');

/**
 * Behavior Group 1: Quick Researcher
 * - Fast scrolling, quick page views
 * - Minimal interaction, focused on finding information
 */
async function quickResearcher(page) {
  console.log('  → Behavior: Quick Researcher');
  
  await randomDelay(1000, 2000);
  
  // Quick scroll to get overview
  await smoothScroll(page, 'fast');
  await randomDelay(500, 1000);
  
  // Scroll back up
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await randomDelay(800, 1500);
  
  // Quick middle section view
  await smoothScroll(page, 'medium', 0.5);
  await randomDelay(1000, 1500);
  
  // Random mouse movements (checking around)
  await randomMouseMove(page, 3);
  
  return {
    duration: 'short',
    engagement: 'low',
    pageViews: 1-2
  };
}

/**
 * Behavior Group 2: Detailed Browser
 * - Slow, methodical scrolling
 * - Reads content carefully
 * - Hovers over elements, clicks on sections
 */
async function detailedBrowser(page) {
  console.log('  → Behavior: Detailed Browser');
  
  await randomDelay(2000, 3000);
  
  // Slow scroll down, reading content
  await smoothScroll(page, 'slow');
  await randomDelay(3000, 5000);
  
  // Try to find and click on product images or links
  try {
    const images = await page.$$('img[alt*="matcha"], img[src*="matcha"]');
    if (images.length > 0) {
      const randomImg = images[Math.floor(Math.random() * images.length)];
      await randomImg.hover();
      await randomDelay(1000, 2000);
    }
  } catch (e) {
    console.log('    Could not interact with images');
  }
  
  // Scroll to different sections
  await smoothScroll(page, 'medium', 0.3);
  await randomDelay(2000, 3000);
  
  await smoothScroll(page, 'medium', 0.6);
  await randomDelay(2000, 3000);
  
  // Random mouse movements (reading)
  await randomMouseMove(page, 5);
  
  // Scroll to bottom
  await page.evaluate(() => window.scrollTo({ 
    top: document.body.scrollHeight, 
    behavior: 'smooth' 
  }));
  await randomDelay(2000, 3000);
  
  return {
    duration: 'long',
    engagement: 'high',
    pageViews: 3-5
  };
}

/**
 * Behavior Group 3: Price Checker
 * - Looks for pricing information
 * - Compares products
 * - May add to cart
 */
async function priceChecker(page) {
  console.log('  → Behavior: Price Checker');
  
  await randomDelay(1500, 2500);
  
  // Scroll looking for prices
  await smoothScroll(page, 'medium');
  await randomDelay(1000, 2000);
  
  // Try to find price elements
  try {
    const priceElements = await page.$$('[class*="price"], [class*="cost"], span:has-text("$"), span:has-text("€")');
    if (priceElements.length > 0) {
      for (let i = 0; i < Math.min(3, priceElements.length); i++) {
        await priceElements[i].hover();
        await randomDelay(800, 1500);
      }
    }
  } catch (e) {
    console.log('    Could not find price elements');
  }
  
  // Look for "add to cart" or "buy" buttons
  try {
    const buyButtons = await page.$$('button:has-text("Add"), button:has-text("Cart"), button:has-text("Buy")');
    if (buyButtons.length > 0) {
      await buyButtons[0].hover();
      await randomDelay(2000, 3000);
      // Sometimes click (20% chance)
      if (Math.random() < 0.2) {
        await buyButtons[0].click();
        await randomDelay(2000, 3000);
      }
    }
  } catch (e) {
    console.log('    Could not find buy buttons');
  }
  
  await randomMouseMove(page, 4);
  
  return {
    duration: 'medium',
    engagement: 'medium',
    pageViews: 2-3
  };
}

/**
 * Behavior Group 4: Review Reader
 * - Looks for customer reviews
 * - Scrolls to review sections
 * - Reads ratings and feedback
 */
async function reviewReader(page) {
  console.log('  → Behavior: Review Reader');
  
  await randomDelay(1500, 2500);
  
  // Quick scroll to find reviews
  await smoothScroll(page, 'fast');
  await randomDelay(1000, 1500);
  
  // Try to find review section
  try {
    const reviewSection = await page.$('[class*="review"], [id*="review"], section:has-text("Review")');
    if (reviewSection) {
      await reviewSection.scrollIntoView({ behavior: 'smooth' });
      await randomDelay(3000, 5000);
      
      // Read through reviews
      await smoothScroll(page, 'slow', null, reviewSection);
      await randomDelay(2000, 4000);
    }
  } catch (e) {
    console.log('    Could not find review section');
  }
  
  // Look for star ratings
  try {
    const ratings = await page.$$('[class*="star"], [class*="rating"]');
    if (ratings.length > 0) {
      for (let i = 0; i < Math.min(2, ratings.length); i++) {
        await ratings[i].hover();
        await randomDelay(1000, 2000);
      }
    }
  } catch (e) {
    console.log('    Could not find ratings');
  }
  
  await randomMouseMove(page, 4);
  
  return {
    duration: 'medium',
    engagement: 'medium-high',
    pageViews: 2-3
  };
}

/**
 * Behavior Group 5: Product Comparer
 * - Opens multiple product pages
 * - Switches between tabs
 * - Compares features and specifications
 */
async function productComparer(page) {
  console.log('  → Behavior: Product Comparer');
  
  await randomDelay(2000, 3000);
  
  // Scroll to find products
  await smoothScroll(page, 'medium');
  await randomDelay(1500, 2500);
  
  // Try to find product links
  try {
    const productLinks = await page.$$('a[href*="product"], a[href*="item"], .product-link, .item-link');
    
    if (productLinks.length > 1) {
      // Click on first product (middle-click to open in new tab)
      await productLinks[0].hover();
      await randomDelay(500, 1000);
      // Note: Can't easily simulate new tab in single session, so just click
      await productLinks[0].click();
      await randomDelay(3000, 5000);
      
      // Browse this product
      await smoothScroll(page, 'medium');
      await randomDelay(2000, 3000);
      
      // Go back
      await page.goBack();
      await randomDelay(2000, 3000);
      
      // Look at another product
      if (productLinks.length > 1) {
        await productLinks[1].hover();
        await randomDelay(500, 1000);
      }
    }
  } catch (e) {
    console.log('    Could not compare products:', e.message);
  }
  
  await randomMouseMove(page, 5);
  
  return {
    duration: 'long',
    engagement: 'high',
    pageViews: 3-5
  };
}

/**
 * Behavior Group 6: Mobile Quick Swiper
 * - Fast mobile behavior
 * - Quick swipes and taps
 * - Minimal engagement
 */
async function mobileQuickSwiper(page) {
  console.log('  → Behavior: Mobile Quick Swiper');
  
  await randomDelay(500, 1000);
  
  // Quick swipes (fast scrolls)
  await smoothScroll(page, 'fast', 0.3);
  await randomDelay(300, 600);
  
  await smoothScroll(page, 'fast', 0.6);
  await randomDelay(300, 600);
  
  await smoothScroll(page, 'fast', 1);
  await randomDelay(500, 1000);
  
  // Scroll back up quickly
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  await randomDelay(500, 800);
  
  return {
    duration: 'very-short',
    engagement: 'very-low',
    pageViews: 1
  };
}

/**
 * Behavior Group 7: Form Filler
 * - Looks for contact forms, newsletter signups
 * - May fill out forms
 * - Interested in engagement
 */
async function formFiller(page) {
  console.log('  → Behavior: Form Filler');
  
  await randomDelay(2000, 3000);
  
  // Scroll to find forms
  await smoothScroll(page, 'medium');
  await randomDelay(1500, 2500);
  
  // Try to find form inputs
  try {
    const emailInputs = await page.$$('input[type="email"], input[placeholder*="email"]');
    
    if (emailInputs.length > 0) {
      await emailInputs[0].click();
      await randomDelay(500, 1000);
      
      // Sometimes fill it (30% chance)
      if (Math.random() < 0.3) {
        const fakeEmail = `user${Math.floor(Math.random() * 10000)}@example.com`;
        await emailInputs[0].type(fakeEmail, { delay: 100 });
        await randomDelay(1000, 2000);
        
        // Look for submit button
        const submitButtons = await page.$$('button[type="submit"], input[type="submit"]');
        if (submitButtons.length > 0) {
          await submitButtons[0].hover();
          await randomDelay(1000, 2000);
          // Usually don't actually submit
        }
      } else {
        // Just click away
        await page.click('body');
      }
    }
  } catch (e) {
    console.log('    Could not interact with forms');
  }
  
  await randomMouseMove(page, 3);
  
  return {
    duration: 'medium',
    engagement: 'medium',
    pageViews: 1-2
  };
}

/**
 * Get a random behavior pattern
 */
function getRandomBehavior() {
  const behaviors = [
    quickResearcher,
    detailedBrowser,
    priceChecker,
    reviewReader,
    productComparer,
    mobileQuickSwiper,
    formFiller
  ];
  
  return behaviors[Math.floor(Math.random() * behaviors.length)];
}

/**
 * Get behavior based on device type
 */
function getBehaviorForDevice(deviceType) {
  // Mobile devices tend to have quicker behavior
  if (deviceType === 'android' || deviceType === 'iOS') {
    const mobileBehaviors = [
      mobileQuickSwiper,
      quickResearcher,
      priceChecker,
      reviewReader
    ];
    return mobileBehaviors[Math.floor(Math.random() * mobileBehaviors.length)];
  }
  
  // Desktop devices can have more complex behaviors
  const desktopBehaviors = [
    detailedBrowser,
    priceChecker,
    reviewReader,
    productComparer,
    formFiller
  ];
  return desktopBehaviors[Math.floor(Math.random() * desktopBehaviors.length)];
}

module.exports = {
  quickResearcher,
  detailedBrowser,
  priceChecker,
  reviewReader,
  productComparer,
  mobileQuickSwiper,
  formFiller,
  getRandomBehavior,
  getBehaviorForDevice
};

