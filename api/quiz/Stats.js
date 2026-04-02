const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kv(cmd, ...args) {
  const parts = [cmd, ...args].map(p => encodeURIComponent(p));
  const res = await fetch(`${KV_URL}/${parts.join('/')}`, {
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
      total_runs: 0,
      message: 'KV 환경변수를 설정해주세요'
    });
  }

  if (req.method === 'POST') {
    try {
      const { saint } = req.body || {};
      await kv('INCR', 'stats:total');
      if (saint) await kv('ZINCRBY', 'stats:saints', '1', saint);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const totalRes = await kv('GET', 'stats:total');
      const total = parseInt(totalRes.result) || 0;

      const topRes = await kv('ZREVRANGE', 'stats:saints', '0', '9', 'WITHSCORES');
      const raw = topRes.result || [];
      const topSaints = [];
      for (let i = 0; i < raw.length; i += 2) {
        topSaints.push({ name: raw[i], count: parseInt(raw[i + 1]) || 0 });
      }

      return res.status(200).json({
        total_runs: total,
        last_updated: new Date().toISOString(),
        top_saints: topSaints
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}
