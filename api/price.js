// izi BTC Price API — Vercel Edge Function version (free Hobby tier, permanent *.vercel.app URL)
// In your GitHub repo this file must be named: api/price.js
const PAY_TO = '0x942054f145c53e6557e9cfacf9aa44bea5e0f24d';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const AMOUNT = '1000'; // 0.001 USDC in atomic units

export const config = { runtime: 'edge' };

export default async function (request) {
  const url = new URL(request.url);
  const selfUrl = url.origin + url.pathname;
  if (url.pathname.endsWith('/health')) {
    return json({ ok: true, service: 'izi-btc-price', time: new Date().toISOString() });
  }
  if (request.headers.get('X-PAYMENT')) {
    return json(await btcPrice());
  }
  const challenge = {
    x402Version: 2,
    resource: {
      url: selfUrl,
      description: 'Live BTC/USDT spot price from Binance as JSON. No input required.',
      mimeType: 'application/json',
    },
    accepts: [{
      scheme: 'exact',
      network: 'eip155:8453',
      amount: AMOUNT,
      asset: USDC_BASE,
      payTo: PAY_TO,
      maxTimeoutSeconds: 300,
      extra: { name: 'USD Coin', version: '2' },
    }],
    extensions: {
      bazaar: {
        info: {
          input: { type: 'http', method: 'GET' },
          output: { type: 'json', example: { symbol: 'BTCUSDT', price: '0.00', source: 'binance', ts: 0 } },
        },
      },
    },
  };
  const res = json(challenge, 402);
  res.headers.set('PAYMENT-REQUIRED', btoa(JSON.stringify(challenge)));
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Expose-Headers', 'PAYMENT-REQUIRED, PAYMENT-RESPONSE');
  return res;
}

async function btcPrice() {
  const r = await fetch('https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT');
  const d = await r.json();
  return { symbol: d.symbol, price: d.price, source: 'binance', ts: Date.now() };
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
