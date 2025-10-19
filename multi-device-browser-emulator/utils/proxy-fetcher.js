/**
 * Proxy Fetcher
 * Fetches live proxy lists from GitHub repositories
 * Sources: TheSpeedX/PROXY-List & Proxifly/free-proxy-list
 */

const axios = require('axios');

/**
 * Proxy sources from GitHub (updated frequently)
 */
const PROXY_SOURCES = {
  // TheSpeedX - Updated daily (44,650+ proxies)
  speedx_http: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
  
  // Proxifly - Updated every 5 minutes (HTTP only)
  proxifly_http: 'https://cdn.jsdelivr.net/gh/proxifly/free-proxy-list@main/proxies/protocols/http/data.txt',
  
  // ProxyScrape - Updated hourly (better quality)
  proxyscrape_http: 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
  
  // GeoNode - Updated daily (2000+ proxies)
  geonode: 'https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc&protocols=http%2Chttps',
  
  // Proxy-List.download - Updated daily
  proxylist_http: 'https://www.proxy-list.download/api/v1/get?type=http',
  
  // Free-Proxy-List.net - Updated every 10 minutes
  free_proxy_list: 'https://free-proxy-list.net/',
  
  // Spys.one - High quality proxies
  spys_one: 'https://spys.one/en/free-proxy-list/'
};

/**
 * Fetch proxies from a URL
 */
async function fetchProxiesFromUrl(url, source) {
  try {
    const response = await axios.get(url, { 
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = response.data;
    
    // Parse proxy list (format: IP:PORT)
    const lines = data.split('\n');
    const proxies = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
        const parts = trimmed.split(':');
        if (parts.length === 2) {
          const ip = parts[0].trim();
          const port = parseInt(parts[1].trim());
          
          // Basic validation
          if (ip && port && port > 0 && port < 65536) {
            proxies.push({
              ip,
              port,
              country: 'Various',
              source
            });
          }
        }
      }
    }
    
    return proxies;
  } catch (error) {
    console.error(`  ✗ Error fetching ${source}:`, error.message);
    return [];
  }
}

/**
 * Fetch proxies from all sources
 */
async function fetchAllProxies() {
  console.log('\n🌐 Fetching fresh proxies from GitHub...\n');
  console.log('Sources:');
  console.log('  • TheSpeedX/PROXY-List (Updated daily)');
  console.log('  • Proxifly/free-proxy-list (Updated every 5 minutes)\n');
  
  const allProxies = [];
  
  // Fetch from all sources
  for (const [name, url] of Object.entries(PROXY_SOURCES)) {
    process.stdout.write(`Fetching ${name}... `);
    const proxies = await fetchProxiesFromUrl(url, name);
    console.log(`✓ ${proxies.length} proxies`);
    allProxies.push(...proxies);
  }
  
  // Remove duplicates
  const uniqueProxies = Array.from(
    new Map(allProxies.map(p => [`${p.ip}:${p.port}`, p])).values()
  );
  
  console.log(`\n✓ Total unique proxies: ${uniqueProxies.length}`);
  console.log('  (These are fresh proxies from live GitHub repositories)\n');
  
  return uniqueProxies;
}

/**
 * Fetch HTTP proxies from multiple sources
 */
async function fetchHTTPProxies() {
  console.log('📡 Fetching from multiple proxy sources...\n');
  
  const sources = [
    { name: 'TheSpeedX', url: PROXY_SOURCES.speedx_http },
    { name: 'Proxifly', url: PROXY_SOURCES.proxifly_http },
    { name: 'ProxyScrape', url: PROXY_SOURCES.proxyscrape_http },
    { name: 'Proxy-List', url: PROXY_SOURCES.proxylist_http }
  ];

  const allProxies = [];

  for (const source of sources) {
    try {
      const proxies = await fetchProxiesFromUrl(source.url, source.name);
      if (proxies.length > 0) {
        console.log(`  ✓ ${source.name}: ${proxies.length} proxies`);
        allProxies.push(...proxies);
      }
    } catch (error) {
      console.log(`  ✗ ${source.name}: Failed`);
    }
  }

  // Try GeoNode (special format)
  try {
    const geoProxies = await fetchGeoNodeProxies();
    if (geoProxies.length > 0) {
      console.log(`  ✓ GeoNode: ${geoProxies.length} proxies`);
      allProxies.push(...geoProxies);
    }
  } catch (error) {
    console.log(`  ✗ GeoNode: Failed`);
  }

  console.log('');

  // Remove duplicates
  const uniqueProxies = Array.from(
    new Map(allProxies.map(p => [`${p.ip}:${p.port}`, p])).values()
  );

  return uniqueProxies;
}

/**
 * Fetch proxies from GeoNode API (special format)
 */
async function fetchGeoNodeProxies() {
  try {
    const response = await axios.get('https://proxylist.geonode.com/api/proxy-list', {
      params: {
        limit: 500,
        page: 1,
        sort_by: 'lastChecked',
        sort_type: 'desc',
        protocols: 'http,https'
      },
      timeout: 15000
    });

    if (response.data && response.data.data) {
      return response.data.data.map(proxy => ({
        ip: proxy.ip,
        port: proxy.port,
        country: proxy.country,
        source: 'geonode'
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Test if a proxy is working
 */
async function testProxy(proxy, timeout = 5000) {
  try {
    const response = await axios.get('http://httpbin.org/ip', {
      proxy: {
        host: proxy.ip,
        port: proxy.port
      },
      timeout
    });
    
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Get working proxies (test with actual HTTP requests - more accurate)
 */
async function getWorkingProxies(proxies, testCount = 100) {
  const toTest = proxies.slice(0, testCount);
  const workingProxies = [];
  
  console.log(`Testing ${toTest.length} proxies with HTTP requests (batches of 5)...\n`);
  
  // Test in smaller batches (5) because we're making actual HTTP requests
  const batchSize = 5;
  let tested = 0;
  
  for (let i = 0; i < toTest.length; i += batchSize) {
    const batch = toTest.slice(i, i + batchSize);
    
    // Test batch in parallel with actual HTTP requests
    const results = await Promise.all(
      batch.map(async (proxy) => {
        const isWorking = await testProxyHTTP(proxy);
        return isWorking ? proxy : null;
      })
    );
    
    // Add working proxies
    results.forEach(proxy => {
      if (proxy) workingProxies.push(proxy);
    });
    
    tested += batch.length;
    process.stdout.write(`\rTested: ${tested}/${toTest.length} | Working: ${workingProxies.length}`);
  }
  
  console.log(`\n`);
  return workingProxies;
}

/**
 * Test proxy with actual HTTP request (more accurate than TCP test)
 */
async function testProxyHTTP(proxy, timeout = 8000) {
  try {
    const response = await axios.get('http://www.google.com', {
      proxy: {
        host: proxy.ip,
        port: parseInt(proxy.port)
      },
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // Check if we actually got a response
    return response.status === 200 && response.data.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Quick test proxy with Puppeteer (more accurate)
 */
async function quickTestProxy(proxy) {
  const puppeteer = require('puppeteer');
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--proxy-server=http://${proxy.ip}:${proxy.port}`
      ]
    });
    
    const page = await browser.newPage();
    await page.goto('http://www.google.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    await browser.close();
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  fetchProxiesFromUrl,
  fetchAllProxies,
  fetchHTTPProxies,
  testProxy,
  getWorkingProxies,
  PROXY_SOURCES
};

