import axios from 'axios';
const users = [
  {
    id: 'f6a36ec4-06f9-43b3-90b8-2ce17cc68891',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY2YTM2ZWM0LTA2ZjktNDNiMy05MGI4LTJjZTE3Y2M2ODg5MSIsImVtYWlsIjoiam9uaWFzaGltaTFAZ21haWwuY29tIiwibmFtZSI6IlJlYWwgSm9uaSIsImlhdCI6MTc2NTQ0NzA0MSwiZXhwIjoxNzY1NDUwNjQxfQ.qkvd8ZG7bcDVO0K158M4OT_pNDhs967Dczkg9YgU8uI',
  },
  {
    id: '63af381a-f53f-499d-85aa-688e22c1bce4',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzYWYzODFhLWY1M2YtNDk5ZC04NWFhLTY4OGUyMmMxYmNlNCIsImVtYWlsIjoicmVpQGdtYWlsLmNvbSIsIm5hbWUiOiJSZWkgVXNlciIsImlhdCI6MTc2NTQ0NzA1NSwiZXhwIjoxNzY1NDUwNjU1fQ.1wXC96gK6Vx4E-9YDxdxPggXk1mD9UiWdL2aWD97Dt8',
  },
  {
    id: 'cea9fada-f596-4bdd-8a48-c69a6b17fed0',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlYTlmYWRhLWY1OTYtNGJkZC04YTQ4LWM2OWE2YjE3ZmVkMCIsImVtYWlsIjoiY2FyZEBnbWFpbC5jb20iLCJuYW1lIjoiQ2FyZCBUZXN0ZXIiLCJpYXQiOjE3NjU0NDcwOTYsImV4cCI6MTc2NTQ1MDY5Nn0.0jKAEb9UEhMrAvlTBmPiCA1i0BiF_krEnq4uoxBNx2Y',
  },
  {},
  {},
];
const API_URL = 'http://localhost:8000/transactions';
const auctionId = '15732ce9-6e5e-48fe-81d9-b3bdb562f306';
const transactionAmount = 3600;

async function createTransactionTest(userToken, amount) {
  try {
    const response = await axios.post(
      API_URL,
      {
        auctionId,
        amount,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    );
    console.log('Transaction created: ', response.data);
  } catch (err) {
    console.error(err);
  }
}

async function runTransactionsTest() {
  console.log('Starting transactions test...');
  await Promise.all([
    createTransactionTest(users[0].token, transactionAmount),
    createTransactionTest(users[1].token, transactionAmount),
    createTransactionTest(users[2].token, transactionAmount),
  ]);
  console.log('Transactions test completed.');
}

runTransactionsTest().then((r) => console.log('Call'));
