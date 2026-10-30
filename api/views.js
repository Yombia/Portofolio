// Page-view counter for the portfolio.
// POST /api/views  -> adds 1 and returns the new total
// GET  /api/views  -> returns the total without counting
// Storage: Upstash Redis (REST API), connected from the Vercel dashboard (Storage tab). No npm packages needed.
const KEY = 'portfolio:views';

module.exports = async (req, res) => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  res.setHeader('Cache-Control', 'no-store');
  if (!url || !token) return res.status(503).json({ error: 'counter not configured' });
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const cmd = req.method === 'POST' ? 'incr' : 'get';
  try {
    const r = await fetch(`${url}/${cmd}/${KEY}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error('upstash ' + r.status);
    const j = await r.json();
    return res.status(200).json({ views: Number(j.result) || 0 });
  } catch (e) {
    return res.status(502).json({ error: 'counter unavailable' });
  }
};
