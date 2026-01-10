// Direct UOM sync - uses Production URL since token is Production token
const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5431,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Prvn@3315',
});

// Fresh Production token from user (Jan 8, 2026)
const TOKEN = 'eyJ4NXQjUzI1NiI6IlV6LU1BTlgyS0VncEFpb2I3cEVwQlZWSmtZSzFvV2FRczBacHhMbDI5NWciLCJ4NXQiOiJGNmE4X1lJMENCTEI3LVpkd3RWNjM5bXFqZ0kiLCJraWQiOiJTSUdOSU5HX0tFWSIsImFsZyI6IlJTMjU2In0.eyJjbGllbnRfb2NpZCI6Im9jaWQxLmRvbWFpbmFwcC5vYzEuYXAtbXVtYmFpLTEuYW1hYWFhYWFhcXRwNWJhYWp3c2JicW9wa3cydXFxcG9jcm52YWl1YXdsdGl6bXkyZmNueDVlbG96Ym1hIiwidXNlcl90eiI6IkFzaWEvS29sa2F0YSIsInN1YiI6ImFnZWwuZm9yZWNhc3RpbmdAYWRhbmkuY29tIiwidXNlcl9sb2NhbGUiOiJlbiIsInNpZGxlIjo0ODAsInVzZXIudGVuYW50Lm5hbWUiOiJpZGNzLWQyYWE5Y2U2MDFjZDQ4NGFhZTQzNGY4YTJmMDBhMTQ3IiwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS5vcmFjbGVjbG91ZC5jb20vIiwiZG9tYWluX2hvbWUiOiJhcC1tdW1iYWktMSIsImNhX29jaWQiOiJvY2lkMS50ZW5hbmN5Lm9jMS4uYWFhYWFhYWFrejRrZnl3cGVjc3h3dHBqc2tiZ2d5ZGNuNzdidGp2cmpocWVhaGJ5dGZ3dWczeXBnamJxIiwidXNlcl90ZW5hbnRuYW1lIjoiaWRjcy1kMmFhOWNlNjAxY2Q0ODRhYWU0MzRmOGEyZjAwYTE0NyIsImNsaWVudF9pZCI6IlByaW1hdmVyYVdUU1NfQWRhbmlfUHJvZHVjdGlvbl9BUFBJRCIsImRvbWFpbl9pZCI6Im9jaWQxLmRvbWFpbi5vYzEuLmFhYWFhYWFhNGx6NWV1ZDVtZzZ2bzZ4Z2psbmU1am1sczNvbHo2NmZmdDdqdGN3Z2didGwzdHM2eWhzcSIsInN1Yl90eXBlIjoidXNlciIsInNjb3BlIjoidXJuOm9wYzppZG06dC5zZWN1cml0eS5jbGllbnQgdXJuOm9wYzppZG06dC51c2VyLmF1dGhuLmZhY3RvcnMiLCJ1c2VyX29jaWQiOiJvY2lkMS51c2VyLm9jMS4uYWFhYWFhYWF2ZDcydWQ2bmZoeDV1bjMyZ2d2dGEzZGJtaXA1MmxhNng2cmdmYTRtbXJ4Znhucnl0ZWdxIiwiY2xpZW50X3RlbmFudG5hbWUiOiJpZGNzLWQyYWE5Y2U2MDFjZDQ4NGFhZTQzNGY4YTJmMDBhMTQ3IiwicmVnaW9uX25hbWUiOiJhcC1tdW1iYWktaWRjcy0xIiwidXNlcl9sYW5nIjoiZW4iLCJ1c2VyQXBwUm9sZXMiOlsiQXV0aGVudGljYXRlZCJdLCJleHAiOjE3Njc4OTk2MjIsImlhdCI6MTc2Nzg2MzYyMiwiY2xpZW50X2d1aWQiOiI5ZDRkMDQ1NjUxYzA0OTgyOGI3NDFjZWYzNmM3M2UzZiIsImNsaWVudF9uYW1lIjoiUHJpbWF2ZXJhV1RTU19BZGFuaV9Qcm9kdWN0aW9uIiwidGVuYW50IjoiaWRjcy1kMmFhOWNlNjAxY2Q0ODRhYWU0MzRmOGEyZjAwYTE0NyIsImp0aSI6IjMwYzIxMTg5NDVhMzQ2NmI5Yjk3MWJhMWU3YWJiOTdhIiwiZ3RwIjoicm8iLCJ1c2VyX2Rpc3BsYXluYW1lIjoiQWdlbCBmb3JjYXN0aW5nIiwib3BjIjp0cnVlLCJzdWJfbWFwcGluZ2F0dHIiOiJ1c2VyTmFtZSIsInByaW1UZW5hbnQiOnRydWUsInRva190eXBlIjoiQVQiLCJhdWQiOlsidXJuOm9wYzpsYmFhczpsb2dpY2FsZ3VpZD1pZGNzLWQyYWE5Y2U2MDFjZDQ4NGFhZTQzNGY4YTJmMDBhMTQ3IiwiaHR0cHM6Ly9pZGNzLWQyYWE5Y2U2MDFjZDQ4NGFhZTQzNGY4YTJmMDBhMTQ3LmFwLW11bWJhaS1pZGNzLTEuc2VjdXJlLmlkZW50aXR5Lm9yYWNsZWNsb3VkLmNvbSIsImh0dHBzOi8vaWRjcy1kMmFhOWNlNjAxY2Q0ODRhYWU0MzRmOGEyZjAwYTE0Ny5pZGVudGl0eS5vcmFjbGVjbG91ZC5jb20iXSwiY2FfbmFtZSI6ImFkYW5pIiwic3R1IjoiUFJJTUFWRVJBIiwidXNlcl9pZCI6ImIwNmRmZDFlMGUyMTQ2MDVhNTAwOWMxOWZiOTU4ZDJhIiwiZG9tYWluIjoiRGVmYXVsdCIsImNsaWVudEFwcFJvbGVzIjpbIlVzZXIgVmlld2VyIiwiQXV0aGVudGljYXRlZCBDbGllbnQiLCJDbG91ZCBHYXRlIl0sInRlbmFudF9pc3MiOiJodHRwczovL2lkY3MtZDJhYTljZTYwMWNkNDg0YWFlNDM0ZjhhMmYwMGExNDcuaWRlbnRpdHkub3JhY2xlY2xvdWQuY29tOjQ0MyJ9.Bb76PBEQOQgLxyyXfgyan9hlJy0_Bpxo854OKCHjkcFArWlcp0pmDX2n_q9ytPWC2CDH6Y8R-Pq9pwbKt5ysz3vJUeSI8v4lFy2Rvw1etRMZkA_2ib5aqXHVr1iM0wdoGeRumSv8URb3wR5nt2ANQOLJTQHUi-_ZIhhDmgee15PLBWn0kjbounJT2bIQxQgqK4YEMAIf3Cs9Nix5nl-xN7-5eHR7JRp73dxIYTOKi8caSoE4fqC7fQ9T5qYa5fChGZj88B9i8FNBMzfZoOsvuxSHJSaP4-6SznTmsCaghOxd4FHXt3NL2GQr2_ymJzzVTQCvXof2TojNKebqLBV5-w';

// Try both Stage and Production URLs
const URLS = {
    stage: 'https://sin1.p6.oraclecloud.com/adani/stage/p6ws/restapi/unitOfMeasure',
    production: 'https://sin1.p6.oraclecloud.com/adani/p6ws/restapi/unitOfMeasure'
};

async function syncUOM() {
    console.log('Direct UOM sync with fresh Production token...\n');

    for (const [env, url] of Object.entries(URLS)) {
        console.log(`Trying ${env}: ${url}`);
        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Accept': 'application/json'
                },
                params: { Fields: 'ObjectId,Name' },
                timeout: 30000
            });

            const uomList = response.data;
            console.log(`✓ ${env} SUCCESS! Got ${uomList.length} UOM records\n`);

            // Insert into database
            let count = 0;
            for (const uom of uomList) {
                await pool.query(`
          INSERT INTO p6_unit_of_measures ("objectId", "name", "lastSyncAt")
          VALUES ($1, $2, NOW())
          ON CONFLICT ("objectId") DO UPDATE SET
            "name" = EXCLUDED."name",
            "lastSyncAt" = NOW()
        `, [parseInt(uom.ObjectId), uom.Name]);
                count++;
            }

            console.log(`✓ Inserted ${count} UOM records into database`);

            // Show sample
            const sample = await pool.query('SELECT * FROM p6_unit_of_measures ORDER BY "objectId" DESC LIMIT 10');
            console.log('\nSample UOM data:');
            console.table(sample.rows);

            await pool.end();
            process.exit(0);

        } catch (error) {
            console.log(`✗ ${env} FAILED: ${error.message}\n`);
        }
    }

    console.log('Both URLs failed. Please check network/token.');
    await pool.end();
    process.exit(1);
}

syncUOM();
