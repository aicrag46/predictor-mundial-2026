// ─── FOOTBALL-DATA.ORG AUTO-SYNC (grupos + mata-mata + live) ─────────────────

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

function getApiProxyCandidates() {
  const status = "FINISHED,IN_PLAY,PAUSED,TIMED,SCHEDULED";
  const netlify = `/.netlify/functions/football-results?status=${encodeURIComponent(status)}`;
  const vercel = `/api/football-results?status=${encodeURIComponent(status)}`;
  // Preferir endpoint nativo da plataforma atual, com fallback para o outro.
  return location.hostname.includes("netlify.app") ? [netlify, vercel] : [vercel, netlify];
}

async function fetchViaProxy() {
  const candidates = getApiProxyCandidates();
  let lastErr = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        // Em fallback, ignorar 404/405 e tentar próximo endpoint.
        if (res.status === 404 || res.status === 405) continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
    }
  }

  if (lastErr) throw lastErr;
  throw new Error("Nenhum endpoint de sync disponível");
}

function findGroupGame(homePT, awayPT) {
  return DADOS.jogos.find(j =>
    (j.casa === homePT && j.fora === awayPT) || (j.casa === awayPT && j.fora === homePT)
  );
}

function parseApiScore(m) {
  const st = m.status;
  let gc, gf;

  // Para o nosso jogo, Score90 = resultado aos 90 minutos.
  // Em eliminatórias com prolongamento/penáltis, usar sempre regularTime.
  const rtHome = m.score?.regularTime?.home;
  const rtAway = m.score?.regularTime?.away;
  const ftHome = m.score?.fullTime?.home;
  const ftAway = m.score?.fullTime?.away;

  if (st === "IN_PLAY" || st === "PAUSED") {
    gc = rtHome ?? ftHome;
    gf = rtAway ?? ftAway;
  } else {
    gc = rtHome ?? ftHome;
    gf = rtAway ?? ftAway;
  }
  if (gc === null || gc === undefined || gf === null || gf === undefined) return null;
  return { gc, gf, live: st === "IN_PLAY" || st === "PAUSED", finished: st === "FINISHED" };
}

function applyGroupMatch(m, resultados, liveScores, stats) {
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

  if (sc.live) {
    liveScores[jogo.codigo] = { gc: gcFinal, gf: gfFinal, minute: m.minute, status: m.status };
    stats.live++;
    return;
  }

  if (!sc.finished) return;

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

function stageToRoundId(stage) {
  return {
    ROUND_OF_32: "r32",
    LAST_32: "r32",
    PLAYOFFS: "r32",
    LAST_16: "r16",
    QUARTER_FINALS: "qf",
    SEMI_FINALS: "sf",
    THIRD_PLACE: "tp",
    FINAL: "f",
  }[stage] || null;
}

function syncKnockoutFixturesFromApi(matches, mm, stats) {
  const byRound = { r32: [], r16: [], qf: [], sf: [], tp: [], f: [] };

  for (const m of matches) {
    const rid = stageToRoundId(m.stage);
    if (!rid || !byRound[rid]) continue;
    byRound[rid].push(m);
  }

  let changed = false;
  const rounds = ["r32", "r16", "qf", "sf", "tp", "f"];

  for (const rid of rounds) {
    const list = byRound[rid]
      .sort((a, b) => (a.utcDate || "").localeCompare(b.utcDate || "") || (a.id || 0) - (b.id || 0));
    const games = mm[rid] || [];
    const usedIdx = new Set();

    list.forEach(m => {
      const homePT = apiMapTeam(m.homeTeam?.shortName || m.homeTeam?.name || "");
      const awayPT = apiMapTeam(m.awayTeam?.shortName || m.awayTeam?.name || "");
      if (!homePT || !awayPT) return;

      // A ordem cronológica da API não corresponde à numeração oficial do
      // bracket (MM_BRACKET_MAP). Por isso, em vez de assumir que a posição
      // idx da API é o mesmo slot do nosso bracket, procuramos primeiro o
      // jogo que já tem exactamente este par de equipas (emparelhamento já
      // calculado a partir da ronda anterior).
      let idx = games.findIndex((g, i) =>
        !usedIdx.has(i) &&
        ((cleanTeamName(g.e1) === homePT && cleanTeamName(g.e2) === awayPT) ||
         (cleanTeamName(g.e1) === awayPT && cleanTeamName(g.e2) === homePT)));

      // Se ainda não há emparelhamento conhecido (ex.: ronda anterior por
      // terminar), usar o primeiro slot totalmente vazio como bootstrap —
      // nunca substituir um emparelhamento já definido por um par diferente.
      if (idx === -1) {
        idx = games.findIndex((g, i) =>
          !usedIdx.has(i) && !hasValidTeamName(g.e1) && !hasValidTeamName(g.e2));
      }
      if (idx === -1) return;
      usedIdx.add(idx);

      const game = games[idx];
      if (game.e1 !== homePT || game.e2 !== awayPT) {
        game.e1 = homePT;
        game.e2 = awayPT;
        changed = true;
        stats.koFixtures = (stats.koFixtures || 0) + 1;
      }

      const sc = parseApiScore(m);
      if (!sc || !sc.finished) return;

      if (game.gc !== sc.gc || game.gf !== sc.gf) {
        game.gc = sc.gc;
        game.gf = sc.gf;
        changed = true;
        stats.koUpdated++;
      }

      if (sc.gc === sc.gf) {
        const winner = apiWinnerTeam(m, homePT, awayPT);
        if (winner && game.pen_winner !== winner) {
          game.pen_winner = winner;
          changed = true;
        }
      } else if (game.pen_winner !== null) {
        game.pen_winner = null;
        changed = true;
      }

      if (game.gc !== null && game.gf !== null) {
        mmPropagate(mm, rid, idx);
      }
    });
  }

  return changed;
}

async function apiFetch() {
  if (_apiSyncing) return 0;
  _apiSyncing = true;
  showApiStatus("🔄 A sincronizar…", "syncing");

  try {
    const res = await fetchViaProxy();
    if (!res.ok) {
      const txt = await res.text();
      let msg = txt.slice(0, 120);
      try { msg = JSON.parse(txt).error || msg; } catch {}
      throw new Error(`HTTP ${res.status}: ${msg}`);
    }
    const json = await res.json();
    const matches = json.matches || [];

    const resultados = getResultados();
    const liveScores = {};
    const mm = getMataMata();
    const stats = { updated: 0, koUpdated: 0, koFixtures: 0, live: 0, conflicts: 0 };

    for (const m of matches) {
      if (m.stage === "GROUP_STAGE" || !m.stage) {
        applyGroupMatch(m, resultados, liveScores, stats);
      }
    }
    const koChanged = syncKnockoutFixturesFromApi(matches, mm, stats);

    dbSet(DB_KEYS.LIVE_SCORES, liveScores);

    if (stats.updated > 0) saveResultados(resultados);
    if (koChanged || stats.koUpdated > 0) saveMataMata(mm);

    saveClassificationSnapshot(resultados);

    if (stats.conflicts > 0) showNextConflict();

    try { renderTab(activeTab); } catch {}

    const now = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    const parts = [`${stats.updated} GS`];
    if (stats.koFixtures) parts.push(`${stats.koFixtures} KO jogos`);
    if (stats.koUpdated) parts.push(`${stats.koUpdated} KO`);
    if (stats.live) parts.push(`${stats.live} live`);
    showApiStatus(`✅ ${now} · ${parts.join(" · ")}`, "ok");
    return stats.updated + stats.koUpdated;
  } catch (e) {
    console.error("[API]", e);
    const hint = location.protocol === "file:" ? "Usa URL Netlify" : e.message.slice(0, 80);
    showApiStatus("❌ " + hint, "error");
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
