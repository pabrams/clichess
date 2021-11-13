require('dotenv').config();
const fetch = require('node-fetch');

const headers = {
  Authorization: 'Bearer ' + process.env.lichessToken,
};

let accountPromise = fetch('https://lichess.org/api/account', { headers })
  .then(res => res.json())
  .then(console.log);

accountPromise.then(() => console.log('done'));
