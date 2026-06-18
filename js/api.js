// ─── FOOTBALL-DATA.ORG AUTO-SYNC (grupos + mata-mata) ────────────────────────

const API_TEAM_MAP = {
  "Mexico": "México", "South Africa": "África do Sul", "South Korea": "Coreia do Sul",
  "Korea Republic": "Coreia do Sul", "Czechia": "Chéquia", "Czech Republic": "Chéquia",
  "Canada": "Canadá", "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  "Bosnia & Herzegovina": "Bósnia e Herzegovina", "Bosnia-H.": "Bósnia e Herzegovina",
  "Qatar": "Catar", "Switzerland": "Suíça", "Brazil": "Brasil", "Haiti": "Haiti",
  "Scotland": "Escócia", "Morocco": "Marrocos", "United States": "Estados Unidos", "USA": "Estados Unidos",
  "Paraguay": "Paraguai", "Australia": "Austrália", "Turkey": "Turquia", "Türkiye": "Turquia",
  "Germany": "Alemanha", "Curaçao": "Curaçau", "Curacao": "Curaçau",
  "Côte d'Ivoire": "Costa do Marfim", "Ivory Coast": "Costa do Marfim", "Ecuador": "Equador",
  "Netherlands": "Holanda", "Japan": "Japão", "Sweden": "Suécia", "Tunisia": "Tunísia",
  "Belgium": "Bélgica", "Egypt": "Egito", "Iran": "Irão", "IR Iran": "Irão",
  "New Zealand": "Nova Zelândia", "Spain": "Espanha", "Cape Verde": "Cabo Verde",
  "Saudi Arabia": "Arábia Saudita", "Uruguay": "Uruguai", "Argentina": "Argentina",
  "Algeria": "Argélia", "Austria": "Áustria", "Jordan": "Jordânia", "Portugal": "Portugal",
  "DR Congo": "RD Congo", "Congo DR": "RD Congo", "Democratic Republic of Congo": "RD Congo",
  "Uzbekistan": "Uzbequistão", "Colombia": "Colômbia", "England": "Inglaterra",
  "Croatia": "Croácia", "Ghana": "Gana", "Panamá": "Panamá", "Panama": "Panamá",
  "France": "França", "Senegal": "Senegal", "Iraq": "Iraque", "Norway": "Noruega",
  "Poland": "Polónia", "Polska": "Polónia", "Cuba": "Cuba", "Gambia": "Gâmbia",
  "China PR": "China", "China": "China", "Nigeria": "Nigéria", "Romania": "Roménia",
  "Italy": "Itália", "Venezuela": "Venezuela", "Costa Rica": "Costa Rica", "Jamaica": "Jamaica",
  "Denmark": "Dinamarca", "Serbia": "Sérvia", "Dominican Republic": "República Dominicana",
  "Greece": "Grécia", "Ukraine": "Ucrânia", "Kazakhstan": "Cazaquistão", "Guinea": "Guiné",
  "Israel": "Israel", "Thailand": "Tailândia",
};

const KO_STAGES = new Set([
  "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL",
  "ROUND_OF_32", "LAST_32", "PLAYOFFS",
]);

function apiMapTeam(name) { return API_TEAM_MAP[name] || name; }

let _apiSyncing = false;
let _apiInterval = null;

const API_PROXY_URL = "/.netlify/functions/football-results?status=FINISHED";

function findGroupGame(homePT, awayPT) {
  return DADOS.jogos.find(j =>
    (j.casa === homePT && j.fora === awayPT) || (j.casa === awayPT && j.fora === homePT)
  );
}

function parseApiScore(m) {
  if (m.status !== "FINISHED") return null;
  const gc = m.score?.fullTime?.home;
  const gf = m.score?.fullTime?.away;
  if (gc === null || gc === undefined || gf === null || gf === undefined) return null;
  return { gc, gf };
}

function applyGroupMatch(m, resultados, stats) {
  const homePT = apiMapTeam(m.homeTeam?.shortName || m.homeTeam?.name || "");
  const awayPT = apiMapTeam(m.awayTeam?.shortName || m.awayTeam?.name || "");
  const sc = parseApiScore(m);
  if (!sc) return;

  const jogo = findGroupGame(homePT, awayPT);
  if (!jogo) return;

  let gcFinal = sc.gc, gfFinal = sc.gf;
  if (jogo.casa === awayPT && jogo.fora === homePT) {
    gcFinal = sc.gf; gfFinal = sc.gc;
  }

  const existing = resultados[jogo.codigo];
  const incoming = { gc: gcFinal, gf: gfFinal, _ts: Date.now(), _api: true };

  if (existing && existing._manual && (existing.gc !== gcFinal || existing.gf !== gfFinal)) {
    queueConflict(jogo.codigo, jogo, existing, incoming);
    stats.conflicts++;
    return;
  }

  if (!existing || existing.gc !== gcFinal || existing.gf !== gfFinal) {
    resultados[jogo.codigo] = incoming;
    stats.updated++;
  }
}

function apiWinnerTeam(m, homePT, awayPT) {
  const w = m.score?.winner;
  if (w === "HOME_TEAM") return homePT;
  if (w === "AWAY_TEAM") return awayPT;
  return null;
}

function applyKnockoutMatch(m, mm, stats) {
  const stage = m.stage;
  if (!KO_STAGES.has(stage) && stage !== "PLAYOFFS") return;

  const homePT = apiMapTeam(m.homeTeam?.shortName || m.homeTeam?.name || "");
  const awayPT = apiMapTeam(m.awayTeam?.shortName || m.awayTeam?.name || "");
  const sc = parseApiScore(m);
  if (!sc) return;

  let gc = sc.gc, gf = sc.gf;
  const rounds = ["r32", "r16", "qf", "sf", "tp", "f"];

  for (const rid of rounds) {
    if (!mm[rid]) continue;
    mm[rid].forEach((game, idx) => {
      if (!game.e1 && !game.e2) return;
      const match =
        (game.e1 === homePT && game.e2 === awayPT) ||
        (game.e1 === awayPT && game.e2 === homePT);
      if (!match) return;

      let gcF = gc, gfF = gf;
      if (game.e1 === awayPT && game.e2 === homePT) { gcF = gf; gfF = gc; }

      if (game.gc === gcF && game.gf === gfF) return;

      game.gc = gcF;
      game.gf = gfF;
      if (gcF === gfF) {
        const winner = apiWinnerTeam(m, homePT, awayPT);
        game.pen_winner = winner || game.pen_winner;
      } else {
        game.pen_winner = null;
      }
      mmPropagate(mm, rid, idx);
      stats.koUpdated++;
    });
  }
}

async function apiFetch() {
  if (_apiSyncing) return 0;
  _apiSyncing = true;
  showApiStatus("A sincronizar…", "syncing");

  try {
    const res = await fetch(API_PROXY_URL);
    if (!res.ok) {
      const txt = await res.text();
      let msg = txt.slice(0, 120);
      try { msg = JSON.parse(txt).error || msg; } catch {}
      throw new Error(`HTTP ${res.status}: ${msg}`);
    }
    const json = await res.json();
    const matches = json.matches || [];

    const resultados = getResultados();
    const mm = getMataMata();
    const stats = { updated: 0, koUpdated: 0, conflicts: 0 };

    for (const m of matches) {
      if (m.stage === "GROUP_STAGE" || !m.stage) {
        applyGroupMatch(m, resultados, stats);
      } else {
        applyKnockoutMatch(m, mm, stats);
      }
    }

    if (stats.updated > 0) saveResultados(resultados);
    if (stats.koUpdated > 0) saveMataMata(mm);

    saveClassificationSnapshot(resultados);

    if (stats.conflicts > 0) showNextConflict();

    try { renderTab(activeTab); } catch {}

    const now = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    const parts = [`${stats.updated} GS`];
    if (stats.koUpdated) parts.push(`${stats.koUpdated} KO`);
    showApiStatus(`${now} · ${parts.join(" · ")}`, "ok");
    return stats.updated + stats.koUpdated;
  } catch (e) {
    console.error("[API]", e);
    const hint = location.protocol === "file:" ? "Usa URL Netlify" : e.message.slice(0, 80);
    showApiStatus(hint, "error");
    return 0;
  } finally {
    _apiSyncing = false;
  }
}

function apiStartAutoSync(intervalMs = 5 * 60 * 1000) {
  if (_apiInterval) clearInterval(_apiInterval);
  apiFetch();
  _apiInterval = setInterval(apiFetch, intervalMs);
}

function apiStopAutoSync() {
  if (_apiInterval) { clearInterval(_apiInterval); _apiInterval = null; }
}

function showApiStatus(msg, type = "ok") {
  const el = document.getElementById("api-status");
  if (!el) return;
  el.textContent = msg;
  el.className = "api-status api-status-" + type;
  el.style.display = "inline-flex";
}
