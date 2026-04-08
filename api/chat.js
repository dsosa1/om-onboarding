import { Redis } from 'https://esm.sh/@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, key, value } = body;

    if (action === 'get') {
      const data = await redis.get(key);
      return res.status(200).json({ value: data });
    }

    if (action === 'set') {
      await redis.set(key, value);
      return res.status(200).json({ ok: true });
    }

    // Anthropic AI call
    delete body.action;
    body.model = 'claude-sonnet-4-5';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error });
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
