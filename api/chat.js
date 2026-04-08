export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, key, value } = req.body || {};

  // KV storage actions
  if (action === 'get') {
    const r = await kvGet(key);
    return res.status(200).json({ value: r });
  }
  if (action === 'set') {
    await kvSet(key, value);
    return res.status(200).json({ ok: true });
  }
  if (action === 'list') {
    const r = await kvList();
    return res.status(200).json({ keys: r });
  }

  // Anthropic AI call
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
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

async function kvGet(key) {
  const r = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const d = await r.json();
  return d.result;
}

async function kvSet(key, value) {
  await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value }),
  });
}

async function kvList() {
  const r = await fetch(`${process.env.KV_REST_API_URL}/keys/*`, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const d = await r.json();
  return d.result || [];
}
