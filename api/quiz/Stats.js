const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kv(cmd) {
  const res = await fetch(`${KV_URL}/${cmd.join('/')}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!KV_URL || !KV_TOKEN) {
    return res.status(200).json({
      error: 'KV not configured',
      total: 0,
      message: 'Vercel KV 환경변수를 설정해주세요'
    });
  }

  if (req.method === 'POST') {
    const { saint } = req.body || {};
    await kv(['INCR', 'stats:total']);
    if (saint) await kv(['INCR', `stats:saint:${saint}`]);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    const totalRes = await kv(['GET', 'stats:total']);
    const total = parseInt(totalRes.result) || 0;

    const keysRes = await kv(['KEYS', 'stats:saint:*']);
    const saintKeys = keysRes.result || [];

    const saintCounts = await Promise.all(
      saintKeys.map(async key => {
        const r = await kv(['GET', key]);
        return { name: key.replace('stats:saint:', ''), count: parseInt(r.result) || 0 };
      })
    );
    saintCounts.sort((a, b) => b.count - a.count);

    return res.status(200).json({
      total_runs: total,
      last_updated: new Date().toISOString(),
      top_saints: saintCounts.slice(0, 10),
      all_saints: saintCounts
    });
  }

  return res.status(405).end();
}
