const axios = require('axios');

async function testPMAPI() {
  try {
    console.log('Testing PM API endpoints...\n');
    
    // First, login as PM to get a token
    console.log('1. Logging in as PM...');
    const loginResponse = await axios.post('http://localhost:3000/login', {
      email: 'pm@adani.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Login successful, token received\n');
    
    // Test getting entries for PM review
    console.log('2. Fetching entries for PM review...');
    const entriesResponse = await axios.get('http://localhost:3000/dpr-supervisor/pm/entries', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log(`✓ Found ${entriesResponse.data.length} entries`);
    console.log('\nEntries:');
    entriesResponse.data.forEach(entry => {
      console.log(`  - ID: ${entry.id}, Sheet: ${entry.sheet_type}, Status: ${entry.status}, Supervisor: ${entry.supervisor_name}`);
    });
    
    if (entriesResponse.data.length > 0) {
      console.log('\nSample entry data:');
      console.log(JSON.stringify(entriesResponse.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPMAPI();
