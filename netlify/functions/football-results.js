// Proxy server-side para football-data.org (evita CORS no browser)
exports.handler = async () => {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "FOOTBALL_DATA_TOKEN não configurado no Netlify" }),
    };
  }

  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
      { headers: { "X-Auth-Token": token } }
    );
    const body = await res.text();
    return {
      statusCode: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
      body,
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
