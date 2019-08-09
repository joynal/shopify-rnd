const crypto = require('crypto');
const cookie = require('cookie');
const fetch = require('node-fetch');
const querystring = require('querystring');

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;

module.exports = async (req, res) => {
  try {
    const {
      shop, hmac, code, state,
    } = req.query;
    const stateCookie = cookie.parse(req.headers.cookie).state;

    if (state !== stateCookie) {
      return res.status(403).send('Request origin cannot be verified');
    }

    if (shop && hmac && code) {
      const map = { ...req.query };
      delete map.signature;
      delete map.hmac;
      const message = querystring.stringify(map);
      const providedHmac = Buffer.from(hmac, 'utf-8');
      const generatedHash = Buffer.from(
        crypto
          .createHmac('sha256', apiSecret)
          .update(message)
          .digest('hex'),
        'utf-8',
      );

      const hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac);

      // 2. hmac verified
      if (hashEquals === true) {
        const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
        const accessTokenPayload = {
          client_id: apiKey,
          client_secret: apiSecret,
          code,
        };

        const response = await fetch(accessTokenRequestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(accessTokenPayload),
        });

        const accessTokenResponse = await response.json();

        // 3. Use access token
        const accessToken = accessTokenResponse.access_token;
        const shopRequestUrl = `https://${shop}/admin/api/2019-07/shop.json`;

        const shopResponse = await fetch(shopRequestUrl, {
          method: 'Get',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
        });
        const shopJson = await shopResponse.json();

        return res.status(200).send(shopJson);
      }

      return res.status(400).send('HMAC validation failed');
    }

    return res.status(400).send('Required parameters missing');
  } catch (err) {
    console.error({ err });
    return res.status(400).send('Something wrong');
  }
};
