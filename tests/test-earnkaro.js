// Quick test: verify the EarnKaro API token works
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'https://ekaro-api.affiliaters.in/api/converter/public';
const TOKEN = process.env.EARNKARO_API_TOKEN;
const OPTION = process.env.EARNKARO_CONVERT_OPTION || 'convert_only';

async function test() {
  const testUrl = 'https://www.flipkart.com/boat-airdopes-141-bluetooth-headset/p/itm7f6a47d180b6b';

  console.log('=== EarnKaro API Test ===\n');
  console.log('Token:', TOKEN ? `${TOKEN.slice(0, 20)}...` : '❌ NOT SET');
  console.log('Option:', OPTION);
  console.log('Test URL:', testUrl);
  console.log('\nCalling API...\n');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deal: testUrl, convert_option: OPTION }),
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (data.success === 1) {
    console.log('\n✅ SUCCESS! Affiliate link:', data.data);
  } else {
    console.log('\n❌ Error:', data.message || 'Unknown');
  }
}

test().catch(e => console.error('❌ Failed:', e.message));
