// ─── FLAGS ──────────────────────────────────────────────────────────────────
const FLAGS = {
  "México":"🇲🇽","África do Sul":"🇿🇦","Coreia do Sul":"🇰🇷","Chéquia":"🇨🇿",
  "Canadá":"🇨🇦","Bósnia e Herzegovina":"🇧🇦","Catar":"🇶🇦","Suíça":"🇨🇭",
  "Brasil":"🇧🇷","Haiti":"🇭🇹","Escócia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Marrocos":"🇲🇦",
  "Estados Unidos":"🇺🇸","Paraguai":"🇵🇾","Austrália":"🇦🇺","Turquia":"🇹🇷",
  "Alemanha":"🇩🇪","Curaçau":"🇨🇼","Costa do Marfim":"🇨🇮","Equador":"🇪🇨",
  "Holanda":"🇳🇱","Japão":"🇯🇵","Suécia":"🇸🇪","Tunísia":"🇹🇳",
  "Bélgica":"🇧🇪","Egito":"🇪🇬","Irão":"🇮🇷","Nova Zelândia":"🇳🇿",
  "Espanha":"🇪🇸","Cabo Verde":"🇨🇻","Arábia Saudita":"🇸🇦","Uruguai":"🇺🇾",
  "Argentina":"🇦🇷","Polónia":"🇵🇱","Senegal":"🇸🇳","Cuba":"🇨🇺",
  "França":"🇫🇷","Argélia":"🇩🇿","Gâmbia":"🇬🇲","China":"🇨🇳",
  "Nigéria":"🇳🇬","Roménia":"🇷🇴","Portugal":"🇵🇹","Uzbequistão":"🇺🇿",
  "Colômbia":"🇨🇴","RD Congo":"🇨🇩","Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croácia":"🇭🇷",
  "Gana":"🇬🇭","Panamá":"🇵🇦","Itália":"🇮🇹","Venezuela":"🇻🇪",
  "Costa Rica":"🇨🇷","Jamaica":"🇯🇲","Dinamarca":"🇩🇰","Sérvia":"🇷🇸",
  "República Dominicana":"🇩🇴","Grécia":"🇬🇷","Ucrânia":"🇺🇦",
  "Cazaquistão":"🇰🇿","Guiné":"🇬🇳","Iraque":"🇮🇶","Áustria":"🇦🇹",
  "Jordânia":"🇯🇴","Noruega":"🇳🇴","Israel":"🇮🇱","Tailândia":"🇹🇭",
};
const fl = t => (FLAGS[t] || "🏳") + " " + t;

// ─── RESULTADOS (localStorage) ───────────────────────────────────────────────
const LS_KEY = "predictor_resultados_2026";

function getResultados() {
  try {
    const r = localStorage.getItem(LS_KEY);
    if (r) return JSON.parse(r);
  } catch {}
  const init = {};
  for (const j of DADOS.jogos) {
    if (j.estado === "FT" && j.gc !== null) {
      init[j.codigo] = { gc: j.gc, gf: j.gf };
    }
  }
  saveResultados(init);
  return init;
}
function saveResultados(r) { localStorage.setItem(LS_KEY, JSON.stringify(r)); }

// ─── SCORING (não cumulativo: um tipo por jogo) ───────────────────────────────
function vit(a, b) { return a > b ? "c" : b > a ? "f" : "e"; }

function getTipo(pgc, pgf, rgc, rgf) {
  if (rgc === null || rgc === undefined) return "Pendente";
  if (pgc === rgc && pgf === rgf) return "Exato";
  if (vit(pgc, pgf) === vit(rgc, rgf)) return "Vencedor/Empate";
  if (pgc === rgc || pgf === rgf) return "Golos Equipa";
  return "Não Pontuou";
}

function getPontos(tipo) {
  return { "Exato": 5, "Vencedor/Empate": 2, "Golos Equipa": 1, "Não Pontuou": 0, "Pendente": 0 }[tipo] ?? 0;
}

function calcParticipante(nome, resultados) {
  const progs = DADOS.prognosticos[nome] || {};
  let pts = 0, exatos = 0, ve = 0, golos = 0, naoPontua = 0;
  for (const j of DADOS.jogos) {
    const p = progs[j.codigo];
    const r = resultados[j.codigo];
    if (!p) continue;
    const tipo = getTipo(p.casa, p.fora, r?.gc, r?.gf);
    pts += getPontos(tipo);
    if (tipo === "Exato") exatos++;
    else if (tipo === "Vencedor/Empate") ve++;
    else if (tipo === "Golos Equipa") golos++;
    else if (tipo === "Não Pontuou") naoPontua++;
  }
  return { nome, pts, exatos, ve, golos, naoPontua };
}

function calcClassificacao(resultados) {
  const stats = DADOS.participantes.map(n => calcParticipante(n, resultados));
  stats.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.exatos !== a.exatos) return b.exatos - a.exatos;
    if (b.ve !== a.ve) return b.ve - a.ve;
    if (b.golos !== a.golos) return b.golos - a.golos;
    if (a.naoPontua !== b.naoPontua) return a.naoPontua - b.naoPontua;
    return a.nome.localeCompare(b.nome);
  });
  const half = Math.floor(stats.length / 2);
  return stats.map((s, i) => ({ ...s, pos: i + 1, paga: i >= half }));
}

const TIPO_CSS = {
  "Exato": "tipo-exato", "Vencedor/Empate": "tipo-ve",
  "Golos Equipa": "tipo-golos", "Não Pontuou": "tipo-nao", "Pendente": "tipo-pendente",
};

// ─── MATA-MATA ───────────────────────────────────────────────────────────────
const LS_MM_KEY = "predictor_matamata_2026";
const MM_ROUNDS = [
  { id: "r32", name: "Round of 32",      count: 16, abbr: "R32" },
  { id: "r16", name: "Oitavos de Final", count: 8,  abbr: "R16" },
  { id: "qf",  name: "Quartos de Final", count: 4,  abbr: "QF"  },
  { id: "sf",  name: "Meias-Final",      count: 2,  abbr: "SF"  },
  { id: "tp",  name: "3.º Lugar",        count: 1,  abbr: "3.º" },
  { id: "f",   name: "Final",            count: 1,  abbr: "🏆"  },
];
const MM_SEQ = ["r32", "r16", "qf", "sf", "f"]; // main bracket (tp is parallel)

function getMataMata() {
  try {
    const s = localStorage.getItem(LS_MM_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return initMataMata();
}
function initMataMata() {
  const mm = {};
  for (const r of MM_ROUNDS) {
    mm[r.id] = Array.from({ length: r.count }, () => ({
      e1: "", e2: "", gc: null, gf: null, pen_winner: null
    }));
  }
  saveMataMata(mm);
  return mm;
}
function saveMataMata(mm) { localStorage.setItem(LS_MM_KEY, JSON.stringify(mm)); }

function mmWinner(game) {
  if (game.gc === null || game.gf === null) return null;
  if (!game.e1 && !game.e2) return null;
  if (game.gc > game.gf) return game.e1 || null;
  if (game.gf > game.gc) return game.e2 || null;
  return game.pen_winner || null;
}
function mmLoser(game) {
  const w = mmWinner(game);
  if (!w) return null;
  return w === game.e1 ? game.e2 : game.e1;
}

function mmPropagate(mm, roundId, gameIdx) {
  const game = mm[roundId][gameIdx];
  const winner = mmWinner(game);
  const loser  = mmLoser(game);
  const mi = MM_SEQ.indexOf(roundId);

  if (mi >= 0 && mi < MM_SEQ.length - 1 && winner) {
    const nextRound = MM_SEQ[mi + 1];
    const nextGame  = Math.floor(gameIdx / 2);
    const slot      = gameIdx % 2;
    mm[nextRound][nextGame][slot === 0 ? "e1" : "e2"] = winner;
  }
  if (roundId === "sf") {
    if (loser) mm.tp[0][gameIdx === 0 ? "e1" : "e2"] = loser;
  }
}

let mmActiveRound = "r32";

// ─── TABS ────────────────────────────────────────────────────────────────────
let activeTab = "resultados";

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-content").forEach(c =>
    c.classList.toggle("active", c.id === "tab-" + tab));
  renderTab(tab);
}

function renderTab(tab) {
  const r = getResultados();
  if      (tab === "resultados")   renderResultados(r);
  else if (tab === "classificacao") renderClassificacao(r);
  else if (tab === "revisao")      renderRevisao(r);
  else if (tab === "grupos")       renderGrupos(r);
  else if (tab === "whatsapp")     renderWhatsapp(r);
  else if (tab === "matamata")     renderMataMata(getMataMata());
}

// ─── PARSE ───────────────────────────────────────────────────────────────────
function parseRes(str) {
  const m = str.trim().match(/^(\d+)\s*[-–]\s*(\d+)$/);
  return m ? { gc: parseInt(m[1]), gf: parseInt(m[2]) } : null;
}

// ─── TAB: RESULTADOS ─────────────────────────────────────────────────────────
function renderResultados(resultados) {
  const grupos = [...new Set(DADOS.jogos.map(j => j.grupo))];
  const container = document.getElementById("resultados-content");
  let html = "";
  for (const g of grupos) {
    const jogos = DADOS.jogos.filter(j => j.grupo === g);
    const done = jogos.filter(j => resultados[j.codigo]).length;
    html += `<div class="grupo-block">
      <div class="grupo-header">Grupo ${g} <span class="grupo-prog">${done}/${jogos.length}</span></div>
      <table class="res-table">
        <thead><tr><th>Cód.</th><th>Jogo</th><th>Resultado</th><th>Estado</th></tr></thead>
        <tbody>`;
    for (const j of jogos) {
      const r = resultados[j.codigo];
      const val = r ? `${r.gc}-${r.gf}` : "";
      const ft = r !== undefined;
      html += `<tr class="${ft ? "row-ft" : ""}">
        <td><span class="badge-grupo">${j.codigo}</span></td>
        <td class="jogo-nome">${fl(j.casa)} <span class="vs">vs</span> ${fl(j.fora)}</td>
        <td><input type="text" class="res-input ${ft ? "res-filled" : ""}" placeholder="ex: 2-1"
          value="${val}" data-codigo="${j.codigo}" maxlength="7" /></td>
        <td><span class="estado-badge ${ft ? "estado-ft" : "estado-pendente"}">${ft ? "✅ FT" : "⏳ PEND."}</span></td>
      </tr>`;
    }
    html += `</tbody></table></div>`;
  }
  container.innerHTML = html;
  container.querySelectorAll(".res-input").forEach(inp => {
    inp.addEventListener("change", e => onResultadoChange(e.target));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
  });
}

function onResultadoChange(inp) {
  const cod = inp.dataset.codigo;
  const val = inp.value.trim();
  const resultados = getResultados();
  if (!val || val === "-") {
    delete resultados[cod];
    saveResultados(resultados);
    renderTab(activeTab);
    return;
  }
  const parsed = parseRes(val);
  if (!parsed) {
    inp.classList.add("res-error");
    inp.title = "Formato inválido. Use: 2-1";
    setTimeout(() => { inp.classList.remove("res-error"); inp.title = ""; }, 2000);
    return;
  }
  resultados[cod] = parsed;
  saveResultados(resultados);
  renderTab(activeTab);
}

// ─── TAB: CLASSIFICAÇÃO ──────────────────────────────────────────────────────
function renderClassificacao(resultados) {
  const cls = calcClassificacao(resultados);
  const jogados = DADOS.jogos.filter(j => resultados[j.codigo]).length;
  const totalPts = cls[0]?.pts ?? 0;
  const container = document.getElementById("classificacao-content");
  let html = `<div class="cls-info">
    <span>⚽ <strong>${jogados}</strong> / ${DADOS.jogos.length} jogos</span>
    <span>🏆 Líder: <strong>${cls[0]?.nome ?? "—"}</strong> com <strong>${totalPts} pts</strong></span>
  </div>
  <table class="cls-table">
    <thead><tr>
      <th>#</th><th>Participante</th>
      <th title="Pontos Totais">Pts</th>
      <th title="Exactos (5pts)">✅</th>
      <th title="Vencedor/Empate (2pts)">⚽</th>
      <th title="Golos Equipa (1pt)">🎯</th>
      <th title="Não Pontuou">❌</th>
      <th>Jantar</th>
    </tr></thead><tbody>`;
  for (const s of cls) {
    const posClass = s.pos <= 3 ? `pos-${s.pos}` : "";
    html += `<tr class="${posClass} ${s.paga ? "paga-sim" : "paga-nao"}">
      <td class="pos-col">${s.pos === 1 ? "🥇" : s.pos === 2 ? "🥈" : s.pos === 3 ? "🥉" : s.pos}</td>
      <td class="nome-col"><strong>${s.nome}</strong></td>
      <td class="pts-col"><strong>${s.pts}</strong></td>
      <td>${s.exatos}</td><td>${s.ve}</td><td>${s.golos}</td><td>${s.naoPontua}</td>
      <td><span class="jantar-badge ${s.paga ? "paga" : "nao-paga"}">${s.paga ? "🍽️ PAGA" : "🎉 NÃO PAGA"}</span></td>
    </tr>`;
  }
  html += `</tbody></table>
    <div class="cls-legenda">
      <span class="legenda-item paga-nao-ex">Top 5 — Não paga jantar</span>
      <span class="legenda-item paga-sim-ex">Bottom 5 — Paga jantar</span>
      <span class="legenda-item" style="margin-left:auto;color:var(--text-muted);font-size:.75rem">Pontuação: Exato=5pts · VE=2pts · Golos=1pt</span>
    </div>`;
  container.innerHTML = html;
}

// ─── TAB: REVISÃO LARGA ──────────────────────────────────────────────────────
function renderRevisao(resultados) {
  const container = document.getElementById("revisao-content");
  const participantes = DADOS.participantes;
  let html = `<div class="revisao-scroll"><table class="revisao-table">
    <thead>
      <tr>
        <th class="sticky-col">Jogo / Resultado</th>
        ${participantes.map(p => `<th class="p-header" title="${p}">${p.split(" ")[0]}</th>`).join("")}
      </tr>
    </thead><tbody>`;
  let lastGrupo = "";
  for (const j of DADOS.jogos) {
    if (j.grupo !== lastGrupo) {
      lastGrupo = j.grupo;
      html += `<tr class="grupo-sep"><td colspan="${participantes.length + 1}">Grupo ${j.grupo}</td></tr>`;
    }
    const r = resultados[j.codigo];
    html += `<tr>
      <td class="sticky-col jogo-cell">
        <span class="cod-small">${j.codigo}</span>
        ${r ? `<span class="res-badge">${r.gc}-${r.gf}</span>` : `<span class="pendente-dot">·</span>`}
        <span class="equipas-small">${fl(j.casa)} × ${fl(j.fora)}</span>
      </td>`;
    for (const p of participantes) {
      const prog = DADOS.prognosticos[p]?.[j.codigo];
      if (!prog) { html += `<td class="tipo-pendente">—</td>`; continue; }
      const tipo = getTipo(prog.casa, prog.fora, r?.gc, r?.gf);
      const pts = getPontos(tipo);
      html += `<td class="${TIPO_CSS[tipo]}" title="${p}: ${prog.resultado} | ${tipo} | ${pts}pts">
        <span class="prog-val">${prog.resultado}</span>
        ${r ? `<span class="pts-small">${pts}p</span>` : ""}
      </td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table></div>
    <div class="revisao-legenda">
      <span class="tipo-exato leg">✅ Exato (5pts)</span>
      <span class="tipo-ve leg">⚽ Venc/Empate (2pts)</span>
      <span class="tipo-golos leg">🎯 Golos Equipa (1pt)</span>
      <span class="tipo-nao leg">❌ Não Pontuou (0pts)</span>
      <span class="tipo-pendente leg">⏳ Pendente</span>
    </div>`;
  container.innerHTML = html;
}

// ─── TAB: GRUPOS ─────────────────────────────────────────────────────────────
function renderGrupos(resultados) {
  const container = document.getElementById("grupos-content");
  const grupos = [...new Set(DADOS.jogos.map(j => j.grupo))];

  function standingGrupo(grupo) {
    const jogos = DADOS.jogos.filter(j => j.grupo === grupo);
    const equipas = new Set();
    jogos.forEach(j => { equipas.add(j.casa); equipas.add(j.fora); });
    const stats = {};
    equipas.forEach(e => { stats[e] = { e, pj:0, v:0, ep:0, d:0, gm:0, gs:0, gd:0, pts:0 }; });
    for (const j of jogos) {
      const r = resultados[j.codigo];
      if (!r) continue;
      const { gc, gf } = r;
      const sc = stats[j.casa], sf = stats[j.fora];
      sc.pj++; sf.pj++;
      sc.gm += gc; sc.gs += gf; sc.gd += gc - gf;
      sf.gm += gf; sf.gs += gc; sf.gd += gf - gc;
      if (gc > gf)      { sc.v++; sc.pts += 3; sf.d++; }
      else if (gc < gf) { sf.v++; sf.pts += 3; sc.d++; }
      else              { sc.ep++; sc.pts++; sf.ep++; sf.pts++; }
    }
    return Object.values(stats).sort((a, b) =>
      b.pts - a.pts || b.gd - a.gd || b.gm - a.gm || a.e.localeCompare(b.e));
  }

  let html = `<div class="grupos-grid">`;
  for (const g of grupos) {
    const st = standingGrupo(g);
    html += `<div class="grupo-card">
      <div class="grupo-card-header">Grupo ${g}</div>
      <table class="grupo-table">
        <thead><tr><th></th><th>Equipa</th><th>PJ</th><th>V</th><th>E</th><th>D</th><th>GM</th><th>GS</th><th>GD</th><th>Pts</th></tr></thead>
        <tbody>`;
    st.forEach((s, i) => {
      const qClass = i < 2 ? "qualifica" : i === 2 ? "terceiro" : "";
      html += `<tr class="${qClass}">
        <td class="pos-num">${i+1}</td>
        <td class="equipa-nome">${fl(s.e)}</td>
        <td>${s.pj}</td><td>${s.v}</td><td>${s.ep}</td><td>${s.d}</td>
        <td>${s.gm}</td><td>${s.gs}</td>
        <td>${s.gd > 0 ? "+"+s.gd : s.gd}</td>
        <td><strong>${s.pts}</strong></td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }
  html += `</div>
    <div class="grupos-legenda">
      <span class="qualifica-ex">▶ Qualificados (1.º e 2.º)</span>
      <span class="terceiro-ex">▶ Terceiro (pode qualificar)</span>
    </div>`;
  container.innerHTML = html;
}

// ─── TAB: WHATSAPP ───────────────────────────────────────────────────────────
function renderWhatsapp(resultados) {
  const container = document.getElementById("whatsapp-content");
  const jogosFeitos = DADOS.jogos.filter(j => resultados[j.codigo]);
  if (!jogosFeitos.length) {
    container.innerHTML = `<div class="wa-empty">Ainda não há resultados. Vai ao separador <strong>Resultados</strong> e introduz resultados.</div>`;
    return;
  }
  const cls = calcClassificacao(resultados);

  let msgGeral = `🌍 *PREDICTOR PARQUE BIOLÓGICO — MUNDIAL 2026*\n`;
  msgGeral += `📊 _Classificação — ${jogosFeitos.length} jogo(s) jogado(s):_\n\n`;
  for (const s of cls) {
    const medal = s.pos === 1 ? "🥇" : s.pos === 2 ? "🥈" : s.pos === 3 ? "🥉" : `${s.pos}.`;
    msgGeral += `${medal} *${s.nome}* — ${s.pts}pts`;
    if (s.exatos > 0) msgGeral += ` (${s.exatos} ✅)`;
    msgGeral += "\n";
  }
  msgGeral += `\n💰 _Paga jantar: ${cls.filter(s => s.paga).map(s => s.nome.split(" ")[0]).join(", ")}_`;
  msgGeral += `\n🍾 _Não paga: ${cls.filter(s => !s.paga).map(s => s.nome.split(" ")[0]).join(", ")}_`;

  const recentes = [...jogosFeitos].reverse().slice(0, 8);
  let msgJogos = `⚽ *RESULTADOS RECENTES — MUNDIAL 2026*\n\n`;
  for (const j of recentes) {
    const r = resultados[j.codigo];
    msgJogos += `*${fl(j.casa)} ${r.gc}–${r.gf} ${fl(j.fora)}*\n`;
    msgJogos += `_${j.codigo} · Grupo ${j.grupo}_\n`;
    const EMOJI = { "Exato":"✅","Vencedor/Empate":"⚽","Golos Equipa":"🎯","Não Pontuou":"❌","Pendente":"⏳" };
    for (const p of DADOS.participantes) {
      const prog = DADOS.prognosticos[p]?.[j.codigo];
      if (!prog) continue;
      const tipo = getTipo(prog.casa, prog.fora, r.gc, r.gf);
      const pts = getPontos(tipo);
      msgJogos += `${EMOJI[tipo]} ${p.split(" ")[0].padEnd(9)} ${prog.resultado}  (+${pts})\n`;
    }
    msgJogos += "\n";
  }

  let html = `<div class="wa-container">
    <div class="wa-block">
      <div class="wa-title">📊 Classificação Geral</div>
      <textarea class="wa-textarea" id="wa-geral" readonly>${msgGeral}</textarea>
      <button class="btn-copy" onclick="copyWA('wa-geral')">📋 Copiar para WhatsApp</button>
    </div>
    <div class="wa-block">
      <div class="wa-title">⚽ Últimos Resultados (${recentes.length})</div>
      <textarea class="wa-textarea" id="wa-jogos" readonly>${msgJogos}</textarea>
      <button class="btn-copy" onclick="copyWA('wa-jogos')">📋 Copiar para WhatsApp</button>
    </div>
  </div>`;
  container.innerHTML = html;
}

function copyWA(id) {
  const ta = document.getElementById(id);
  navigator.clipboard.writeText(ta.value).then(() => {
    const btn = ta.nextElementSibling;
    const orig = btn.textContent;
    btn.textContent = "✅ Copiado!";
    setTimeout(() => { btn.textContent = orig; }, 2500);
  }).catch(() => { ta.select(); document.execCommand("copy"); });
}

// ─── TAB: MATA-MATA ──────────────────────────────────────────────────────────
function setMMRound(id) {
  mmActiveRound = id;
  renderMataMata(getMataMata());
}

function renderMataMata(mm) {
  const container = document.getElementById("matamata-content");

  // Round selector
  let html = `<div class="mm-round-tabs">`;
  for (const r of MM_ROUNDS) {
    const done  = mm[r.id].filter(g => g.gc !== null).length;
    html += `<button class="mm-round-btn ${mmActiveRound === r.id ? "active" : ""}"
      onclick="setMMRound('${r.id}')">${r.abbr}
      <span class="mm-prog ${done === r.count ? "mm-prog-done" : ""}">${done}/${r.count}</span>
    </button>`;
  }
  html += `</div>`;

  // Bracket overview (collapsible)
  html += buildBracketHTML(mm);

  // Active round
  const cfg = MM_ROUNDS.find(r => r.id === mmActiveRound);
  html += `<div class="mm-section">
    <div class="mm-section-header">
      <h2 class="mm-section-title">${cfg.name}</h2>
      <span class="mm-hint">Introduz equipa + resultado (ex: 2-1). Em empate, escolhe quem passa via AET/PEN.</span>
    </div>
    <div class="mm-games-list">`;
  mm[mmActiveRound].forEach((game, idx) => {
    html += buildMMCard(game, mmActiveRound, idx);
  });
  html += `</div></div>`;

  container.innerHTML = html;
  attachMMEvents(container, mm);
}

function buildMMCard(game, roundId, idx) {
  const winner = mmWinner(game);
  const hasRes = game.gc !== null && game.gf !== null;
  const isDraw = hasRes && game.gc === game.gf && !game.pen_winner;
  const e1win = winner === game.e1 && game.e1;
  const e2win = winner === game.e2 && game.e2;
  const f1 = FLAGS[game.e1] || (game.e1 ? "🏳" : "");
  const f2 = FLAGS[game.e2] || (game.e2 ? "🏳" : "");
  const scoreVal = hasRes ? `${game.gc}-${game.gf}` : "";

  return `<div class="mm-card ${winner ? "mm-done" : ""}" id="mmc-${roundId}-${idx}">
    <div class="mm-card-num">${idx + 1}</div>

    <div class="mm-team-block ${e1win ? "team-win" : (hasRes && winner ? "team-lose" : "")}">
      <span class="mm-team-flag">${f1}</span>
      <input class="mm-team-inp" placeholder="Equipa 1" value="${esc(game.e1)}"
        data-round="${roundId}" data-idx="${idx}" data-field="e1" />
    </div>

    <div class="mm-center">
      <input class="mm-score-inp ${hasRes ? "score-filled" : ""}" placeholder="0-0"
        value="${scoreVal}" data-round="${roundId}" data-idx="${idx}" maxlength="7" />
      ${isDraw ? `<div class="mm-pen-row">
        <span class="mm-pen-label">⏱ AET/PEN — passa:</span>
        <button class="mm-pen-btn" data-round="${roundId}" data-idx="${idx}" data-winner="${esc(game.e1)}">${f1} ${esc(game.e1) || "E1"}</button>
        <button class="mm-pen-btn" data-round="${roundId}" data-idx="${idx}" data-winner="${esc(game.e2)}">${f2} ${esc(game.e2) || "E2"}</button>
      </div>` : ""}
      ${winner ? `<div class="mm-winner-label">✅ ${FLAGS[winner] || "🏆"} <strong>${winner}</strong> passa</div>` : ""}
    </div>

    <div class="mm-team-block ${e2win ? "team-win" : (hasRes && winner ? "team-lose" : "")}">
      <span class="mm-team-flag">${f2}</span>
      <input class="mm-team-inp" placeholder="Equipa 2" value="${esc(game.e2)}"
        data-round="${roundId}" data-idx="${idx}" data-field="e2" />
    </div>
  </div>`;
}

function esc(s) { return (s || "").replace(/"/g, "&quot;"); }

function buildBracketHTML(mm) {
  const ROUNDS_MAIN = MM_ROUNDS.filter(r => r.id !== "tp");
  let html = `<div class="bracket-wrapper">
    <button class="btn-bracket-toggle" onclick="toggleBracket(this)">📐 Ver Bracket Completo ▼</button>
    <div class="bracket-outer" style="display:none;">
      <div class="bracket-scroll">`;

  for (const r of ROUNDS_MAIN) {
    html += `<div class="bcol" data-count="${r.count}">
      <div class="bcol-title">${r.abbr}</div>
      <div class="bcol-games">`;
    mm[r.id].forEach((game, idx) => {
      const w = mmWinner(game);
      const hasRes = game.gc !== null && game.gf !== null;
      html += `<div class="bgame ${hasRes ? "bgame-done" : ""}">
        <div class="bteam ${w === game.e1 && game.e1 ? "bwin" : ""}">${FLAGS[game.e1] || ""} ${game.e1 || "TBD"}</div>
        <div class="bscore">${hasRes ? `${game.gc}–${game.gf}` : "–"}</div>
        <div class="bteam ${w === game.e2 && game.e2 ? "bwin" : ""}">${FLAGS[game.e2] || ""} ${game.e2 || "TBD"}</div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // 3rd place
  const tp = mm.tp[0];
  const tpW = mmWinner(tp);
  const tpHas = tp.gc !== null;
  html += `<div class="bcol bcol-tp" data-count="1">
    <div class="bcol-title">3.º</div>
    <div class="bcol-games">
      <div class="bgame ${tpHas ? "bgame-done" : ""}">
        <div class="bteam ${tpW === tp.e1 && tp.e1 ? "bwin" : ""}">${FLAGS[tp.e1] || ""} ${tp.e1 || "TBD"}</div>
        <div class="bscore">${tpHas ? `${tp.gc}–${tp.gf}` : "–"}</div>
        <div class="bteam ${tpW === tp.e2 && tp.e2 ? "bwin" : ""}">${FLAGS[tp.e2] || ""} ${tp.e2 || "TBD"}</div>
      </div>
    </div>
  </div>`;

  html += `</div></div></div>`;
  return html;
}

function toggleBracket(btn) {
  const outer = btn.nextElementSibling;
  const open = outer.style.display !== "none";
  outer.style.display = open ? "none" : "block";
  btn.textContent = open ? "📐 Ver Bracket Completo ▼" : "📐 Fechar Bracket ▲";
}

function attachMMEvents(container, mm) {
  container.querySelectorAll(".mm-score-inp").forEach(inp => {
    inp.addEventListener("change", e => onMMScore(e.target));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
  });
  container.querySelectorAll(".mm-team-inp").forEach(inp => {
    inp.addEventListener("blur", e => onMMTeam(e.target));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
  });
  container.querySelectorAll(".mm-pen-btn").forEach(btn => {
    btn.addEventListener("click", e => onMMPen(e.target));
  });
}

function onMMScore(inp) {
  const { round, idx } = inp.dataset;
  const mm = getMataMata();
  const game = mm[round][+idx];
  const val = inp.value.trim();
  if (!val) {
    game.gc = null; game.gf = null; game.pen_winner = null;
  } else {
    const p = parseRes(val);
    if (!p) { inp.classList.add("res-error"); setTimeout(() => inp.classList.remove("res-error"), 2000); return; }
    game.gc = p.gc; game.gf = p.gf;
    if (game.gc !== game.gf) game.pen_winner = null;
    mmPropagate(mm, round, +idx);
  }
  saveMataMata(mm);
  renderMataMata(mm);
}

function onMMTeam(inp) {
  const { round, idx, field } = inp.dataset;
  const mm = getMataMata();
  mm[round][+idx][field] = inp.value.trim();
  saveMataMata(mm);
}

function onMMPen(btn) {
  const { round, idx, winner } = btn.dataset;
  const mm = getMataMata();
  mm[round][+idx].pen_winner = winner;
  mmPropagate(mm, round, +idx);
  saveMataMata(mm);
  renderMataMata(mm);
}

function resetMataMata() {
  if (!confirm("Apagar todos os dados do Mata-Mata?")) return;
  localStorage.removeItem(LS_MM_KEY);
  mmActiveRound = "r32";
  renderMataMata(initMataMata());
}

// ─── RESET ────────────────────────────────────────────────────────────────────
function resetResultados() {
  if (!confirm("Apagar todos os resultados da fase de grupos? Esta ação não pode ser desfeita.")) return;
  localStorage.removeItem(LS_KEY);
  renderTab(activeTab);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  getResultados();
  switchTab("resultados");
});
