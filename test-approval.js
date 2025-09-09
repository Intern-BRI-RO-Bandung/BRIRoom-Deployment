const axios = require('axios');

async function testApproval() {
  try {
    console.log('Testing approval API...');
    
    const response = await axios.patch('http://localhost:5001/api/requests/admin/4/approve', {
      zoom_link_manual: 'https://us04web.zo',
      zoom_meeting_id_manual: '123 456 789',
      zoom_passcode_manual: '123456',
      admin_notes: 'audit'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testApproval();
