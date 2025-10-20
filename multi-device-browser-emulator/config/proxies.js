/**
 * Public Proxy/IP Configuration
 * Curated list of public proxies from various countries
 * NOTE: These are example IPs. For production, fetch from GitHub proxy lists or proxy services
 */

const publicProxies = {
  // North America
  usa: [
    { ip: '45.76.96.192',     port: 8080,  country: 'USA', city: 'New York' },
    { ip: '104.238.96.204',   port: 3128,  country: 'USA', city: 'Los Angeles' },
    { ip: '199.195.250.222',  port: 8080,  country: 'USA', city: 'Chicago' },
    { ip: '23.94.94.186',     port: 80,    country: 'USA', city: 'Miami' },
    { ip: '167.99.221.124',   port: 8080,  country: 'USA', city: 'San Francisco' }
  ],
  canada: [
    { ip: '142.93.240.84',    port: 8080,  country: 'Canada', city: 'Toronto' },
    { ip: '159.203.44.177',   port: 3128,  country: 'Canada', city: 'Vancouver' }
  ],

  // Europe
  uk: [
    { ip: '51.38.71.0',       port: 8080,  country: 'UK', city: 'London' },
    { ip: '178.62.73.148',    port: 8080,  country: 'UK', city: 'Manchester' }
  ],
  germany: [
    { ip: '5.189.184.6',      port: 3128,  country: 'Germany', city: 'Berlin' },
    { ip: '167.172.180.40',   port: 8080,  country: 'Germany', city: 'Frankfurt' }
  ],
  france: [
    { ip: '51.159.4.98',      port: 8080,  country: 'France', city: 'Paris' },
    { ip: '163.172.157.7',    port: 80,    country: 'France', city: 'Lyon' }
  ],
  netherlands: [
    { ip: '185.205.199.0',    port: 8080,  country: 'Netherlands', city: 'Amsterdam' },
    { ip: '45.76.162.103',    port: 3128,  country: 'Netherlands', city: 'Rotterdam' }
  ],

  // Asia
  japan: [
    { ip: '103.216.50.225',   port: 8080,  country: 'Japan', city: 'Tokyo' },
    { ip: '160.16.56.24',     port: 3128,  country: 'Japan', city: 'Osaka' }
  ],
  singapore: [
    { ip: '206.189.44.99',    port: 8080,  country: 'Singapore', city: 'Singapore' },
    { ip: '165.22.246.185',   port: 3128,  country: 'Singapore', city: 'Singapore' }
  ],
  china: [
    { ip: '124.156.100.83',   port: 8080,  country: 'China', city: 'Beijing' },
    { ip: '121.40.162.48',    port: 80,    country: 'China', city: 'Shanghai' }
  ],
  india: [
    { ip: '103.156.249.34',   port: 8080,  country: 'India', city: 'Mumbai' },
    { ip: '103.148.72.126',   port: 80,    country: 'India', city: 'Bangalore' }
  ],
  southKorea: [
    { ip: '175.213.188.28',   port: 8080,  country: 'South Korea', city: 'Seoul' },
    { ip: '220.116.76.236',   port: 3128,  country: 'South Korea', city: 'Busan' }
  ],

  // Australia & Oceania
  australia: [
    { ip: '45.248.77.237',    port: 8080,  country: 'Australia', city: 'Sydney' },
    { ip: '103.216.82.22',    port: 6666,  country: 'Australia', city: 'Melbourne' }
  ],

  // South America
  brazil: [
    { ip: '191.252.178.3',    port: 80,    country: 'Brazil', city: 'São Paulo' },
    { ip: '200.155.139.242',  port: 3128,  country: 'Brazil', city: 'Rio de Janeiro' }
  ],
  argentina: [
    { ip: '181.129.74.58',    port: 80,    country: 'Argentina', city: 'Buenos Aires' }
  ],

  // Africa
  southAfrica: [
    { ip: '197.189.224.52',   port: 8080,  country: 'South Africa', city: 'Johannesburg' },
    { ip: '41.60.233.158',    port: 80,    country: 'South Africa', city: 'Cape Town' }
  ]
};

/**
 * GitHub proxy list URLs (for live fetching)
 */
const proxyListUrls = [
  'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
  'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt'
];

/**
 * Get a random proxy from a specific country
 */
function getRandomProxy(country = null) {
  if (country && publicProxies[country]) {
    const proxies     = publicProxies[country];
    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
    return randomProxy;
  }
  
  // Get random from all proxies
  const allCountries = Object.keys(publicProxies);
  const randomCountry = allCountries[Math.floor(Math.random() * allCountries.length)];
  return getRandomProxy(randomCountry);
}

/**
 * Get all proxies
 */
function getAllProxies() {
  const allProxies = [];
  for (const proxies of Object.values(publicProxies)) {
    allProxies.push(...proxies);
  }
  return allProxies;
}

/**
 * Format proxy for Puppeteer
 */
function formatProxyUrl(proxy) {
  return `http://${proxy.ip}:${proxy.port}`;
}

module.exports = {
  publicProxies,
  proxyListUrls,
  getRandomProxy,
  getAllProxies,
  formatProxyUrl
};

