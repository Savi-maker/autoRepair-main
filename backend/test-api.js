const http = require('http');

const postData = JSON.stringify({
  email: 'jan@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      console.log('\nParsed JSON:', JSON.stringify(json, null, 2));
      if (json.data && json.data.token) {
        console.log('\n✅ Token received:', json.data.token.substring(0, 50) + '...');
        const parts = json.data.token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log('\n🔓 Token Payload:', JSON.stringify(payload, null, 2));
        }
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

console.log('Sending request...');
req.write(postData);
req.end();
console.log('Request sent, waiting for response...');
