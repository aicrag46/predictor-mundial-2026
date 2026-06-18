// ─── FOOTBALL-DATA.ORG AUTO-SYNC ─────────────────────────────────────────────
// Obtém resultados do Mundial 2026 automaticamente (grátis, 10 req/min)
// Registo gratuito em: https://www.football-data.org/

// ─── Mapeamento EN → PT (nomes das equipas) ───────────────────────────────────
const API_TEAM_MAP = {
  "Mexico":                  "México",
  "South Africa":            "África do Sul",
  "South Korea":             "Coreia do Sul",
  "Korea Republic":          "Coreia do Sul",
  "Czechia":                 "Chéquia",
  "Czech Republic":          "Chéquia",
  "Canada":                  "Canadá",
  "Bosnia and Herzegovina":  "Bósnia e Herzegovina",
  "Bosnia & Herzegovina":    "Bósnia e Herzegovina",
  "Qatar":                   "Catar",
  "Switzerland":             "Suíça",
  "Brazil":                  "Brasil",
  "Haiti":                   "Haiti",
  "Scotland":                "Escócia",
  "Morocco":                 "Marrocos",
  "United States":           "Estados Unidos",
  "USA":                     "Estados Unidos",
  "Paraguay":                "Paraguai",
  "Australia":               "Austrália",
  "Turkey":                  "Turquia",
  "Türkiye":                 "Turquia",
  "Germany":                 "Alemanha",
  "Curaçao":                 "Curaçau",
  "Curacao":                 "Curaçau",
  "Côte d'Ivoire":           "Costa do Marfim",
  "Ivory Coast":             "Costa do Marfim",
  "Ecuador":                 "Equador",
  "Netherlands":             "Holanda",
  "Japan":                   "Japão",
  "Sweden":                  "Suécia",
  "Tunisia":                 "Tunísia",
  "Belgium":                 "Bélgica",
  "Egypt":                   "Egito",
  "Iran":                    "Irão",
  "IR Iran":                 "Irão",
  "New Zealand":             "Nova Zelândia",
  "Spain":                   "Espanha",
  "Cape Verde":              "Cabo Verde",
  "Saudi Arabia":            "Arábia Saudita",
  "Uruguay":                 "Uruguai",
  "Argentina":               "Argentina",
  "Algeria":                 "Argélia",
  "Austria":                 "Áustria",
  "Jordan":                  "Jordânia",
  "Portugal":                "Portugal",
  "DR Congo":                "RD Congo",
  "Congo DR":                "RD Congo",
  "Democratic Republic of Congo": "RD Congo",
  "Uzbekistan":              "Uzbequistão",
  "Colombia":                "Colômbia",
  "England":                 "Inglaterra",
  "Croatia":                 "Croácia",
  "Ghana":                   "Gana",
  "Panama":                  "Panamá",
  "France":                  "França",
  "Senegal":                 "Senegal",
  "Iraq":                    "Iraque",
  "Norway":                  "Noruega",
  "Poland":                  "Polónia",
  "Cuba":                    "Cuba",
  "Gambia":                  "Gâmbia",
  "China PR":                "China",
  "China":                   "China",
  "Nigeria":                 "Nigéria",
  "Romania":                 "Roménia",
  "Italy":                   "Itália",
  "Venezuela":               "Venezuela",
  "Costa Rica":              "Costa Rica",
  "Jamaica":                 "Jamaica",
  "Denmark":                 "Dinamarca",
  "Serbia":                  "Sérvia",
  "Dominican Republic":      "República Dominicana",
  "Greece":                  "Grécia",
  "Ukraine":                 "Ucrânia",
  "Kazakhstan":              "Cazaquistão",
  "Guinea":                  "Guiné",
  "Israel":                  "Israel",
  "Thailand":                "Tailândia",
};

function apiMapTeam(name) {
  return API_TEAM_MAP[name] || name;
}

let _apiSyncing  = false;
let _apiInterval = null;

// ─── Buscar e aplicar resultados ──────────────────────────────────────────────
async function apiFetch() {
  const token = (typeof FOOTBALL_DATA_TOKEN !== "undefined") ? FOOTBALL_DATA_TOKEN : null;
  if (!token || token.includes("XXXXX")) {
    showApiStatus("⚠️ Token não configurado", "warn");
    return 0;
  }
  if (_apiSyncing) return 0;
  _apiSyncing = true;
  showApiStatus("🔄 A sincronizar…", "syncing");

  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
      { headers: { "X-Auth-Token": token } }
    );
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 120)}`);
    }
    const json = await res.json();
    const matches = json.matches || [];

    const resultados = getResultados();
    let updated = 0;

    for (const m of matches) {
      const homePT = apiMapTeam(m.homeTeam?.shortName || m.homeTeam?.name || "");
      const awayPT = apiMapTeam(m.awayTeam?.shortName || m.awayTeam?.name || "");
      const gc     = m.score?.fullTime?.home;
      const gf     = m.score?.fullTime?.away;
      if (gc === null || gc === undefined || gf === null || gf === undefined) continue;

      // Encontrar jogo correspondente em DADOS.jogos
      const jogo = DADOS.jogos.find(j =>
        (j.casa === homePT && j.fora === awayPT) ||
        (j.casa === awayPT && j.fora === homePT)
      );
      if (!jogo) continue;

      // Se os golos são ao contrário (API: home=fora, away=casa)
      let gcFinal = gc, gfFinal = gf;
      if (jogo.casa === awayPT && jogo.fora === homePT) {
        gcFinal = gf; gfFinal = gc;
      }

      // Só actualizar se o resultado mudou ou não existe
      const existing = resultados[jogo.codigo];
      if (!existing || existing.gc !== gcFinal || existing.gf !== gfFinal) {
        resultados[jogo.codigo] = { gc: gcFinal, gf: gfFinal, _ts: Date.now(), _api: true };
        updated++;
      }
    }

    if (updated > 0) {
      saveResultados(resultados);
      try { renderTab(activeTab); } catch {}
    }

    const now = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    showApiStatus(`✅ Sincronizado às ${now} (${matches.length} jogos, ${updated} novos)`, "ok");
    return updated;
  } catch (e) {
    console.error("[API] Erro:", e);
    showApiStatus("❌ Erro: " + e.message.slice(0, 80), "error");
    return 0;
  } finally {
    _apiSyncing = false;
  }
}

// ─── Auto-sync a cada 5 minutos ───────────────────────────────────────────────
function apiStartAutoSync(intervalMs = 5 * 60 * 1000) {
  if (_apiInterval) clearInterval(_apiInterval);
  apiFetch();
  _apiInterval = setInterval(apiFetch, intervalMs);
}

function apiStopAutoSync() {
  if (_apiInterval) { clearInterval(_apiInterval); _apiInterval = null; }
}

// ─── Indicador de estado na UI ────────────────────────────────────────────────
function showApiStatus(msg, type = "ok") {
  const el = document.getElementById("api-status");
  if (!el) return;
  el.textContent = msg;
  el.className = "api-status api-status-" + type;
  el.style.display = "inline-flex";
}
