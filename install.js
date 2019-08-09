const nonce = require('nonce')();

const scopes = 'read_products';
const apiKey = process.env.SHOPIFY_API_KEY;
const forwardingAddress = process.env.APP_URL;

// eslint-disable-next-line consistent-return
module.exports = (req, res) => {
  const { shop } = req.query;
  if (shop) {
    const state = nonce();
    const redirectUri = `${forwardingAddress}/shopify/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&state=${state}&redirect_uri=${redirectUri}`;

    res.cookie('state', state);
    res.redirect(installUrl);
  } else {
    return res.status(400).send('Missing shop parameter. Please add ?shop=shop-name.myshopify.com to your request');
  }
};
