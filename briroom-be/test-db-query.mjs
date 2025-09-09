import axios from 'axios';

console.log('Testing database query directly...');

try {
  // Test: Check if we can get any requests at all
  console.log('1. Testing public requests endpoint...');
  const publicResponse = await axios.get('http://localhost:5001/api/requests/public');
  console.log('✅ Public requests successful');
  console.log('📊 Requests count:', publicResponse.data.data.latestRequests?.length || 0);

  // Test: Check if we can get room requests
  console.log('2. Testing room requests endpoint...');
  const roomResponse = await axios.get('http://localhost:5001/api/requests/room-requests');
  console.log('✅ Room requests successful');
  console.log('📊 Requests count:', roomResponse.data.data?.length || 0);

} catch (error) {
  console.error('❌ Test failed:', error.message);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  }
}

console.log('Test completed');

