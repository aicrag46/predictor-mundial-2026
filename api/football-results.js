// Proxy server-side para football-data.org (Vercel)
const CACHE_MS = 45000;
let cache = { key: "", body: null, status: 200, ts: 0 };
const hits = new Map(); // IP -> { count, reset }

function rateLimit(ip) {
  const now = Date.now();
  const w = hits.get(ip) || { count: 0, reset: now + 60000 };
  if (now > w.reset) {
    w.count = 0;
    w.reset = now + 60000;
  }
  w.count++;
  hits.set(ip, w);
  return w.count <= 30;
}

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=45",
  };
}

export default async function handler(req, res) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0] || "anon";
  if (!rateLimit(ip)) {
    return res.status(429).setHeader("Content-Type", "application/json")
      .send(JSON.stringify({ error: "Rate limit — aguarda 1 min" }));
  }

  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    return res.status(500).setHeader("Content-Type", "application/json")
      .send(JSON.stringify({ error: "FOOTBALL_DATA_TOKEN não configurado no Vercel" }));
  }

  const status = req.query?.status || "FINISHED";
  const now = Date.now();
  const cacheKey = String(status);

  if (cache.key === cacheKey && cache.body && now - cache.ts < CACHE_MS) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(cache.status).send(cache.body);
  }

  try {
    const url = `https://api.football-data.org/v4/competitions/WC/matches?status=${encodeURIComponent(cacheKey)}`;
    const up = await fetch(url, { headers: { "X-Auth-Token": token } });
    const body = await up.text();

    cache = { key: cacheKey, body, status: up.status, ts: now };
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(up.status).send(body);
  } catch (e) {
    Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(502).send(JSON.stringify({ error: e.message }));
  }
}
