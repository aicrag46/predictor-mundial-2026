// Proxy server-side para football-data.org (evita CORS + rate limit básico)
const CACHE_MS = 45000;
let cache = { body: null, status: 200, ts: 0 };
const hits = new Map(); // IP → { count, reset }

function rateLimit(ip) {
  const now = Date.now();
  const w = hits.get(ip) || { count: 0, reset: now + 60000 };
  if (now > w.reset) { w.count = 0; w.reset = now + 60000; }
  w.count++;
  hits.set(ip, w);
  return w.count <= 30;
}

exports.handler = async (event) => {
  const ip = event.headers["x-forwarded-for"]?.split(",")[0] || "anon";
  if (!rateLimit(ip)) {
    return { statusCode: 429, body: JSON.stringify({ error: "Rate limit — aguarda 1 min" }) };
  }

  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    return { statusCode: 500, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "FOOTBALL_DATA_TOKEN não configurado no Netlify" }) };
  }

  const status = event.queryStringParameters?.status || "FINISHED,IN_PLAY,PAUSED";
  const now = Date.now();
  const cacheKey = status;

  if (cache.key === cacheKey && cache.body && now - cache.ts < CACHE_MS) {
    return { statusCode: cache.status, headers: corsHeaders(), body: cache.body };
  }

  try {
    const url = `https://api.football-data.org/v4/competitions/WC/matches?status=${encodeURIComponent(status)}`;
    const res = await fetch(url, { headers: { "X-Auth-Token": token } });
    const body = await res.text();
    cache = { key: cacheKey, body, status: res.status, ts: now };
    return { statusCode: res.status, headers: corsHeaders(), body };
  } catch (e) {
    return { statusCode: 502, headers: corsHeaders(),
      body: JSON.stringify({ error: e.message }) };
  }
};

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=45",
  };
}
