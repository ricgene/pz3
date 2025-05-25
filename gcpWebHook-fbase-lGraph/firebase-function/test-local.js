const fetch = require('node-fetch');

const testPayload = {
  "Task": "Test Task",
  "State": "GA",
  "Posted": "2025-05-15T01:11:12.235Z",
  "vendors": "Test vendors list",
  "Appemail": "test@example.com",
  "Category": "Test Category",
  "custemail": "customer@example.com",
  "If Due Date": "2025-05-14T00:00:00.000Z",
  "Task Budget": 133,
  "description": "Test description",
  "Full Address": "123 Test Street",
  "Customer Name": "Test Customer"
};

async function testFunction() {
  try {
    const response = await fetch('http://localhost:5001/prizmpoc/us-central1/processEmailAndStoreInFirebase2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'dG7P2xK8nJ9fL3qRvW6zAyB4mS5tE1cX0hQ7jF2pN3gV'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testFunction(); 