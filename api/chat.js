export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, key, value } = body;

    // KV storage actions
    if (action === 'get') {
      const r = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
      });
      const d = await r.json();
      return res.status(200).json({ value: d.result });
    }

    if (action === 'set') {
      const r = await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([key, value]),
      });
      const d = await r.json();
      return res.status(200).json({ ok: true, debug: d });
    }

    // Anthropic AI call
    body.model = 'claude-sonnet-4-5';
    delete body.action;

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
