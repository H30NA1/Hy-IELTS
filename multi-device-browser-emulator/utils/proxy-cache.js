const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../logs/working-proxies-cache.json');
const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour

/**
 * Load cached working proxies
 */
function loadCachedProxies() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    const now = Date.now();

    // Check if cache is still valid (less than 1 hour old)
    if (now - data.timestamp < CACHE_DURATION) {
      console.log(`💾 Found cached proxies (${data.proxies.length} proxies, ${Math.round((now - data.timestamp) / 60000)} min old)\n`);
      return data.proxies;
    } else {
      console.log('💾 Cache expired, fetching fresh proxies...\n');
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Save working proxies to cache
 */
function saveCachedProxies(proxies) {
  try {
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const data = {
      timestamp: Date.now(),
      proxies: proxies,
      count: proxies.length
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 Cached ${proxies.length} working proxies for next run\n`);
  } catch (error) {
    // Silent fail - caching is optional
  }
}

/**
 * Clear proxy cache
 */
function clearProxyCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log('🗑️  Proxy cache cleared\n');
    }
  } catch (error) {
    // Silent fail
  }
}

/**
 * Mark proxy as successful
 */
function markProxySuccess(proxy) {
  try {
    const successFile = path.join(__dirname, '../logs/proxy-success-rate.json');
    
    let stats = {};
    if (fs.existsSync(successFile)) {
      stats = JSON.parse(fs.readFileSync(successFile, 'utf8'));
    }

    const key = `${proxy.ip}:${proxy.port}`;
    if (!stats[key]) {
      stats[key] = { successes: 0, failures: 0, lastSuccess: null };
    }

    stats[key].successes++;
    stats[key].lastSuccess = Date.now();

    fs.writeFileSync(successFile, JSON.stringify(stats, null, 2));
  } catch (error) {
    // Silent fail
  }
}

/**
 * Mark proxy as failed
 */
function markProxyFailure(proxy) {
  try {
    const successFile = path.join(__dirname, '../logs/proxy-success-rate.json');
    
    let stats = {};
    if (fs.existsSync(successFile)) {
      stats = JSON.parse(fs.readFileSync(successFile, 'utf8'));
    }

    const key = `${proxy.ip}:${proxy.port}`;
    if (!stats[key]) {
      stats[key] = { successes: 0, failures: 0, lastSuccess: null };
    }

    stats[key].failures++;

    fs.writeFileSync(successFile, JSON.stringify(stats, null, 2));
  } catch (error) {
    // Silent fail
  }
}

/**
 * Get best performing proxies
 */
function getBestProxies(proxies) {
  try {
    const successFile = path.join(__dirname, '../logs/proxy-success-rate.json');
    
    if (!fs.existsSync(successFile)) {
      return proxies;
    }

    const stats = JSON.parse(fs.readFileSync(successFile, 'utf8'));

    // Sort proxies by success rate
    const sortedProxies = proxies.sort((a, b) => {
      const keyA = `${a.ip}:${a.port}`;
      const keyB = `${b.ip}:${b.port}`;

      const statsA = stats[keyA] || { successes: 0, failures: 0 };
      const statsB = stats[keyB] || { successes: 0, failures: 0 };

      const rateA = statsA.successes / Math.max(1, statsA.successes + statsA.failures);
      const rateB = statsB.successes / Math.max(1, statsB.successes + statsB.failures);

      return rateB - rateA;
    });

    return sortedProxies;
  } catch (error) {
    return proxies;
  }
}

module.exports = {
  loadCachedProxies,
  saveCachedProxies,
  clearProxyCache,
  markProxySuccess,
  markProxyFailure,
  getBestProxies
};

