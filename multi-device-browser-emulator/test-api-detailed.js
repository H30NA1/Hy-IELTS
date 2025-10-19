const axios = require('axios');

const API_KEY = '#!6f1!0#aa77%@G$%8262x4AaD460c*3TExbqS9@0fPHF2F&$9m9$0Z!!^468J72W';
const API_URL = 'https://traffic-api.longtu.club/webhook/proxy/get-proxy';

async function testAPI() {
  console.log('🔍 Testing API with detailed debugging...\n');
  
  // Test 1: Try POST instead of GET
  console.log('Test 1: POST request with api-key header');
  try {
    const response = await axios.post(API_URL, {}, {
      headers: { 'api-key': API_KEY },
      timeout: 10000
    });
    console.log('✅ POST SUCCESS!');
    console.log(JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log(`❌ POST failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Test 2: Try with query parameter
  console.log('\nTest 2: GET with query parameter');
  try {
    const response = await axios.get(`${API_URL}?api-key=${encodeURIComponent(API_KEY)}`, {
      timeout: 10000
    });
    console.log('✅ Query param SUCCESS!');
    console.log(JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log(`❌ Query param failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Test 3: Try with api_key instead of api-key
  console.log('\nTest 3: GET with api_key header');
  try {
    const response = await axios.get(API_URL, {
      headers: { 'api_key': API_KEY },
      timeout: 10000
    });
    console.log('✅ api_key SUCCESS!');
    console.log(JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log(`❌ api_key failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Test 4: Try without any auth (maybe it's open?)
  console.log('\nTest 4: GET without authentication');
  try {
    const response = await axios.get(API_URL, { timeout: 10000 });
    console.log('✅ No auth SUCCESS!');
    console.log(JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log(`❌ No auth failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  // Test 5: Check if URL needs different endpoint
  console.log('\nTest 5: Try /get-proxy without webhook prefix');
  try {
    const response = await axios.get('https://traffic-api.longtu.club/get-proxy', {
      headers: { 'api-key': API_KEY },
      timeout: 10000
    });
    console.log('✅ Different endpoint SUCCESS!');
    console.log(JSON.stringify(response.data, null, 2));
    return;
  } catch (error) {
    console.log(`❌ Different endpoint failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }

  console.log('\n❌ All tests failed. Possible issues:');
  console.log('   1. API key is incorrect');
  console.log('   2. API endpoint URL is wrong');
  console.log('   3. API requires additional authentication');
  console.log('   4. Your IP is not whitelisted');
  console.log('\n💡 Please check:');
  console.log('   - Is the API key correct?');
  console.log('   - Is there API documentation?');
  console.log('   - Do you need to whitelist your IP?');
}

testAPI();

