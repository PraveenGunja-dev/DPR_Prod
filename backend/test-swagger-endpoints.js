// Test based on Swagger documentation
require('dotenv').config();

const axios = require('axios');

const baseUrl = 'https://sin1.p6.oraclecloud.com/adani/stage/p6ws/restapi';
const token = 'eyJ4NXQjUzI1NiI6IlV6LU1BTlgyS0VncEFpb2I3cEVwQlZWSmtZSzFvV2FRczBacHhMbDI5NWciLCJ4NXQiOiJGNmE4X1lJMENCTEI3LVpkd3RWNjM5bXFqZ0kiLCJraWQiOiJTSUdOSU5HX0tFWSIsImFsZyI6IlJTMjU2In0.eyJjbGllbnRfb2NpZCI6Im9jaWQxLmRvbWFpbmFwcC5vYzEuYXAtbXVtYmFpLTEuYW1hYWFhYWFhcXRwNWJhYTVnaHlqbG92NnJ5d25zYzdta2w2d2ZybTd3cXJiNm9heXh1M3UzZWVsNWFxIiwidXNlcl90eiI6IkFzaWEvS29sa2F0YSIsInN1YiI6ImFnZWwuZm9yZWNhc3RpbmdAYWRhbmkuY29tIiwidXNlcl9sb2NhbGUiOiJlbiIsInNpZGxlIjo0ODAsInVzZXIudGVuYW50Lm5hbWUiOiJpZGNzLWQyYWE5Y2U2MDFjZDQ4NGFhZTQzNGY4YTJmMDBhMTQ3IiwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS5vcmFjbGVjbG91ZC5jb20vIiwiZG9tYWluX2hvbWUiOiJhcC1tdW1iYWktMSIsImNhX29jaWQiOiJvY2lkMS50ZW5hbmN5Lm9jMS4uYWFhYWFhYWFrejRrZnl3cGVjc3h3dHBqc2tiZ2d5ZGNuNzdidGp2cmpocWVhaGJ5dGZ3dWczeXBnamJxIiwidXNlcl90ZW5hbnRuYW1lIjoiaWRjcy1kMmFhOWNlNjAxY2Q0ODRhYWU0MzRmOGEyZjAwYTE0NyIsImNsaWVudF9pZCI6IlByaW1hdmVyYVdUU1NfQWRhbmlfU3RhZ2VfQVBQSUQiLCJkb21haW5faWQiOiJvY2lkMS5kb21haW4ub2MxLi5hYWFhYWFhYTRsejVldWQ1bWc2dm82eGdqbG5lNWptbHMzb2x6NjZmZnQ3anRjd2dnYnRsM3RzNnloc3EiLCJzdWJfdHlwZSI6InVzZXIiLCJzY29wZSI6InVybjpvcGM6aWRtOnQuc2VjdXJpdHkuY2xpZW50IHVybjpvcGM6aWRtOnQudXNlci5hdXRobi5mYWN0b3JzIiwidXNlcl9vY2lkIjoib2NpZDEudXNlci5vYzEuLmFhYWFhYWFhdmQ3MnVkNm5maHg1dW4zMmdndnRhM2RibWlwNTJsYTZ4NnJnZmE0bW1yeGZ4bnJ5dGVncSIsImNsaWVudF90ZW5hbnRuYW1lIjoiaWRjcy1kMmFhOWNlNjAxY2Q0ODRhYWU0MzRmOGEyZjAwYTE0NyIsInJlZ2lvbl9uYW1lIjoiYXAtbXVtYmFpLWlkY3MtMSIsInVzZXJfbGFuZyI6ImVuIiwidXNlckFwcFJvbGVzIjpbIkF1dGhlbnRpY2F0ZWQiXSwiZXhwIjoxNzY2Njc4Nzg1LCJpYXQiOjE3NjY2NDI3ODUsImNsaWVudF9ndWlkIjoiODMxYjBjZTYzYTE5NDk0NmI3MjFiOTYxYjdiZTEyNmYiLCJjbGllbnRfbmFtZSI6IlByaW1hdmVyYVdUU1NfQWRhbmlfU3RhZ2UiLCJ0ZW5hbnQiOiJpZGNzLWQyYWE5Y2U2MDFjZDQ4NGFhZTQzNGY4YTJmMDBhMTQ3IiwianRpIjoiZTYyZjBhMzdmN2I2NDFjOTk3YmRiNmI2YzUxZmNlMzgiLCJndHAiOiJybyIsInVzZXJfZGlzcGxheW5hbWUiOiJBZ2VsIGZvcmNhc3RpbmciLCJvcGMiOnRydWUsInN1Yl9tYXBwaW5nYXR0ciI6InVzZXJOYW1lIiwicHJpbVRlbmFudCI6dHJ1ZSwidG9rX3R5cGUiOiJBVCIsImF1ZCI6WyJ1cm46b3BjOmxiYWFzOmxvZ2ljYWxndWlkPWlkY3MtZDJhYTljZTYwMWNkNDg0YWFlNDM0ZjhhMmYwMGExNDciLCJodHRwczovL2lkY3MtZDJhYTljZTYwMWNkNDg0YWFlNDM0ZjhhMmYwMGExNDcuYXAtbXVtYmFpLWlkY3MtMS5zZWN1cmUuaWRlbnRpdHkub3JhY2xlY2xvdWQuY29tIiwiaHR0cHM6Ly9pZGNzLWQyYWE5Y2U2MDFjZDQ4NGFhZTQzNGY4YTJmMDBhMTQ3LmlkZW50aXR5Lm9yYWNsZWNsb3VkLmNvbSJdLCJjYV9uYW1lIjoiYWRhbmkiLCJzdHUiOiJQUklNQVZFUkEiLCJ1c2VyX2lkIjoiYjA2ZGZkMWUwZTIxNDYwNWE1MDA5YzE5ZmI5NThkMmEiLCJkb21haW4iOiJEZWZhdWx0IiwiY2xpZW50QXBwUm9sZXMiOlsiVXNlciBWaWV3ZXIiLCJBdXRoZW50aWNhdGVkIENsaWVudCIsIkNsb3VkIEdhdGUiXSwidGVuYW50X2lzcyI6Imh0dHBzOi8vaWRjcy1kMmFhOWNlNjAxY2Q0ODRhYWU0MzRmOGEyZjAwYTE0Ny5pZGVudGl0eS5vcmFjbGVjbG91ZC5jb206NDQzIn0.di4pkFvxg-F_QMfnqCSwIvdQ7kNljaDGi6IzOf2wJsMVpaIOLg05zg30c2t3uz2SLur-24AMx8jEgquoyQbAYz-Zw5hn_loNgRPMChvTFAJmuo_GCnNHXzItEfRmgssmYj-M-z0xnCPSI6Vexc4OfXNP2KUOLZNL8Mfqt2Slp9rcWhizHosWHdStiZNXalYpg-P0UU1fs3Gbn8YAI80vRlTLtgKK-qzGYQuogvloqeOodZ38g-_A46hWZIspp6HDR2GZ3Scyz6MflPRz15ex1cptsAAibP2mD7zUs49SjPkZeJa-lBrTLoj4C7G-Tq3fdPdN7bgRwZcmX2Bs0_liKg';

const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
};

async function testEndpoint(name, endpoint, params = {}) {
    try {
        console.log(`\n=== Testing ${name} ===`);
        console.log(`Endpoint: ${endpoint}`);
        const response = await axios.get(`${baseUrl}${endpoint}`, {
            headers,
            params,
            timeout: 15000
        });
        console.log(`✓ SUCCESS! Status: ${response.status}`);
        console.log(`Data count: ${Array.isArray(response.data) ? response.data.length : 'object'}`);
        if (Array.isArray(response.data) && response.data.length > 0) {
            console.log('Sample:', JSON.stringify(response.data[0], null, 2));
        } else if (response.data) {
            console.log('Data:', JSON.stringify(response.data).substring(0, 500));
        }
        return response.data;
    } catch (error) {
        console.log(`✗ FAILED: ${error.response?.status || error.message}`);
        if (error.response?.data) {
            console.log('Error data:', JSON.stringify(error.response.data).substring(0, 200));
        }
        return null;
    }
}

(async () => {
    // 1. Test UDFType - get available UDF definitions for Activity subject area
    const udfTypes = await testEndpoint(
        'UDFType (Activity Subject Area)',
        '/udftype',
        {
            Fields: 'ObjectId,Title,SubjectArea,DataType',
            Filter: "SubjectArea = 'Activity'"
        }
    );

    // 2. Test UDFValue - get UDF values 
    await testEndpoint(
        'UDFValue (no filter)',
        '/udfvalue',
        {
            Fields: 'ObjectId,ForeignObjectId,UDFTypeObjectId,Text,Double,Integer'
        }
    );

    // 3. Test UDFCode - get UDF code definitions
    await testEndpoint(
        'UDFCode',
        '/udfcode',
        {
            Fields: 'ObjectId,CodeValue,Description,UDFTypeObjectId'
        }
    );

    // 4. Test UnitOfMeasure
    await testEndpoint(
        'UnitOfMeasure',
        '/unitofmeasure',
        {
            Fields: 'ObjectId,Name,Abbreviation'
        }
    );

    // 5. If UDFType worked, try to get UDF values for those types
    if (udfTypes && udfTypes.length > 0) {
        console.log('\n\n=== UDF Types Found for Activity ===');
        udfTypes.forEach(t => {
            console.log(`  - ${t.Title} (Type: ${t.DataType}, ID: ${t.ObjectId})`);
        });
    }
})();
