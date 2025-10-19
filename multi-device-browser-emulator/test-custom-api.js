const axios = require('axios');

const API_KEY = '#!6f1!0#aa77%@G$%8262x4AaD460c*3TExbqS9@0fPHF2F&$9m9$0Z!!^468J72W';
const API_URL = 'https://traffic-api.longtu.club/webhook/proxy/get-proxy';

async function testWithHeaders(headerName, headerValue) {
  try {
    console.log(`\nTrying with header: ${headerName}`);
    
    const response = await axios.get(API_URL, {
      headers: {
        [headerName]: headerValue
      },
      timeout: 10000
    });

    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCustomProxyAPI() {
  console.log('Testing custom proxy API with different header formats...\n');
  console.log('API URL:', API_URL);
  console.log('API Key:', API_KEY.substring(0, 20) + '...');
  
  // Try different header variations
  const variations = [
    ['api-key', API_KEY],
    ['API-Key', API_KEY],
    ['Api-Key', API_KEY],
    ['x-api-key', API_KEY],
    ['X-API-Key', API_KEY],
    ['Authorization', API_KEY],
    ['Authorization', `Bearer ${API_KEY}`],
    ['Authorization', `ApiKey ${API_KEY}`],
  ];

  for (const [headerName, headerValue] of variations) {
    const success = await testWithHeaders(headerName, headerValue);
    if (success) {
      console.log('\n🎉 Found working header format!');
      break;
    }
  }
}

testCustomProxyAPI();

