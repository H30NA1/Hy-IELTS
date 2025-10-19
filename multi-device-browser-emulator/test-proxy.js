/**
 * Test Proxy Connections
 * Quick script to test proxies from GitHub sources
 */

const puppeteer = require('puppeteer');
const { getAllProxies } = require('./config/proxies');
const { fetchHTTPProxies } = require('./utils/proxy-fetcher');

async function testProxy(proxy) {
  const displayName = proxy.source ? proxy.source : proxy.country;
  process.stdout.write(`Testing ${displayName.padEnd(20)} ${proxy.ip}:${proxy.port.toString().padEnd(6)} ... `);
  
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
    
    const startTime = Date.now();
    await page.goto('https://www.google.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    const duration = Date.now() - startTime;

    await browser.close();
    
    console.log(`✓ WORKING (${duration}ms)`);
    return { ...proxy, working: true, responseTime: duration };
  } catch (error) {
    console.log(`✗ FAILED (${error.message.substring(0, 30)})`);
    return { ...proxy, working: false };
  }
}

async function testAllProxies(useLive = true) {
  console.log('\n' + '═'.repeat(80));
  console.log('🔍 TESTING PROXIES');
  console.log('═'.repeat(80) + '\n');

  let proxies;
  
  if (useLive) {
    console.log('Fetching live proxies from GitHub (TheSpeedX & Proxifly)...\n');
    proxies = await fetchHTTPProxies();
    console.log(`Testing first 30 proxies from ${proxies.length} total...\n`);
    proxies = proxies.slice(0, 30); // Test first 30
  } else {
    console.log('Using built-in proxy list...\n');
    proxies = getAllProxies();
  }

  const results = [];
  
  for (const proxy of proxies) {
    const result = await testProxy(proxy);
    results.push(result);
  }

  const working = results.filter(r => r.working);
  const failed = results.filter(r => !r.working);

  console.log('\n' + '═'.repeat(80));
  console.log('📊 RESULTS');
  console.log('═'.repeat(80));
  console.log(`✓ Working: ${working.length}`);
  console.log(`✗ Failed:  ${failed.length}`);
  console.log(`Success Rate: ${((working.length / results.length) * 100).toFixed(1)}%`);

  if (working.length > 0) {
    console.log('\n✓ Working Proxies:');
    working.forEach(p => {
      const source = p.source || p.country;
      console.log(`  - ${source.padEnd(20)} ${p.ip}:${p.port} (${p.responseTime}ms)`);
    });
  }

  console.log('\n' + '═'.repeat(80) + '\n');
  
  if (working.length === 0) {
    console.log('⚠️  WARNING: No working proxies found!');
    console.log('   The system will use DIRECT CONNECTION (no proxy)\n');
  } else {
    console.log(`✓ ${working.length} working proxies available!`);
    console.log('  The system will use these and fallback to direct if they fail.\n');
  }
}

// Check command line args
const args = process.argv.slice(2);
const useLive = !args.includes('--builtin');

if (args.includes('--help')) {
  console.log(`
Proxy Tester
============

Usage: npm run test-proxy [options]

Options:
  --builtin    Test built-in proxies only
  (default)    Test live proxies from GitHub

Examples:
  npm run test-proxy              # Test live GitHub proxies
  npm run test-proxy --builtin    # Test built-in proxies
  `);
} else {
  testAllProxies(useLive).catch(console.error);
}

