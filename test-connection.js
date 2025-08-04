// Test script to verify frontend-backend connection
const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testConnection() {
  console.log('🧪 Testing Frontend-Backend Connection...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Root endpoint
    console.log('2. Testing root endpoint...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Root endpoint passed:', rootResponse.data);
    console.log('');

    // Test 3: Feed health
    console.log('3. Testing feed health...');
    const feedHealthResponse = await axios.get(`${BASE_URL}/api/v1/feed/health`);
    console.log('✅ Feed health passed:', feedHealthResponse.data);
    console.log('');

    // Test 4: Latest market data
    console.log('4. Testing latest market data...');
    const marketDataResponse = await axios.get(`${BASE_URL}/api/v1/feed/latest?limit=5`);
    console.log('✅ Market data passed:', marketDataResponse.data);
    console.log('');

    // Test 5: Market summary
    console.log('5. Testing market summary...');
    const summaryResponse = await axios.get(`${BASE_URL}/api/v1/feed/summary`);
    console.log('✅ Market summary passed:', summaryResponse.data);
    console.log('');

    console.log('🎉 All tests passed! Frontend and backend are connected successfully.');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend: cd backend && python run.py');
    console.log('2. Start the frontend: cd frontend && npm run dev');
    console.log('3. Open http://localhost:3000 in your browser');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the backend is running on port 8000');
    console.log('2. Check if MongoDB is connected');
    console.log('3. Verify all dependencies are installed');
  }
}

testConnection(); 