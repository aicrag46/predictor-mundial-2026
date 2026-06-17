/**
 * Gera 10 ficheiros HTML individuais — um por participante do Predictor Mundial 2026.
 * Cada ficheiro é totalmente auto-contido (sem dependências externas).
 */

const fs = require("fs");
const path = require("path");

// ─── Carregar dados ────────────────────────────────────────────────────────────
eval(fs.readFileSync(path.join(__dirname, "js/data.js"), "utf8"));

// ─── Datas e horas dos jogos (Lisboa, UTC+1) ──────────────────────────────────
// Mapeamento código → { data, hora, estadio, cidade }
const SCHEDULE = {
  // ── Jornada 1 ──────────────────────────────────────────────────────────────
  A1: { data: "2026-06-11", hora: "00:00", cidade: "Cidade do México"  },
  A2: { data: "2026-06-12", hora: "04:00", cidade: "Guadalajara"       },
  B1: { data: "2026-06-13", hora: "00:00", cidade: "Toronto"           },
  D1: { data: "2026-06-13", hora: "03:00", cidade: "Los Angeles"       },
  B2: { data: "2026-06-14", hora: "00:00", cidade: "São Francisco"     },
  C1: { data: "2026-06-14", hora: "03:00", cidade: "Nova Jérsia"       },
  C2: { data: "2026-06-14", hora: "22:00", cidade: "Boston"            },
  D2: { data: "2026-06-15", hora: "01:00", cidade: "Houston"           },
  E1: { data: "2026-06-15", hora: "19:00", cidade: "Dallas"            },
  E2: { data: "2026-06-15", hora: "22:00", cidade: "Filadélfia"        },
  F1: { data: "2026-06-16", hora: "00:00", cidade: "Monterrey"         },
  G1: { data: "2026-06-16", hora: "20:00", cidade: "Atlanta"           },
  G2: { data: "2026-06-16", hora: "23:00", cidade: "Seattle"           },
  H1: { data: "2026-06-17", hora: "01:00", cidade: "Los Angeles"       },
  F2: { data: "2026-06-16", hora: "02:00", cidade: "Monterrey"         },
  H2: { data: "2026-06-17", hora: "20:00", cidade: "Miami"             },
  I1: { data: "2026-06-17", hora: "00:00", cidade: "Nova Jérsia"       },
  I2: { data: "2026-06-17", hora: "03:00", cidade: "Boston"            },
  J1: { data: "2026-06-17", hora: "22:00", cidade: "Kansas City"       },
  J2: { data: "2026-06-18", hora: "01:00", cidade: "São Francisco"     },
  K1: { data: "2026-06-18", hora: "00:00", cidade: "Houston"           },
  K2: { data: "2026-06-18", hora: "03:00", cidade: "Dallas"            },
  L1: { data: "2026-06-18", hora: "20:00", cidade: "Filadélfia"        },
  L2: { data: "2026-06-18", hora: "23:00", cidade: "Toronto"           },

  // ── Jornada 2 ──────────────────────────────────────────────────────────────
  A3: { data: "2026-06-19", hora: "17:00", cidade: "Atlanta"           },
  A4: { data: "2026-06-19", hora: "20:00", cidade: "Guadalajara"       },
  B3: { data: "2026-06-19", hora: "20:00", cidade: "Los Angeles"       },
  B4: { data: "2026-06-19", hora: "23:00", cidade: "Vancouver"         },
  C3: { data: "2026-06-20", hora: "20:00", cidade: "Boston"            },
  C4: { data: "2026-06-20", hora: "23:00", cidade: "Houston"           },
  D3: { data: "2026-06-21", hora: "17:00", cidade: "Dallas"            },
  D4: { data: "2026-06-21", hora: "20:00", cidade: "Kansas City"       },
  E3: { data: "2026-06-21", hora: "20:00", cidade: "Seattle"           },
  E4: { data: "2026-06-21", hora: "23:00", cidade: "Miami"             },
  F3: { data: "2026-06-22", hora: "00:00", cidade: "Los Angeles"       },
  F4: { data: "2026-06-22", hora: "03:00", cidade: "Dallas"            },
  G3: { data: "2026-06-22", hora: "20:00", cidade: "Nova Jérsia"       },
  G4: { data: "2026-06-22", hora: "23:00", cidade: "Seattle"           },
  H3: { data: "2026-06-23", hora: "00:00", cidade: "Kansas City"       },
  H4: { data: "2026-06-23", hora: "03:00", cidade: "São Francisco"     },
  I3: { data: "2026-06-23", hora: "20:00", cidade: "Houston"           },
  I4: { data: "2026-06-23", hora: "23:00", cidade: "Atlanta"           },
  J3: { data: "2026-06-24", hora: "00:00", cidade: "Filadélfia"        },
  J4: { data: "2026-06-24", hora: "03:00", cidade: "Miami"             },
  K3: { data: "2026-06-24", hora: "20:00", cidade: "Boston"            },
  K4: { data: "2026-06-24", hora: "23:00", cidade: "Kansas City"       },
  L3: { data: "2026-06-25", hora: "00:00", cidade: "Dallas"            },
  L4: { data: "2026-06-25", hora: "03:00", cidade: "Filadélfia"        },

  // ── Jornada 3 ──────────────────────────────────────────────────────────────
  A5: { data: "2026-06-25", hora: "21:00", cidade: "Cidade do México"  },
  A6: { data: "2026-06-25", hora: "21:00", cidade: "Monterrey"         },
  B5: { data: "2026-06-25", hora: "00:00", cidade: "Vancouver"         },
  B6: { data: "2026-06-25", hora: "00:00", cidade: "Seattle"           },
  C5: { data: "2026-06-26", hora: "00:00", cidade: "Los Angeles"       },
  C6: { data: "2026-06-26", hora: "00:00", cidade: "Atlanta"           },
  D5: { data: "2026-06-26", hora: "02:00", cidade: "Nova Jérsia"       },
  D6: { data: "2026-06-26", hora: "02:00", cidade: "Miami"             },
  E5: { data: "2026-06-26", hora: "21:00", cidade: "Kansas City"       },
  E6: { data: "2026-06-26", hora: "21:00", cidade: "Boston"            },
  F5: { data: "2026-06-27", hora: "00:00", cidade: "Houston"           },
  F6: { data: "2026-06-27", hora: "00:00", cidade: "São Francisco"     },
  G5: { data: "2026-06-27", hora: "02:00", cidade: "Dallas"            },
  G6: { data: "2026-06-27", hora: "02:00", cidade: "Seattle"           },
  H5: { data: "2026-06-27", hora: "21:00", cidade: "Houston"           },
  H6: { data: "2026-06-27", hora: "21:00", cidade: "Guadalajara"       },
  I5: { data: "2026-06-28", hora: "00:00", cidade: "Los Angeles"       },
  I6: { data: "2026-06-28", hora: "00:00", cidade: "Toronto"           },
  J5: { data: "2026-06-28", hora: "02:00", cidade: "Kansas City"       },
  J6: { data: "2026-06-28", hora: "02:00", cidade: "Dallas"            },
  K5: { data: "2026-06-28", hora: "21:00", cidade: "Miami"             },
  K6: { data: "2026-06-28", hora: "21:00", cidade: "Atlanta"           },
  L5: { data: "2026-06-28", hora: "02:00", cidade: "Nova Jérsia"       },
  L6: { data: "2026-06-28", hora: "02:00", cidade: "Filadélfia"        },
};

// Jornada por código
function getJornada(cod) {
  const n = parseInt(cod.slice(1));
  if (n <= 2) return 1;
  if (n <= 4) return 2;
  return 3;
}

// Data formatada PT
function fmtData(d) {
  const [y, m, day] = d.split("-");
  const meses = ["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const dias  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const dt    = new Date(`${d}T12:00:00`);
  return `${dias[dt.getDay()]} ${parseInt(day)} ${meses[parseInt(m)]}`;
}

// ─── CSS embutido ──────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:    #080f1e;
    --bg2:   #0d1a35;
    --bg3:   #112244;
    --card:  #0f1f3d;
    --border: rgba(255,255,255,.07);
    --accent: #f59e0b;
    --accent2:#fcd34d;
    --text:  #e8edf5;
    --muted: #7a90b0;
    --radius: 12px;
    --shadow: 0 4px 24px rgba(0,0,0,.4);
  }
  html { font-size: 15px; }
  body { background: var(--bg); color: var(--text); font-family: "Segoe UI", system-ui, sans-serif;
         min-height: 100vh; padding-bottom: 60px; }

  /* ── Header ── */
  .hero {
    background: linear-gradient(135deg, #0a1628 0%, #1a3a6e 60%, #0d1a35 100%);
    padding: 36px 24px 28px;
    text-align: center;
    border-bottom: 1px solid rgba(245,158,11,.2);
    position: relative; overflow: hidden;
  }
  .hero::before {
    content: ""; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% -20%, rgba(245,158,11,.15) 0%, transparent 60%);
  }
  .hero-trophy { font-size: 3rem; display: block; margin-bottom: 8px; position: relative; }
  .hero-title  { font-size: 1rem; font-weight: 700; color: var(--muted); letter-spacing: .12em;
                 text-transform: uppercase; position: relative; }
  .hero-name   { font-size: 2.2rem; font-weight: 900; color: var(--accent); line-height: 1.15;
                 position: relative; margin: 6px 0 4px; text-shadow: 0 0 40px rgba(245,158,11,.3); }
  .hero-sub    { font-size: .85rem; color: var(--muted); position: relative; }
  .hero-stats  {
    display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
    margin-top: 18px; position: relative;
  }
  .stat-chip {
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
    border-radius: 20px; padding: 5px 14px; font-size: .78rem; font-weight: 600;
  }
  .stat-chip span { color: var(--accent); font-weight: 800; margin-right: 4px; }

  /* ── Sticky filter bar ── */
  .filter-bar {
    position: sticky; top: 0; z-index: 100;
    background: rgba(8,15,30,.96); backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 12px 20px; display: flex; gap: 10px; align-items: center;
    flex-wrap: wrap;
  }
  .search-wrap { position: relative; flex: 1; min-width: 160px; max-width: 260px; }
  .search-wrap input {
    width: 100%; background: var(--bg3); border: 1px solid var(--border);
    color: var(--text); padding: 7px 12px 7px 34px; border-radius: 8px;
    font-size: .82rem; outline: none;
    transition: border-color .2s;
  }
  .search-wrap input:focus { border-color: var(--accent); }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
                 font-size: .8rem; opacity: .5; pointer-events: none; }
  .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip {
    border: 1px solid var(--border); background: transparent;
    color: var(--muted); padding: 5px 12px; border-radius: 20px;
    cursor: pointer; font-size: .75rem; font-weight: 600;
    transition: all .18s; white-space: nowrap;
  }
  .chip:hover  { border-color: var(--accent); color: var(--accent); }
  .chip.active { background: var(--accent); border-color: var(--accent);
                 color: #0a0f1e; }
  .filter-sep  { width: 1px; height: 24px; background: var(--border); flex-shrink: 0; }

  /* ── Conteúdo ── */
  .content { max-width: 980px; margin: 0 auto; padding: 24px 16px; }

  /* ── Grupo de data ── */
  .date-group { margin-bottom: 28px; }
  .date-label {
    display: flex; align-items: center; gap: 10px;
    font-size: .78rem; font-weight: 700; color: var(--muted);
    text-transform: uppercase; letter-spacing: .08em;
    margin-bottom: 12px;
  }
  .date-label::after { content: ""; flex: 1; height: 1px; background: var(--border); }

  /* ── Cards ── */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 12px;
  }
  .game-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    transition: transform .18s, border-color .18s, box-shadow .18s;
    cursor: default;
  }
  .game-card:hover {
    transform: translateY(-2px);
    border-color: rgba(245,158,11,.3);
    box-shadow: 0 8px 32px rgba(0,0,0,.4);
  }
  .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .card-meta { display: flex; gap: 6px; align-items: center; }
  .grupo-badge {
    font-size: .65rem; font-weight: 800; padding: 3px 8px; border-radius: 6px;
    letter-spacing: .05em; text-transform: uppercase;
  }
  .jornada-badge {
    font-size: .65rem; color: var(--muted); font-weight: 600;
    background: var(--bg3); padding: 3px 8px; border-radius: 6px;
  }
  .card-time { font-size: .72rem; color: var(--muted); }

  /* Teams */
  .teams { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
  .team  { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
  .team-flag { font-size: 2rem; line-height: 1; }
  .team-name { font-size: .72rem; font-weight: 600; color: var(--text);
               text-align: center; max-width: 90px; line-height: 1.2; }
  .vs { font-size: .8rem; font-weight: 800; color: var(--muted); flex-shrink: 0; }

  /* Prediction */
  .prediction {
    margin-top: 14px;
    background: linear-gradient(135deg, rgba(245,158,11,.08), rgba(245,158,11,.03));
    border: 1px solid rgba(245,158,11,.2);
    border-radius: 10px;
    padding: 10px 14px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .pred-label { font-size: .65rem; font-weight: 700; color: var(--accent);
                text-transform: uppercase; letter-spacing: .08em; }
  .pred-score {
    font-size: 1.5rem; font-weight: 900; color: var(--accent2);
    letter-spacing: .04em; text-shadow: 0 0 20px rgba(245,158,11,.4);
  }
  .pred-score.empty { font-size: .85rem; color: var(--muted); font-weight: 600; }
  .pred-city { font-size: .65rem; color: var(--muted); text-align: right; line-height: 1.3; }

  /* Cores por grupo */
  .g-A { background: rgba(239,68,68,.15);  color: #fca5a5; border-color: rgba(239,68,68,.3); }
  .g-B { background: rgba(249,115,22,.15); color: #fdba74; border-color: rgba(249,115,22,.3); }
  .g-C { background: rgba(234,179,8,.15);  color: #fde047; border-color: rgba(234,179,8,.3); }
  .g-D { background: rgba(34,197,94,.15);  color: #86efac; border-color: rgba(34,197,94,.3); }
  .g-E { background: rgba(6,182,212,.15);  color: #67e8f9; border-color: rgba(6,182,212,.3); }
  .g-F { background: rgba(99,102,241,.15); color: #a5b4fc; border-color: rgba(99,102,241,.3); }
  .g-G { background: rgba(168,85,247,.15); color: #d8b4fe; border-color: rgba(168,85,247,.3); }
  .g-H { background: rgba(236,72,153,.15); color: #f9a8d4; border-color: rgba(236,72,153,.3); }
  .g-I { background: rgba(20,184,166,.15); color: #5eead4; border-color: rgba(20,184,166,.3); }
  .g-J { background: rgba(245,158,11,.15); color: #fcd34d; border-color: rgba(245,158,11,.3); }
  .g-K { background: rgba(59,130,246,.15); color: #93c5fd; border-color: rgba(59,130,246,.3); }
  .g-L { background: rgba(16,185,129,.15); color: #6ee7b7; border-color: rgba(16,185,129,.3); }

  /* No results */
  .no-results { text-align: center; padding: 60px 20px; color: var(--muted); }
  .no-results-icon { font-size: 3rem; margin-bottom: 12px; }

  /* Footer */
  .footer {
    text-align: center; padding: 24px; color: var(--muted); font-size: .75rem;
    border-top: 1px solid var(--border); margin-top: 40px;
  }

  @media (max-width: 600px) {
    .hero-name { font-size: 1.7rem; }
    .cards-grid { grid-template-columns: 1fr; }
  }
`;

// ─── Dados auxiliares ──────────────────────────────────────────────────────────
const FLAGS = {
  "México":"🇲🇽","África do Sul":"🇿🇦","Coreia do Sul":"🇰🇷","Chéquia":"🇨🇿",
  "Canadá":"🇨🇦","Bósnia e Herzegovina":"🇧🇦","Catar":"🇶🇦","Suíça":"🇨🇭",
  "Brasil":"🇧🇷","Haiti":"🇭🇹","Escócia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Marrocos":"🇲🇦",
  "Estados Unidos":"🇺🇸","Paraguai":"🇵🇾","Austrália":"🇦🇺","Turquia":"🇹🇷",
  "Alemanha":"🇩🇪","Curaçau":"🇨🇼","Costa do Marfim":"🇨🇮","Equador":"🇪🇨",
  "Holanda":"🇳🇱","Japão":"🇯🇵","Suécia":"🇸🇪","Tunísia":"🇹🇳",
  "Bélgica":"🇧🇪","Egito":"🇪🇬","Irão":"🇮🇷","Nova Zelândia":"🇳🇿",
  "Espanha":"🇪🇸","Cabo Verde":"🇨🇻","Arábia Saudita":"🇸🇦","Uruguai":"🇺🇾",
  "Argentina":"🇦🇷","Argélia":"🇩🇿","Áustria":"🇦🇹","Jordânia":"🇯🇴",
  "Portugal":"🇵🇹","RD Congo":"🇨🇩","Uzbequistão":"🇺🇿","Colômbia":"🇨🇴",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croácia":"🇭🇷","Gana":"🇬🇭","Panamá":"🇵🇦",
  "França":"🇫🇷","Senegal":"🇸🇳","Iraque":"🇮🇶","Noruega":"🇳🇴",
  "Polónia":"🇵🇱","Cuba":"🇨🇺","Roménia":"🇷🇴","Venezuela":"🇻🇪",
  "Costa Rica":"🇨🇷","Jamaica":"🇯🇲","Dinamarca":"🇩🇰","Sérvia":"🇷🇸",
  "República Dominicana":"🇩🇴","Grécia":"🇬🇷","Ucrânia":"🇺🇦",
  "Cazaquistão":"🇰🇿","Guiné":"🇬🇳","Israel":"🇮🇱","Tailândia":"🇹🇭",
  "Itália":"🇮🇹","China":"🇨🇳","Nigéria":"🇳🇬","Suécia":"🇸🇪",
};
const fl = t => FLAGS[t] || "🏳";

// Gerar JS para os dados embutidos no HTML
function buildEmbeddedData(nome, pi) {
  const preds = DADOS.prognosticos[nome] || {};
  const jogos = DADOS.jogos.map(j => {
    const sch  = SCHEDULE[j.codigo] || { data: "2026-06-11", hora: "00:00", cidade: "" };
    const pred = preds[j.codigo];
    const jornada = getJornada(j.codigo);
    return {
      codigo: j.codigo,
      grupo:  j.grupo,
      casa:   j.casa,
      fora:   j.fora,
      casaFlag: fl(j.casa),
      foraFlag: fl(j.fora),
      data:   sch.data,
      hora:   sch.hora,
      cidade: sch.cidade,
      jornada,
      pred:   pred ? `${pred.casa}-${pred.fora}` : null,
    };
  });
  return JSON.stringify(jogos);
}

// ─── Gerar HTML ───────────────────────────────────────────────────────────────
function buildHTML(nome, pi) {
  const jogosJSON = buildEmbeddedData(nome, pi);
  const totalPreds = DADOS.jogos.filter(j => DADOS.prognosticos[nome]?.[j.codigo]).length;
  const grupos = [...new Set(DADOS.jogos.map(j => j.grupo))].sort();

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Previsões de ${nome} — Predictor Mundial 2026</title>
  <style>${CSS}</style>
</head>
<body>

<!-- HERO -->
<div class="hero">
  <span class="hero-trophy">🏆</span>
  <div class="hero-title">Predictor Parque Biológico · Mundial 2026</div>
  <div class="hero-name">${nome}</div>
  <div class="hero-sub">As tuas previsões para os 72 jogos da fase de grupos</div>
  <div class="hero-stats">
    <div class="stat-chip"><span>${totalPreds}</span>previsões registadas</div>
    <div class="stat-chip"><span>3</span>jornadas</div>
    <div class="stat-chip"><span>12</span>grupos</div>
  </div>
</div>

<!-- FILTER BAR -->
<div class="filter-bar">
  <div class="search-wrap">
    <span class="search-icon">🔍</span>
    <input type="text" id="searchInput" placeholder="Pesquisar equipa ou jogo…" oninput="applyFilters()">
  </div>
  <div class="filter-sep"></div>
  <div class="filter-chips" id="filterChips">
    <button class="chip active" data-filter="all"        onclick="setFilter('all')">Todos</button>
    <button class="chip"        data-filter="j1"         onclick="setFilter('j1')">Jornada 1</button>
    <button class="chip"        data-filter="j2"         onclick="setFilter('j2')">Jornada 2</button>
    <button class="chip"        data-filter="j3"         onclick="setFilter('j3')">Jornada 3</button>
    <div class="filter-sep"></div>
    ${grupos.map(g => `<button class="chip" data-filter="g${g}" onclick="setFilter('g${g}')">Gr. ${g}</button>`).join("")}
  </div>
</div>

<!-- CONTENT -->
<div class="content" id="content"></div>

<div class="footer">
  Predictor Parque Biológico — Mundial 2026 &nbsp;·&nbsp; Previsões de <strong>${nome}</strong>
  &nbsp;·&nbsp; Documento gerado a ${new Date().toLocaleDateString("pt-PT")}
</div>

<script>
const JOGOS = ${jogosJSON};

let activeFilter = "all";

function setFilter(f) {
  activeFilter = f;
  document.querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("active", c.dataset.filter === f);
  });
  applyFilters();
}

function applyFilters() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();

  const filtered = JOGOS.filter(j => {
    // Filtro de texto
    const txt = (j.casa + j.fora + j.codigo + j.grupo).toLowerCase();
    if (q && !txt.includes(q)) return false;

    // Filtro activo
    if (activeFilter === "all") return true;
    if (activeFilter === "j1")  return j.jornada === 1;
    if (activeFilter === "j2")  return j.jornada === 2;
    if (activeFilter === "j3")  return j.jornada === 3;
    if (activeFilter.startsWith("g")) return j.grupo === activeFilter.slice(1);
    return true;
  });

  render(filtered);
}

function render(jogos) {
  const content = document.getElementById("content");

  if (!jogos.length) {
    content.innerHTML = \`
      <div class="no-results">
        <div class="no-results-icon">🔎</div>
        <div>Nenhuma previsão encontrada</div>
      </div>\`;
    return;
  }

  // Agrupar por data
  const byDate = {};
  jogos.forEach(j => {
    if (!byDate[j.data]) byDate[j.data] = [];
    byDate[j.data].push(j);
  });

  const sortedDates = Object.keys(byDate).sort();
  let html = "";

  sortedDates.forEach(data => {
    const label = fmtData(data);
    const cards = byDate[data].map(j => renderCard(j)).join("");
    html += \`
      <div class="date-group" data-date="\${data}">
        <div class="date-label">📅 \${label}</div>
        <div class="cards-grid">\${cards}</div>
      </div>\`;
  });

  content.innerHTML = html;
}

function renderCard(j) {
  const predHTML = j.pred
    ? \`<div class="pred-score">\${j.pred}</div>\`
    : \`<div class="pred-score empty">Sem previsão</div>\`;

  return \`
    <div class="game-card">
      <div class="card-top">
        <div class="card-meta">
          <span class="grupo-badge g-\${j.grupo}">Grupo \${j.grupo}</span>
          <span class="jornada-badge">J\${j.jornada}</span>
          <span style="font-size:.65rem;color:var(--muted);font-weight:700">\${j.codigo}</span>
        </div>
        <div class="card-time">🕐 \${j.hora}</div>
      </div>

      <div class="teams">
        <div class="team">
          <div class="team-flag">\${j.casaFlag}</div>
          <div class="team-name">\${j.casa}</div>
        </div>
        <div class="vs">vs</div>
        <div class="team">
          <div class="team-flag">\${j.foraFlag}</div>
          <div class="team-name">\${j.fora}</div>
        </div>
      </div>

      <div class="prediction">
        <div>
          <div class="pred-label">🎯 A tua previsão</div>
          \${predHTML}
        </div>
        <div class="pred-city">📍 \${j.cidade}</div>
      </div>
    </div>\`;
}

function fmtData(d) {
  const dt = new Date(d + "T12:00:00");
  const dias  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return dias[dt.getDay()] + " " + dt.getDate() + " " + meses[dt.getMonth()];
}

// Render inicial
render(JOGOS);
</script>
</body>
</html>`;
}

// ─── Gerar os 10 ficheiros ────────────────────────────────────────────────────
const outDir = path.join(__dirname, "previsoes_jogadores");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

DADOS.participantes.forEach((nome, pi) => {
  const safeName = nome
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")  // remove acentos
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");
  const filename = `Previsoes_${safeName}.html`;
  const filepath = path.join(outDir, filename);
  fs.writeFileSync(filepath, buildHTML(nome, pi), "utf8");
  console.log(`✅  ${filename}`);
});

console.log(`\n📁  Pasta: ${outDir}`);
console.log(`🎉  ${DADOS.participantes.length} ficheiros gerados!`);
