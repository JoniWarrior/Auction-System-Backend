import axios from 'axios';

const AUCTION_ID = 'bcdd428f-d930-4962-9f65-5b5fe31efaf5';

const users = [
  {
    email: 'joniashimi1@gmail.com',
    password: 'joni.pass10',
    bidAmount: 106,
  },
  {
    email: 'card@gmail.com',
    password: 'card.pass10',
    bidAmount: 106,
  },
];

async function login(email, password) {
  const res = await axios.post('http://localhost:8000/auth/login', {
    email,
    password,
  });
  return res.data.data.accessToken;
}

async function placeBid(token, amount, email) {
  try {
    const res = await axios.post(
      'http://localhost:8000/biddings',
      {
        auctionId: AUCTION_ID,
        amount,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log(` ${email} BID ACCEPTDE`);
    return res.data;
  } catch (err) {
    console.log(`${email} BID REJECTED →`, err.response?.data?.message);
  }
}

async function runTest() {
  const tokens = await Promise.all(
    users.map((u) => login(u.email, u.password)),
  );

  console.log('Statring bidding test');

  await Promise.all(
    users.map((user, i) => placeBid(tokens[i], user.bidAmount, user.email)),
  );

  console.log('Test completed');
}

runTest();
