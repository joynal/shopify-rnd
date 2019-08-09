require('dotenv').config();
const express = require('express');
const install = require('./install');
const callback = require('./callback');

const app = express();

app.get('/', (req, res) => res.send('Hello World!'));
app.get('/shopify', install);
app.get('/shopify/callback', callback);

app.listen(3000, () => {
  console.log('Listening on port 3000!');
});
