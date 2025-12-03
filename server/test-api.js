const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing DPR Supervisor API endpoints...');
    
    // Test 1: Try to get a draft entry without authentication (should fail)
    console.log('\n1. Testing unauthorized access to draft endpoint...');
    try {
      await axios.get('http://localhost:3000/dpr-supervisor/draft?projectId=1&sheetType=dp_qty');
      console.log('  UNEXPECTED: Request succeeded without authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('  EXPECTED: Request failed with 401 Unauthorized');
      } else {
        console.log('  UNEXPECTED: Request failed with different error:', error.message);
      }
    }
    
    // Test 2: Login to get a token
    console.log('\n2. Testing login to get authentication token...');
    try {
      const loginResponse = await axios.post('http://localhost:3000/login', {
        email: 'supervisor@adani.com',
        password: 'admin123'
      });
      
      const token = loginResponse.data.token;
      console.log('  SUCCESS: Got authentication token');
      
      // Test 3: Get a draft entry with authentication
      console.log('\n3. Testing authorized access to draft endpoint...');
      try {
        const draftResponse = await axios.get(
          'http://localhost:3000/dpr-supervisor/draft?projectId=1&sheetType=dp_qty',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('  SUCCESS: Got draft entry');
        console.log('  Entry ID:', draftResponse.data.id);
        console.log('  Status:', draftResponse.data.status);
        console.log('  Sheet Type:', draftResponse.data.sheet_type);
        
        // Test 4: Save draft entry
        console.log('\n4. Testing save draft entry...');
        try {
          const saveResponse = await axios.post(
            'http://localhost:3000/dpr-supervisor/save-draft',
            {
              entryId: draftResponse.data.id,
              data: {
                rows: [
                  {
                    slNo: '1',
                    description: 'Test Activity',
                    totalQuantity: '100',
                    uom: 'units',
                    balance: '50',
                    basePlanStart: '2025-11-01',
                    basePlanFinish: '2025-11-30',
                    actualStart: '2025-11-05',
                    actualFinish: '',
                    forecastStart: '2025-11-05',
                    forecastFinish: '2025-11-25',
                    remarks: 'Test remarks',
                    cumulative: '50'
                  }
                ]
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          console.log('  SUCCESS: Draft entry saved');
          
          // Test 5: Submit entry
          console.log('\n5. Testing submit entry...');
          try {
            const submitResponse = await axios.post(
              'http://localhost:3000/dpr-supervisor/submit',
              {
                entryId: draftResponse.data.id
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            console.log('  SUCCESS: Entry submitted');
            console.log('  New status:', submitResponse.data.entry.status);
            
          } catch (error) {
            console.log('  ERROR: Failed to submit entry:', error.message);
          }
          
        } catch (error) {
          console.log('  ERROR: Failed to save draft entry:', error.message);
        }
        
      } catch (error) {
        console.log('  ERROR: Failed to get draft entry:', error.message);
      }
      
    } catch (error) {
      console.log('  ERROR: Login failed:', error.message);
    }
    
  } catch (error) {
    console.log('General error:', error.message);
  }
}

testAPI();