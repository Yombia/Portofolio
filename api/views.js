// Page-view counter for the portfolio.
// POST /api/views  -> adds 1 and returns the new total
// GET  /api/views  -> returns the total without counting
// Storage: Upstash Redis (REST API), connected from the Vercel dashboard (Storage tab). No npm packages needed.
const KEY = 'portfolio:views';

// Vercel may add a custom prefix to the variable names (e.g. STORAGE_KV_REST_API_URL), so match by suffix.
const pick = (re, skip) => {
  for (const [k, v] of Object.entries(process.env)) if (v && re.test(k) && !(skip && skip.test(k))) return v;
};

module.exports = async (req, res) => {
  const url = pick(/(KV_REST_API_URL|REDIS_REST_URL)$/);
  const token = pick(/(KV_REST_API_TOKEN|REDIS_REST_TOKEN)$/, /READ_ONLY/);
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
