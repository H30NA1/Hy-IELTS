const axios = require('axios');

// Custom Proxy API Configuration
const CUSTOM_API = {
  url: 'https://traffic-api.longtu.club/webhook/proxy/get-proxy',
  apiKey: '#!6f1!0#aa77%@G$%8262x4AaD460c*3TExbqS9@0fPHF2F&$9m9$0Z!!^468J72W',
  headerName: 'api-key'  // Change this if needed (API-Key, x-api-key, Authorization, etc.)
};

/**
 * Fetch proxies from custom API
 */
async function fetchCustomProxies() {
  try {
    console.log('📡 Fetching proxies from custom API...');
    console.log(`   URL: ${CUSTOM_API.url}\n`);
    
    const response = await axios.get(CUSTOM_API.url, {
      headers: {
        [CUSTOM_API.headerName]: CUSTOM_API.apiKey
      },
      timeout: 15000
    });

    // Parse response - adjust this based on actual API response format
    const proxies = parseCustomAPIResponse(response.data);
    
    if (proxies.length > 0) {
      console.log(`✅ Successfully fetched ${proxies.length} proxies from custom API\n`);
      return proxies;
    } else {
      console.log('⚠️  Custom API returned no proxies\n');
      return [];
    }
    
  } catch (error) {
    console.log('❌ Failed to fetch from custom API');
    console.log(`   Error: ${error.response?.status} - ${error.response?.data?.message || error.message}\n`);
    return [];
  }
}

/**
 * Parse custom API response
 * Adjust this function based on your API's response format
 */
function parseCustomAPIResponse(data) {
  const proxies = [];
  
  // Example formats - adjust based on actual response:
  
  // Format 1: Array of objects { ip, port, country }
  if (Array.isArray(data)) {
    return data.map(proxy => ({
      ip: proxy.ip || proxy.host,
      port: parseInt(proxy.port),
      country: proxy.country || proxy.location || 'Unknown',
      username: proxy.username || null,
      password: proxy.password || null,
      source: 'custom-api'
    }));
  }
  
  // Format 2: Object with proxies array
  if (data.proxies && Array.isArray(data.proxies)) {
    return data.proxies.map(proxy => ({
      ip: proxy.ip || proxy.host,
      port: parseInt(proxy.port),
      country: proxy.country || proxy.location || 'Unknown',
      username: proxy.username || null,
      password: proxy.password || null,
      source: 'custom-api'
    }));
  }
  
  // Format 3: Object with data.proxies
  if (data.data && data.data.proxies && Array.isArray(data.data.proxies)) {
    return data.data.proxies.map(proxy => ({
      ip: proxy.ip || proxy.host,
      port: parseInt(proxy.port),
      country: proxy.country || proxy.location || 'Unknown',
      username: proxy.username || null,
      password: proxy.password || null,
      source: 'custom-api'
    }));
  }
  
  // Format 4: Single proxy object
  if (data.ip && data.port) {
    return [{
      ip: data.ip,
      port: parseInt(data.port),
      country: data.country || data.location || 'Unknown',
      username: data.username || null,
      password: data.password || null,
      source: 'custom-api'
    }];
  }
  
  // Format 5: String format "ip:port" (one per line)
  if (typeof data === 'string') {
    const lines = data.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const [ip, port] = line.trim().split(':');
      return {
        ip: ip,
        port: parseInt(port),
        country: 'Unknown',
        source: 'custom-api'
      };
    });
  }
  
  console.warn('⚠️  Unknown API response format:');
  console.warn(JSON.stringify(data, null, 2));
  return [];
}

/**
 * Test custom proxy API
 */
async function testCustomAPI() {
  console.log('🧪 Testing custom proxy API...\n');
  
  try {
    const proxies = await fetchCustomProxies();
    
    if (proxies.length > 0) {
      console.log('✅ API is working!');
      console.log(`   Found ${proxies.length} proxies\n`);
      console.log('Sample proxy:');
      console.log(`   ${proxies[0].ip}:${proxies[0].port} (${proxies[0].country})\n`);
      return true;
    } else {
      console.log('⚠️  API responded but no proxies found\n');
      return false;
    }
  } catch (error) {
    console.log('❌ API test failed\n');
    return false;
  }
}

module.exports = {
  fetchCustomProxies,
  testCustomAPI,
  CUSTOM_API
};

