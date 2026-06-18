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

const GROUP_COLORS = {
  A:"#ef4444",B:"#f97316",C:"#eab308",D:"#22c55e",E:"#06b6d4",F:"#6366f1",
  G:"#a855f7",H:"#ec4899",I:"#14b8a6",J:"#f59e0b",K:"#3b82f6",L:"#10b981",
};
const gc = g => GROUP_COLORS[g] || "#94a3b8";

function renderProgressBar(done, total, label) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="prog-wrap">
    <div class="prog-head"><span>${label}</span><span class="prog-nums">${done}/${total}</span></div>
    <div class="prog-track"><div class="prog-fill" style="width:${pct}%"></div></div>
  </div>`;
}

// ─── RESULTADOS ──────────────────────────────────────────────────────────────
function getResultados() {
  const r = dbGet(DB_KEYS.RESULTADOS);
  if (r) return r;
  const init = {};
  let ts0 = Date.now() - DADOS.jogos.length * 1000;
  for (const j of DADOS.jogos) {
    if (j.estado === "FT" && j.gc !== null) {
      init[j.codigo] = { gc: j.gc, gf: j.gf, _ts: ts0++ };
    }
  }
  saveResultados(init);
  return init;
}
function saveResultados(r) { dbSet(DB_KEYS.RESULTADOS, r); }

// Scoring em js/scoring.js

// ─── CÁLCULO POR PARTICIPANTE ─────────────────────────────────────────────────
// gsOv:   overrides GS  { [pi]: { [codigo]: {casa,fora} } }
// mm:     estado mata-mata
// koP:    previsões KO  { [pi]: { [roundId:idx]: {gc,gf,qualifier} } }
function calcParticipante(nome, resultados, gsOv, mm, koP) {
  const pi = DADOS.participantes.indexOf(nome);
  let pts = 0, exatos = 0, ve = 0, golos = 0, naoPontua = 0;

  // Fase de grupos
  for (const j of DADOS.jogos) {
    const p = getGSPredFor(pi, j.codigo);
    const r = resultados[j.codigo];
    if (!p) continue;
    const tipo = getTipo(p.casa, p.fora, r?.gc, r?.gf);
    pts += getPontos(tipo);
    if (tipo === "Exato")            exatos++;
    else if (tipo === "Vencedor/Empate") ve++;
    else if (tipo === "Golos Equipa")    golos++;
    else if (tipo === "Não Pontuou")     naoPontua++;
  }
  const gsPts = pts;

  // Mata-mata
  let koPts = 0;
  if (mm && koP) {
    for (const round of MM_ROUNDS) {
      const games = mm[round.id];
      if (!games) continue;
      games.forEach((game, idx) => {
        const pred = koP[pi]?.[`${round.id}:${idx}`];
        if (!pred || pred.gc === null || pred.gc === undefined) return;
        if (game.gc === null || game.gc === undefined) return;
        const winner = mmWinner(game);
        const { pts: kp } = calcKO(round.id, pred.gc, pred.gf, pred.qualifier, game.gc, game.gf, winner);
        koPts += kp;
      });
    }
  }

  return { nome, pts: gsPts + koPts, gsPts, koPts, exatos, ve, golos, naoPontua };
}

function calcClassificacao(resultados) {
  const gsOv = getGSOverrides();
  const mm   = getMataMata();
  const koP  = getKOPredsAll();
  const stats = DADOS.participantes.map(n => calcParticipante(n, resultados, gsOv, mm, koP));
  stats.sort((a, b) => {
    if (b.pts !== a.pts)         return b.pts - a.pts;
    if (b.exatos !== a.exatos)   return b.exatos - a.exatos;
    if (b.ve !== a.ve)           return b.ve - a.ve;
    if (b.golos !== a.golos)     return b.golos - a.golos;
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
  const s = dbGet(DB_KEYS.MATAMATA);
  if (s) return s;
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
function saveMataMata(mm) { dbSet(DB_KEYS.MATAMATA, mm); }

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
  document.querySelectorAll(".mobile-nav-btn").forEach(b => {
    const t = b.dataset.tab;
    if (t === "more") {
      b.classList.toggle("active", ["grupos","previsoes","regras","whatsapp"].includes(tab));
    } else {
      b.classList.toggle("active", t === tab);
    }
  });
  document.querySelectorAll(".tab-content").forEach(c =>
    c.classList.toggle("active", c.id === "tab-" + tab));
  renderTab(tab);
  // Scroll tab activo para a vista (desktop)
  const activeBtn = document.querySelector(`.tabs-nav .tab-btn[data-tab="${tab}"]`);
  activeBtn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}

function toggleHeaderMenu() {
  document.getElementById("header-dropdown")?.classList.toggle("open");
}

function openMobileMore() {
  document.getElementById("mobile-sheet")?.classList.add("active");
}

function closeMobileMore() {
  document.getElementById("mobile-sheet")?.classList.remove("active");
}

document.addEventListener("click", e => {
  const menu = document.querySelector(".header-menu");
  if (menu && !menu.contains(e.target)) {
    document.getElementById("header-dropdown")?.classList.remove("open");
  }
});

function renderTab(tab) {
  const r = getResultados();
  if      (tab === "resultados")    renderResultados(r);
  else if (tab === "classificacao") renderClassificacao(r);
  else if (tab === "revisao")       renderRevisao(r);
  else if (tab === "grupos")        renderGrupos(r);
  else if (tab === "whatsapp")      renderWhatsapp(r);
  else if (tab === "matamata")      renderMataMata(getMataMata());
  else if (tab === "previsoes")     renderPrevisoes();
  else if (tab === "regras")        renderRegras();
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
  const totalDone = DADOS.jogos.filter(j => resultados[j.codigo]).length;

  let html = renderResultadosFilters();
  html += renderProgressBar(totalDone, DADOS.jogos.length, "⚽ Jogos com resultado");

  html += `<div class="preds-section">
    <div class="preds-gs-scroll">
    <table class="preds-table preds-flat res-table">
      <colgroup>
        <col class="col-cod">
        <col class="col-jogo">
        <col class="col-pred">
        <col class="col-tipo">
        <col class="col-pts">
      </colgroup>
      <thead>
        <tr>
          <th>Cód.</th><th>Jogo</th><th>Resultado</th><th>Estado</th><th>💬</th>
        </tr>
      </thead>`;

  let visible = 0;
  for (const g of grupos) {
    if (_resFilter.grupo !== "all" && _resFilter.grupo !== g) continue;
    const jogos = DADOS.jogos.filter(j => j.grupo === g);
    const filtered = jogos.filter(j => matchResFilter(j, resultados[j.codigo]));
    if (!filtered.length) continue;
    const done = jogos.filter(j => resultados[j.codigo]).length;
    const tbId = `res-tb-${g}`;

    html += `<tbody>
      <tr class="preds-group-hdr" onclick="toggleFlatGroup('${tbId}')">
        <td colspan="5">
          <div class="pgr-inner">
            <span class="pgr-label">Grupo ${g}</span>
            <span class="pgr-prog">${done}/${jogos.length} jogos</span>
            <span class="preds-chevron" id="ch-${tbId}">▾</span>
          </div>
        </td>
      </tr>
    </tbody>
    <tbody id="${tbId}">`;

    for (const j of filtered) {
      visible++;
      const r = resultados[j.codigo];
      const val = r ? `${r.gc}-${r.gf}` : "";
      const ft = r !== undefined;
      html += `<tr class="${ft ? "row-ft" : ""}">
        <td><span class="badge-grupo">${j.codigo}</span></td>
        <td class="jogo-nome-sm">${fl(j.casa)} <span class="vs">×</span> ${fl(j.fora)}</td>
        <td class="td-center">
          <input type="text" class="res-input pred-inp ${ft ? "res-filled" : ""}"
            placeholder="2-1" value="${val}" data-codigo="${j.codigo}" maxlength="7" inputmode="numeric" />
        </td>
        <td class="td-center">
          <span class="estado-badge ${ft ? "estado-ft" : "estado-pendente"}">${ft ? "FT" : "Pend."}</span>
        </td>
        <td class="td-center res-estado-cell">
          ${ft ? `<button class="btn-wa-jogo" onclick="showWAModal('${j.codigo}')" title="WhatsApp">💬</button>` : `<span class="muted-dash">—</span>`}
        </td>
      </tr>`;
    }
    html += `</tbody>`;
  }

  html += `</table></div></div>`;
  if (!visible) html += `<div class="empty-state"><span class="empty-icon">🔍</span><p>Nenhum jogo encontrado</p></div>`;
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
    if (activeTab !== "whatsapp") {
      const wa = document.getElementById("whatsapp-content");
      if (wa && wa.innerHTML) renderWhatsapp(resultados);
    }
    return;
  }
  const parsed = parseRes(val);
  if (!parsed) {
    inp.classList.add("res-error");
    inp.title = "Formato inválido. Use: 2-1";
    setTimeout(() => { inp.classList.remove("res-error"); inp.title = ""; }, 2000);
    return;
  }
  resultados[cod] = { ...parsed, _ts: Date.now(), _manual: true };
  saveResultados(resultados);
  renderTab(activeTab);
  // Sempre manter WhatsApp atualizado (mesmo quando noutro tab)
  if (activeTab !== "whatsapp") {
    const wa = document.getElementById("whatsapp-content");
    if (wa && wa.innerHTML) renderWhatsapp(resultados);
  }
}

// ─── TAB: CLASSIFICAÇÃO ──────────────────────────────────────────────────────
function renderPodiumCard(s, pos) {
  const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : "🥉";
  const short = s.nome.split(" ")[0];
  return `<div class="podium-card ${s.paga ? "paga-sim" : "paga-nao"}">
    <div class="podium-medal">${medal}</div>
    <div class="podium-name" title="${s.nome}">${short}</div>
    <div class="podium-pts">${s.pts}<span>pts</span></div>
    <div class="podium-detail">✅ ${s.exatos} · ⚽ ${s.ve} · 🎯 ${s.golos}</div>
    <span class="jantar-badge ${s.paga ? "paga" : "nao-paga"}">${s.paga ? "🍽️ PAGA" : "🎉 LIVRE"}</span>
  </div>`;
}

function renderClsRow(s) {
  return `<div class="cls-row ${s.paga ? "paga-sim" : "paga-nao"}">
    <span class="cls-row-pos">${s.pos}</span>
    <span class="cls-row-name">${s.nome}</span>
    <span class="cls-row-stats">
      <span title="Exatos">✅ ${s.exatos}</span>
      <span title="VE">⚽ ${s.ve}</span>
      <span title="Golos">🎯 ${s.golos}</span>
      <span title="Não pontuou">❌ ${s.naoPontua}</span>
    </span>
    <span class="cls-row-pts">${s.pts}</span>
    <span class="jantar-badge ${s.paga ? "paga" : "nao-paga"}">${s.paga ? "🍽️ PAGA" : "🎉 LIVRE"}</span>
  </div>`;
}

function renderClassificacao(resultados) {
  const cls = calcClassificacao(resultados);
  const jogados = DADOS.jogos.filter(j => resultados[j.codigo]).length;
  const container = document.getElementById("classificacao-content");

  let html = `<div class="feat-actions-bar">
    <button class="btn-feat" onclick="exportClassificacaoImage()">🖼️ Exportar imagem</button>
    <button class="btn-feat" onclick="exportBackupJSON()">💾 Backup JSON</button>
    <button class="btn-feat" onclick="openPresentationMode()">🎬 Modo jantar</button>
    <button class="btn-feat" onclick="shareNative(buildMsgClassificacao(resultados),'Classificação')">📤 Partilhar</button>
  </div>`;
  html += renderProgressBar(jogados, DADOS.jogos.length, "⚽ Progresso da competição");

  if (cls.length >= 3) {
    html += `<div class="podium">
      <div class="podium-slot podium-2">${renderPodiumCard(cls[1], 2)}</div>
      <div class="podium-slot podium-1">${renderPodiumCard(cls[0], 1)}</div>
      <div class="podium-slot podium-3">${renderPodiumCard(cls[2], 3)}</div>
    </div>`;
  }

  html += `<div class="cls-list">`;
  const rest = cls.length >= 3 ? cls.slice(3) : cls;
  for (const s of rest) html += renderClsRow(s);
  html += `</div>`;

  html += `<div class="cls-legenda">
    <span class="legenda-item paga-nao-ex">Top 5 — Não paga jantar</span>
    <span class="legenda-item paga-sim-ex">Bottom 5 — Paga jantar</span>
    <span class="legenda-item legenda-pts">Exato=5 · VE=2 · Golos=1</span>
  </div>
  <div id="class-history-wrap" class="feat-section">
    <h3 class="feat-section-title">📈 Evolução da classificação</h3>
    <div id="class-history"></div>
  </div>`;
  container.innerHTML = html;
  renderClassificationHistory("class-history");
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
    for (let pi2 = 0; pi2 < participantes.length; pi2++) {
      const p    = participantes[pi2];
      const pred = getGSPredFor(pi2, j.codigo);
      if (!pred) { html += `<td class="tipo-pendente">—</td>`; continue; }
      const tipo = getTipo(pred.casa, pred.fora, r?.gc, r?.gf);
      const pts  = getPontos(tipo);
      const res  = `${pred.casa}-${pred.fora}`;
      html += `<td class="${TIPO_CSS[tipo]}" title="${p}: ${res} | ${tipo} | ${pts}pts">
        <span class="prog-val">${res}</span>
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
const SEP   = "━━━━━━━━━━━━━━━━━━━━━";
const MEDALS = { 1:"🥇", 2:"🥈", 3:"🥉" };
const TIPO_EM = { "Exato":"✅","Vencedor/Empate":"⚽","Golos Equipa":"🎯","Não Pontuou":"❌","Pendente":"⏳" };

function buildMsgClassificacao(resultados) {
  const jogosFeitos = DADOS.jogos.filter(j => resultados[j.codigo]);
  const cls = calcClassificacao(resultados);
  const nao = cls.filter(s => !s.paga);
  const sim = cls.filter(s =>  s.paga);
  let msg = "";
  msg += `🏆 *PREDICTOR PARQUE BIOLÓGICO*\n`;
  msg += `⚽ *MUNDIAL 2026* · _${jogosFeitos.length} jogos jogados_\n\n`;
  msg += `${SEP}\n📊 *CLASSIFICAÇÃO GERAL*\n${SEP}\n\n`;
  for (const s of cls) {
    const medal = MEDALS[s.pos] || `${s.pos}.`;
    let line = `${medal} ${s.paga ? s.nome : `*${s.nome}*`} · ${s.paga ? `${s.pts} pts` : `*${s.pts} pts*`}`;
    if (s.exatos > 0) line += ` ✅×${s.exatos}`;
    if (s.paga)       line += ` 🍽️`;
    msg += line + "\n";
    if (s.pos === 5)  msg += `${SEP}\n`;
  }
  msg += `\n_🍾 Não paga: ${nao.map(s => s.nome.split(" ")[0]).join(", ")}_\n`;
  msg += `_🍽️ Paga: ${sim.map(s => s.nome.split(" ")[0]).join(", ")}_\n\n`;
  msg += `_✅ Exato=5pts · ⚽ VE=2pts · 🎯 Golos=1pt_`;
  return msg;
}

function buildMsgJogo(codigo, resultados) {
  const j = DADOS.jogos.find(x => x.codigo === codigo);
  if (!j) return "";
  const r  = resultados[codigo];
  if (!r)  return "";
  const f1 = FLAGS[j.casa] || "🏳";
  const f2 = FLAGS[j.fora] || "🏳";
  let msg = "";
  msg += `🌍 *MUNDIAL 2026 — RESUMO DO JOGO*\n\n`;
  msg += `${SEP}\n`;
  msg += `${f1} *${j.casa}  ${r.gc} – ${r.gf}  ${j.fora}* ${f2}\n`;
  msg += `_${j.codigo} · Grupo ${j.grupo}_\n`;
  msg += `${SEP}\n\n`;
  msg += "```\n";
  for (let pi = 0; pi < DADOS.participantes.length; pi++) {
    const p    = DADOS.participantes[pi];
    const pred = getGSPredFor(pi, j.codigo); // usa overrides da aba Previsões
    if (!pred) continue;
    const tipo = getTipo(pred.casa, pred.fora, r.gc, r.gf);
    const pts  = getPontos(tipo);
    const em   = TIPO_EM[tipo];
    const name = p.split(" ")[0].substring(0, 8).padEnd(9);
    const res  = `${pred.casa}-${pred.fora}`.padEnd(5);
    const pStr = (pts > 0 ? `+${pts}pts` : "  0pt").padEnd(6);
    msg += `${em} ${name} ${res} ${pStr}\n`;
  }
  msg += "```\n\n";
  msg += `_✅ Exato=5pts · ⚽ VE=2pts · 🎯 Golos=1pt_`;
  return msg;
}

function renderWhatsapp(resultados) {
  const container = document.getElementById("whatsapp-content");
  const jogosFeitos = DADOS.jogos.filter(j => resultados[j.codigo]);
  if (!jogosFeitos.length) {
    container.innerHTML = `<div class="wa-empty">
      Ainda não há resultados.<br>
      Vai ao separador <strong>⚽ Resultados</strong>, introduz um resultado e clica em <strong>💬</strong> ao lado do jogo para gerar o resumo.
    </div>`;
    return;
  }
  const msgCls = buildMsgClassificacao(resultados);
  container.innerHTML = `<div class="wa-container">
    <div class="wa-block">
      <div class="wa-title">📊 Classificação Geral
        <span class="wa-hint">Para o resumo de cada jogo, clica em 💬 no separador Resultados</span>
      </div>
      <div class="wa-preview">${waPreview(msgCls)}</div>
      <textarea class="wa-textarea" id="wa-geral" readonly>${msgCls}</textarea>
      <div class="wa-modal-actions">
        <button class="btn-copy" onclick="copyWA('wa-geral')">📋 Copiar</button>
        <button class="btn-wa-send" onclick="window.open('https://wa.me/?text='+encodeURIComponent(document.getElementById('wa-geral').value),'_blank')">💬 Abrir no WhatsApp</button>
      </div>
    </div>
  </div>`;
}

// ── Modal de resumo por jogo ──────────────────────────────────────────────────
function showWAModal(codigo) {
  const resultados = getResultados();
  const msg = buildMsgJogo(codigo, resultados);
  const j   = DADOS.jogos.find(x => x.codigo === codigo);
  const r   = resultados[codigo];
  const f1  = FLAGS[j?.casa] || "🏳";
  const f2  = FLAGS[j?.fora] || "🏳";

  const modal = document.getElementById("wa-modal");
  document.getElementById("wa-modal-title").textContent =
    `${f1} ${j?.casa} ${r?.gc}–${r?.gf} ${j?.fora} ${f2}`;
  document.getElementById("wa-modal-preview").innerHTML = waPreview(msg);
  document.getElementById("wa-modal-textarea").value = msg;
  modal.classList.add("active");
}

function closeWAModal() {
  document.getElementById("wa-modal").classList.remove("active");
}

function copyWAModal() {
  const ta  = document.getElementById("wa-modal-textarea");
  const btn = document.getElementById("wa-modal-copy-btn");
  navigator.clipboard.writeText(ta.value).then(() => {
    btn.textContent = "✅ Copiado!";
    setTimeout(() => { btn.textContent = "📋 Copiar"; }, 2500);
  }).catch(() => { ta.select(); document.execCommand("copy"); });
}

function sendWAModal() {
  const text = document.getElementById("wa-modal-textarea").value;
  if (navigator.share) {
    shareNative(text, document.getElementById("wa-modal-title")?.textContent);
  } else {
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }
}

// Render a WhatsApp-like preview of the message
function waPreview(text) {
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Bold: *text*
    .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
    // Italic: _text_
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    // Code block: ```...```
    .replace(/```\n([\s\S]*?)```/g, (_, code) => `<code class="wa-code">${code}</code>`)
    // Line breaks
    .replace(/\n/g, "<br>");
  return html;
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

  // Bracket SEMPRE VISÍVEL no topo (auto-actualiza em cada mudança)
  let html = buildBracketHTML(mm);

  // Selector de ronda
  html += `<div class="mm-round-tabs">`;
  for (const r of MM_ROUNDS) {
    const done = mm[r.id].filter(g => g.gc !== null).length;
    html += `<button class="mm-round-btn ${mmActiveRound === r.id ? "active" : ""}"
      onclick="setMMRound('${r.id}')">${r.abbr}
      <span class="mm-prog ${done === r.count ? "mm-prog-done" : ""}">${done}/${r.count}</span>
    </button>`;
  }
  html += `</div>`;

  html += `<div class="mm-actions-bar">
    <button class="btn-feat" onclick="autoFillMataMataFromGroups()">⚡ Preencher R32 dos grupos</button>
  </div>`;

  // Editor da ronda activa
  const cfg = MM_ROUNDS.find(r => r.id === mmActiveRound);
  html += `<div class="mm-section">
    <div class="mm-section-header">
      <h2 class="mm-section-title">${cfg.name}</h2>
      <span class="mm-hint">Escreve equipa + resultado (ex: 2-1). Em empate escolhe quem passa (AET/PEN).</span>
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

// Bracket sempre visível, alinhamento por space-around (matemáticamente perfeito)
function buildBracketHTML(mm) {
  const H    = 660;  // altura fixa igual para todas as colunas
  const CW   = 162;  // largura de cada coluna de jogos
  const CONN = 22;   // largura das colunas de ligação

  const MAIN = [
    { id:"r32", name:"Round of 32",      count:16, abbr:"R32" },
    { id:"r16", name:"Oitavos de Final", count:8,  abbr:"R16" },
    { id:"qf",  name:"Quartos de Final", count:4,  abbr:"QF"  },
    { id:"sf",  name:"Meias-Final",      count:2,  abbr:"SF"  },
    { id:"f",   name:"Final",            count:1,  abbr:"🏆"  },
  ];

  // ── Cabeçalho de títulos ──────────────────────────────────────────────────
  let titles = `<div class="br-titles">`;
  MAIN.forEach((r, i) => {
    titles += `<span class="brt" style="width:${CW}px">${r.name}</span>`;
    if (i < MAIN.length - 1)
      titles += `<span class="brt" style="width:${CONN}px"></span>`;
  });
  titles += `<span class="brt brt-tp" style="width:${CW}px">3.º Lugar</span>`;
  titles += `</div>`;

  // ── Corpo do bracket ──────────────────────────────────────────────────────
  let body = `<div class="br-body">`;

  MAIN.forEach((r, i) => {
    // Coluna de jogos
    body += `<div class="bcol" style="width:${CW}px;height:${H}px">`;
    mm[r.id].forEach((g, idx) => {
      const w    = mmWinner(g);
      const done = g.gc !== null && g.gf !== null;
      const f1   = FLAGS[g.e1] || (g.e1 ? "🏳":"");
      const f2   = FLAGS[g.e2] || (g.e2 ? "🏳":"");
      body += `<div class="bgame ${done?"bgame-done":""}" onclick="setMMRound('${r.id}')" title="Jogo ${idx+1} · clica para editar">
        <div class="brow ${w===g.e1&&g.e1?"bwin":done&&w?"blose":""}">${f1} <span>${g.e1||"TBD"}</span></div>
        <div class="bscore">${done?`${g.gc}–${g.gf}`:"·"}</div>
        <div class="brow ${w===g.e2&&g.e2?"bwin":done&&w?"blose":""}">${f2} <span>${g.e2||"TBD"}</span></div>
      </div>`;
    });
    body += `</div>`;

    // Coluna de ligação (N items = count da próxima ronda → space-around alinha perfeitamente)
    if (i < MAIN.length - 1) {
      const nc = MAIN[i + 1].count;
      body += `<div class="bcol-conn" style="width:${CONN}px;height:${H}px">`;
      for (let c = 0; c < nc; c++) body += `<div class="conn-h"></div>`;
      body += `</div>`;
    }
  });

  // 3.º lugar (coluna separada)
  const tp   = mm.tp[0];
  const tpW  = mmWinner(tp);
  const tpD  = tp.gc !== null;
  const tf1  = FLAGS[tp.e1] || (tp.e1 ? "🏳":"");
  const tf2  = FLAGS[tp.e2] || (tp.e2 ? "🏳":"");
  body += `<div class="bcol bcol-tp" style="width:${CW}px;height:${H}px">
    <div class="bgame ${tpD?"bgame-done":""}" onclick="setMMRound('tp')" title="3.º Lugar · clica para editar">
      <div class="brow ${tpW===tp.e1&&tp.e1?"bwin":tpD&&tpW?"blose":""}">${tf1} <span>${tp.e1||"TBD"}</span></div>
      <div class="bscore">${tpD?`${tp.gc}–${tp.gf}`:"·"}</div>
      <div class="brow ${tpW===tp.e2&&tp.e2?"bwin":tpD&&tpW?"blose":""}">${tf2} <span>${tp.e2||"TBD"}</span></div>
    </div>
  </div>`;

  body += `</div>`;

  return `<div class="bracket-outer"><div class="bracket-scroll">${titles}${body}</div></div>`;
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
  dbRemove(DB_KEYS.MATAMATA);
  mmActiveRound = "r32";
  renderMataMata(initMataMata());
}

// ─── PREVISÕES ────────────────────────────────────────────────────────────────

// ── GS overrides ──────────────────────────────────────────────────────────────
function getGSOverrides() {
  return dbGet(DB_KEYS.GS_OVERRIDES) || {};
}
function saveGSOverrides(o) { dbSet(DB_KEYS.GS_OVERRIDES, o); }

function getGSPredFor(pi, codigo) {
  const nome = DADOS.participantes[pi];
  const base = DADOS.prognosticos[nome]?.[codigo];
  const ov = getGSOverrides()[pi]?.[codigo];

  if (!base && !ov) return null;
  if (!ov) return base ? { casa: base.casa, fora: base.fora } : null;

  // Ignorar override corrupto (0-0 quando BD tem outro valor)
  if (base && ov.casa === 0 && ov.fora === 0 && (base.casa !== 0 || base.fora !== 0)) {
    return { casa: base.casa, fora: base.fora };
  }
  if (base && ov.casa === base.casa && ov.fora === base.fora) {
    return { casa: base.casa, fora: base.fora };
  }
  return { casa: ov.casa, fora: ov.fora };
}

function resetPrevisoesOriginais() {
  if (!confirm("Restaurar TODAS as previsões originais da base de dados?\n\nIsto apaga edições manuais na tab Previsões (overrides).")) return;
  dbRemove(DB_KEYS.GS_OVERRIDES);
  showApiStatus("✅ Previsões originais restauradas", "ok");
  renderTab(activeTab);
}

// ── KO predictions ────────────────────────────────────────────────────────────
function getKOPredsAll() {
  return dbGet(DB_KEYS.KO_PREDS) || {};
}
function saveKOPredsAll(p) { dbSet(DB_KEYS.KO_PREDS, p); }

function getKOPredFor(pi, roundId, idx) {
  return getKOPredsAll()[pi]?.[`${roundId}:${idx}`] || null;
}

// ── KO scoring ────────────────────────────────────────────────────────────────
// Exato (5): score certo + qualificado certo
// VE (2):    score certo OU qualificado certo
// Golos (1): pelo menos 1 equipa com golos certos
// Não pontuou (0)
function getTipoKO(pgc, pgf, pqual, rgc, rgf, rqual) {
  if (rgc === null || rgc === undefined) return "Pendente";
  const sm = (pgc === rgc && pgf === rgf);
  const qm = Boolean(rqual && pqual && pqual === rqual);
  if (sm && qm) return "Exato";
  if (sm || qm) return "Vencedor/Empate";
  if (pgc === rgc || pgf === rgf) return "Golos Equipa";
  return "Não Pontuou";
}

// ── State ─────────────────────────────────────────────────────────────────────
let predsPI = 0;
function setPredsParticipant(i) { predsPI = i; renderPrevisoes(); }

// ── Main render ───────────────────────────────────────────────────────────────
function renderPrevisoes() {
  const container = document.getElementById("previsoes-content");
  if (!container) return;
  const resultados = getResultados();
  const mm         = getMataMata();
  const gsOv       = getGSOverrides();
  const nome       = DADOS.participantes[predsPI];
  const stats      = calcParticipante(nome, resultados, gsOv);
  const cls        = calcClassificacao(resultados);
  const pos        = cls.find(s => s.nome === nome)?.pos ?? "?";

  // ── Sub-tabs ──────────────────────────────────────────────────────────────
  let html = `<div class="pp-tabs">`;
  DADOS.participantes.forEach((n, i) => {
    const st = calcParticipante(n, resultados, gsOv);
    html += `<button class="pp-btn ${predsPI === i ? "active" : ""}" onclick="setPredsParticipant(${i})">
      <span class="pp-nome">${n.split(" ")[0]}</span>
      <span class="pp-pts">${st.pts}pts</span>
    </button>`;
  });
  html += `</div>`;

  // ── Banner ────────────────────────────────────────────────────────────────
  const paga = cls.find(s => s.nome === nome)?.paga;
  const posBadge = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `${pos}º`;
  html += `<div class="pp-hero ${paga ? "pp-paga" : "pp-livre"}">
    <div class="pp-hero-main">
      <span class="pp-pos-badge">${posBadge}</span>
      <div class="pp-hero-info">
        <div class="pp-full-name">${nome}</div>
        <div class="pp-hero-sub">${paga ? "🍽️ Paga jantar" : "🎉 Não paga jantar"}</div>
      </div>
      <div class="pp-hero-pts">${stats.pts}<small>pts</small></div>
    </div>
    <div class="stat-chips">
      <span class="stat-chip chip-gold">⚽ GS ${stats.gsPts}p</span>
      ${stats.koPts > 0 ? `<span class="stat-chip">⚔️ KO ${stats.koPts}p</span>` : ""}
      <span class="stat-chip chip-exato">✅ ${stats.exatos}</span>
      <span class="stat-chip chip-ve">🔵 ${stats.ve}</span>
      <span class="stat-chip chip-golos">🟡 ${stats.golos}</span>
      <span class="stat-chip chip-nao">❌ ${stats.naoPontua}</span>
    </div>
    <button class="btn-feat btn-restore" onclick="resetPrevisoesOriginais()" title="Repor previsões originais">🔄 Restaurar BD</button>
  </div>`;

  // ── Grupo stage ───────────────────────────────────────────────────────────
  html += renderGSPredSection(predsPI, nome, resultados, gsOv);

  // ── Mata-Mata ─────────────────────────────────────────────────────────────
  html += renderKOPredSection(predsPI, mm);

  container.innerHTML = html;
  attachPredsEvents(container);
}

// ── Group stage section — tabela vertical por grupo ─────────────────────────
function renderGSPredSection(pi, nome, resultados, gsOv) {
  const grupos = [...new Set(DADOS.jogos.map(j => j.grupo))];

  let html = `<div class="preds-section">
    <div class="preds-section-title">
      ⚽ Fase de Grupos — 72 jogos
      <span class="edit-hint">✏️ edita o prognóstico e prime Enter</span>
    </div>
    <div class="preds-gs-scroll">
    <table class="preds-table preds-flat">
      <colgroup>
        <col class="col-cod">
        <col class="col-jogo">
        <col class="col-pred">
        <col class="col-real">
        <col class="col-tipo">
        <col class="col-pts">
      </colgroup>
      <thead>
        <tr>
          <th>Cód.</th><th>Jogo</th>
          <th>Prognóstico</th><th>Real</th><th>Tipo</th><th>Pts</th>
        </tr>
      </thead>`;

  for (const g of grupos) {
    const jogos = DADOS.jogos.filter(j => j.grupo === g);
    let gpts = 0, gj = 0;
    for (const j of jogos) {
      const pred = getGSPredFor(pi, j.codigo);
      const r = resultados[j.codigo];
      if (r && pred) { gpts += getPontos(getTipo(pred.casa, pred.fora, r.gc, r.gf)); gj++; }
    }
    const tbId = `gs-tb-${pi}-${g}`;

    html += `<tbody>
      <tr class="preds-group-hdr" onclick="toggleFlatGroup('${tbId}')">
        <td colspan="6">
          <div class="pgr-inner">
            <span class="pgr-label">Grupo ${g}</span>
            <span class="pgr-prog">${gj}/${jogos.length} · <strong>${gpts}pts</strong></span>
            <span class="preds-chevron" id="ch-${tbId}">▾</span>
          </div>
        </td>
      </tr>
    </tbody>
    <tbody id="${tbId}">`;

    for (const j of jogos) {
      const pred = getGSPredFor(pi, j.codigo);
      const r = resultados[j.codigo];
      const tipo = pred ? getTipo(pred.casa, pred.fora, r?.gc, r?.gf) : "Pendente";
      const pts = getPontos(tipo);
      const isOv = gsOv[pi]?.[j.codigo];

      html += `<tr>
        <td><span class="badge-grupo">${j.codigo}</span></td>
        <td class="jogo-nome-sm">${fl(j.casa)} <span class="vs">×</span> ${fl(j.fora)}</td>
        <td class="td-center">
          <input class="pred-inp gs-pred-inp ${isOv ? "pred-edited" : ""}" type="text"
            value="${pred ? `${pred.casa}-${pred.fora}` : ""}"
            placeholder="0-0" data-pi="${pi}" data-codigo="${j.codigo}" maxlength="7" inputmode="numeric" />
        </td>
        <td class="real-cell td-center">${r ? `${r.gc}-${r.gf}` : "—"}</td>
        <td class="td-center">${r ? `<span class="tipo-pill ${TIPO_CSS[tipo]}">${tipoAbr(tipo)}</span>` : `<span class="muted-dash">—</span>`}</td>
        <td class="pts-cell">${r ? pts : "—"}</td>
      </tr>`;
    }
    html += `</tbody>`;
  }

  html += `</table></div></div>`;
  return html;
}

function toggleFlatGroup(tbId) {
  const tb = document.getElementById(tbId);
  const ch = document.getElementById('ch-' + tbId);
  if (!tb) return;
  const hidden = tb.style.display === 'none';
  tb.style.display = hidden ? '' : 'none';
  if (ch) ch.style.transform = hidden ? '' : 'rotate(-90deg)';
}

// ── Mata-Mata section ─────────────────────────────────────────────────────────
function renderKOPredSection(pi, mm) {
  let html = `<div class="preds-section">
    <div class="preds-section-title">⚔️ Mata-Mata — previsões
      <span class="edit-hint">Resultado aos 90' + equipa apurada · pontos acumulam</span>
    </div>
    <div class="ko-scoring-info">
      Score (90') e Apurado pontuam <strong>independentemente e acumulam</strong>.
      Máximos: R32=10 · R16=15 · QF=25 · SF=35 · 3.º=40 · Final=50
    </div>`;

  for (const round of MM_ROUNDS) {
    const games = mm[round.id];
    const tbl   = KO_PONTOS[round.id] || KO_PONTOS.r32;
    const maxPts = tbl.exato + tbl.qual;

    html += `<div class="preds-group">
      <div class="preds-group-header" onclick="togglePredGroup(this)">
        <span class="pgr-label">${round.name}</span>
        <span class="pgr-prog ko-pts-hint">
          Exato=${tbl.exato} · VE=${tbl.ve} · Golos=${tbl.golos} · Apurado=${tbl.qual} · <strong>Máx ${maxPts}pts</strong>
        </span>
        <span class="preds-chevron">▾</span>
      </div>
      <div class="preds-group-body">
        <table class="preds-table ko-preds-table">
          <thead><tr>
            <th>#</th><th>Jogo</th>
            <th>Res. 90' (pred)</th><th>Apurado (pred)</th>
            <th>Real 90'</th><th>Apurado real</th>
            <th>Score 90'</th><th>Apurado</th><th>Total</th>
          </tr></thead><tbody>`;

    games.forEach((game, idx) => {
      const pred   = getKOPredFor(pi, round.id, idx);
      const winner = mmWinner(game);
      const hasRes = game.gc !== null && game.gc !== undefined;
      const hasPred = pred && pred.gc !== null && pred.gc !== undefined;
      const f1  = FLAGS[game.e1] || (game.e1 ? "🏳" : "");
      const f2  = FLAGS[game.e2] || (game.e2 ? "🏳" : "");

      let scoreCell = `<span class="muted-dash">—</span>`;
      let qualCell  = `<span class="muted-dash">—</span>`;
      let totalCell = `<span class="muted-dash">—</span>`;

      if (hasRes && hasPred) {
        const ko = calcKO(round.id, pred.gc, pred.gf, pred.qualifier, game.gc, game.gf, winner);
        scoreCell = `<span class="tipo-pill ${TIPO_CSS[ko.tipoScore]}">${tipoAbr(ko.tipoScore)}</span>
                     <span class="pts-small">+${ko.scorePts}p</span>`;
        qualCell  = ko.qualMatch
          ? `<span class="qual-match-ok">✓ +${ko.qualPts}p</span>`
          : `<span class="qual-match-no">✗ 0p</span>`;
        totalCell = `<strong class="pts-cell">${ko.pts}</strong>`;
      }

      html += `<tr>
        <td><span class="badge-grupo ko-badge">${idx + 1}</span></td>
        <td class="jogo-nome-sm">
          ${game.e1 ? `${f1} ${game.e1}` : `<span class="muted-dash">TBD</span>`}
          <span class="vs">×</span>
          ${game.e2 ? `${f2} ${game.e2}` : `<span class="muted-dash">TBD</span>`}
        </td>
        <td class="td-center">
          <input class="pred-inp ko-pred-inp" type="text"
            value="${hasPred ? `${pred.gc}-${pred.gf}` : ""}"
            placeholder="0-0"
            data-pi="${pi}" data-round="${round.id}" data-idx="${idx}" maxlength="7" />
        </td>
        <td class="ko-qual-cell">
          ${game.e1 ? `<button class="ko-qual-btn ${pred?.qualifier === game.e1 ? "ko-sel" : ""}"
            data-pi="${pi}" data-round="${round.id}" data-idx="${idx}" data-qual="${esc(game.e1)}">${f1} ${game.e1}</button>` : ""}
          ${game.e2 ? `<button class="ko-qual-btn ${pred?.qualifier === game.e2 ? "ko-sel" : ""}"
            data-pi="${pi}" data-round="${round.id}" data-idx="${idx}" data-qual="${esc(game.e2)}">${f2} ${game.e2}</button>` : ""}
          ${!game.e1 && !game.e2 ? `<span class="muted-dash">TBD</span>` : ""}
        </td>
        <td class="real-cell td-center">${hasRes ? `${game.gc}-${game.gf}` : "—"}</td>
        <td class="real-cell">${winner ? `${FLAGS[winner] || ""} ${winner}` : "—"}</td>
        <td class="td-center">${scoreCell}</td>
        <td class="td-center">${qualCell}</td>
        <td class="td-center">${totalCell}</td>
      </tr>`;
    });
    html += `</tbody></table></div></div>`;
  }
  html += `</div>`;
  return html;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function tipoAbr(tipo) {
  return { "Exato":"Exato","Vencedor/Empate":"VE","Golos Equipa":"Golos","Não Pontuou":"Nada","Pendente":"Pend." }[tipo] ?? tipo;
}

function togglePredGroup(hdr) {
  hdr.parentElement.classList.toggle("preds-collapsed");
}

// ── Event handlers ────────────────────────────────────────────────────────────
function attachPredsEvents(container) {
  container.querySelectorAll(".gs-pred-inp").forEach(inp => {
    inp.addEventListener("change", e => onGSPredChange(e.target));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
  });
  container.querySelectorAll(".ko-pred-inp").forEach(inp => {
    inp.addEventListener("change", e => onKOPredChange(e.target));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
  });
  container.querySelectorAll(".ko-qual-btn").forEach(btn => {
    btn.addEventListener("click", e => onKOQualClick(e.currentTarget));
  });
}

function onGSPredChange(inp) {
  const { pi, codigo } = inp.dataset;
  const val = inp.value.trim();
  const ov  = getGSOverrides();
  if (!ov[pi]) ov[pi] = {};

  if (!val || val === "-") {
    delete ov[pi][codigo];
  } else {
    const p = parseRes(val);
    if (!p) { inp.classList.add("res-error"); setTimeout(() => inp.classList.remove("res-error"), 2000); return; }
    const base = DADOS.prognosticos[DADOS.participantes[pi]]?.[codigo];
    if (base && p.gc === base.casa && p.gf === base.fora) {
      delete ov[pi][codigo];
    } else {
      ov[pi][codigo] = { casa: p.gc, fora: p.gf };
    }
  }
  saveGSOverrides(ov);
  renderPrevisoes();
}

function onKOPredChange(inp) {
  const { pi, round, idx } = inp.dataset;
  const val  = inp.value.trim();
  const all  = getKOPredsAll();
  const key  = `${round}:${idx}`;
  if (!all[pi]) all[pi] = {};

  if (!val || val === "-") {
    if (all[pi][key]) { all[pi][key].gc = null; all[pi][key].gf = null; }
  } else {
    const p = parseRes(val);
    if (!p) { inp.classList.add("res-error"); setTimeout(() => inp.classList.remove("res-error"), 2000); return; }
    all[pi][key] = { ...all[pi][key], gc: p.gc, gf: p.gf };
  }
  saveKOPredsAll(all);
  renderPrevisoes();
}

function onKOQualClick(btn) {
  const { pi, round, idx, qual } = btn.dataset;
  const all = getKOPredsAll();
  const key = `${round}:${idx}`;
  if (!all[pi]) all[pi] = {};
  // Toggle: segundo clique remove seleção
  all[pi][key] = {
    ...all[pi][key],
    qualifier: all[pi][key]?.qualifier === qual ? null : qual
  };
  saveKOPredsAll(all);
  renderPrevisoes();
}

// ─── TAB: REGRAS ─────────────────────────────────────────────────────────────
function renderRegras() {
  const container = document.getElementById("regras-content");
  container.innerHTML = `
  <div class="regras-wrap">

    <div class="regras-card">
      <h2 class="regras-h2">🏆 Predictor Parque Biológico — Mundial 2026</h2>
      <p class="regras-intro">Regras e pontuação oficial. Os pontos <strong>não acumulam</strong> na fase de grupos — só conta a melhor categoria. No mata-mata, o resultado (aos 90') e o apurado <strong>acumulam entre si</strong>.</p>
    </div>

    <!-- FASE DE GRUPOS -->
    <div class="regras-card">
      <h3 class="regras-h3">⚽ Fase de Grupos — pontuação não cumulativa</h3>
      <table class="regras-table">
        <thead><tr><th>Tipo</th><th>Condição</th><th>Pontos</th></tr></thead>
        <tbody>
          <tr><td><span class="tipo-pill tipo-exato">Exato</span></td><td>Resultado exato</td><td class="pts-highlight">5</td></tr>
          <tr><td><span class="tipo-pill tipo-ve">Vencedor/Empate</span></td><td>Acertou o vencedor ou que era empate</td><td class="pts-highlight">2</td></tr>
          <tr><td><span class="tipo-pill tipo-golos">Golos</span></td><td>Acertou os golos de pelo menos uma equipa</td><td class="pts-highlight">1</td></tr>
          <tr><td><span class="tipo-pill tipo-nao">Nada</span></td><td>Não acertou nada</td><td class="pts-highlight muted">0</td></tr>
        </tbody>
      </table>
      <div class="regras-nota">⚠️ Os pontos <strong>não acumulam</strong>. Se acertou o vencedor E os golos de uma equipa, fica só com os 2pts do vencedor.</div>
    </div>

    <!-- TABELA MATA-MATA -->
    <div class="regras-card">
      <h3 class="regras-h3">⚔️ Mata-Mata — pontuação progressiva (score 90' + apurado acumulam)</h3>
      <div class="regras-scroll">
      <table class="regras-table regras-ko-table">
        <thead>
          <tr>
            <th>Fase</th>
            <th>✅ Exato</th>
            <th>🔵 VE</th>
            <th>🟡 Golos</th>
            <th>🟢 Apurado</th>
            <th class="pts-max-col">Máximo</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>R32 — 16 avos</td><td>7</td><td>3</td><td>1</td><td>3</td><td class="pts-max">10</td></tr>
          <tr><td>R16 — Oitavos</td><td>10</td><td>4</td><td>2</td><td>5</td><td class="pts-max">15</td></tr>
          <tr><td>QF — Quartos</td><td>15</td><td>6</td><td>3</td><td>10</td><td class="pts-max">25</td></tr>
          <tr><td>SF — Meias</td><td>20</td><td>8</td><td>4</td><td>15</td><td class="pts-max">35</td></tr>
          <tr><td>3.º/4.º lugar</td><td>25</td><td>10</td><td>5</td><td>15</td><td class="pts-max">40</td></tr>
          <tr class="regras-final-row"><td>🏆 Final</td><td>35</td><td>15</td><td>6</td><td>15</td><td class="pts-max">50</td></tr>
        </tbody>
      </table>
      </div>
      <div class="regras-nota">
        O resultado considerado é sempre <strong>o dos 90 minutos</strong>, mesmo que o jogo vá a prolongamento ou penáltis.
        Score 90' e Apurado pontuam <strong>independentemente e acumulam</strong>.
      </div>
    </div>

    <!-- EXEMPLOS FASE DE GRUPOS -->
    <div class="regras-card">
      <h3 class="regras-h3">📌 Exemplos — Fase de Grupos</h3>
      <div class="regras-exemplos">

        ${exDiv("Resultado exato","França 3-1 Senegal","França 3-1 Senegal","✅ Resultado exato","5 pts","tipo-exato")}
        ${exDiv("Acertou vencedor","França 3-1 Senegal","França 2-0 Senegal","✅ Vencedor certo · ❌ Não exato","2 pts","tipo-ve")}
        ${exDiv("Acertou golos de uma equipa","França 3-1 Senegal","França 1-1 Senegal","❌ Apostou empate · ✅ Golos do Senegal: 1","1 pt","tipo-golos")}
        ${exDiv("Não pontuou","França 3-1 Senegal","França 0-2 Senegal","❌ Nada correto","0 pts","tipo-nao")}
        ${exDiv("Não acumula","França 3-1 Senegal","França 3-0 Senegal","✅ Vencedor · ✅ Golos França · ❌ Não exato → fica com o melhor","2 pts","tipo-ve")}

      </div>
    </div>

    <!-- EXEMPLOS MATA-MATA -->
    <div class="regras-card">
      <h3 class="regras-h3">⚔️ Exemplos — Mata-Mata (16 avos)</h3>
      <p class="regras-sub">Jogo: Portugal 1-1 Espanha aos 90'. Portugal passa nos penáltis.</p>
      <div class="regras-exemplos">
        ${exKO("Acertou tudo","1-1","Portugal","1-1","Portugal","✅ Exato 7pts · ✅ Apurado 3pts","10 pts")}
        ${exKO("Acertou empate + apurado","2-2","Portugal","1-1","Portugal","✅ VE 3pts · ✅ Apurado 3pts","6 pts")}
        ${exKO("Errou score, acertou apurado","2-0","Portugal","1-1","Portugal","❌ Score 0pts · ✅ Apurado 3pts","3 pts")}
        ${exKO("Acertou score, errou apurado","1-1","Espanha","1-1","Portugal","✅ Exato 7pts · ❌ Apurado 0pts","7 pts")}
      </div>
    </div>

  </div>`;
}

function exDiv(titulo, real, pred, desc, pts, pClass) {
  return `<div class="ex-card">
    <div class="ex-title">${titulo}</div>
    <div class="ex-row"><span class="ex-label">Real:</span> <strong>${real}</strong></div>
    <div class="ex-row"><span class="ex-label">Prev:</span> <strong>${pred}</strong></div>
    <div class="ex-desc">${desc}</div>
    <div class="ex-pts"><span class="tipo-pill ${pClass}">${pts}</span></div>
  </div>`;
}

function exKO(titulo, predScore, predApurado, realScore, realApurado, desc, pts) {
  return `<div class="ex-card">
    <div class="ex-title">${titulo}</div>
    <div class="ex-row"><span class="ex-label">Real:</span> <strong>${realScore}</strong> · Apurado: <strong>${realApurado}</strong></div>
    <div class="ex-row"><span class="ex-label">Prev:</span> <strong>${predScore}</strong> · Apurado: <strong>${predApurado}</strong></div>
    <div class="ex-desc">${desc}</div>
    <div class="ex-pts"><span class="regras-pts-badge">${pts}</span></div>
  </div>`;
}

// ─── DOCUMENTO DE CONSENTIMENTO (print) ──────────────────────────────────────
function gerarConsentimento() {
  const today = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  const grupos = [...new Set(DADOS.jogos.map(j => j.grupo))].sort();
  const koPredsAll = getKOPredsAll();
  const gsOverrides = getGSOverrides();

  // Construir uma página por participante
  const pages = DADOS.participantes.map((nome, pi) => {

    // ── Tabela de Fase de Grupos: dois blocos lado a lado ──────────────────────
    const metade1 = grupos.slice(0, 6);
    const metade2 = grupos.slice(6);

    function grupoTable(grps) {
      return grps.map(grupo => {
        const jogos = DADOS.jogos.filter(j => j.grupo === grupo);
        const rows = jogos.map(j => {
          const pred = getGSPredFor(pi, j.codigo);
          const predStr = pred ? `${pred.casa}–${pred.fora}` : "—";
          return `<tr>
            <td class="cod">${j.codigo}</td>
            <td class="eq">${j.casa}</td>
            <td class="eq">${j.fora}</td>
            <td class="prd">${predStr}</td>
          </tr>`;
        }).join("");
        return `<table class="gt">
          <thead><tr><th colspan="4">Grupo ${grupo}</th></tr>
            <tr class="sub"><th>Cód</th><th>Casa</th><th>Fora</th><th>Prev.</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
      }).join("");
    }

    // ── Tabela KO (se existirem previsões) ────────────────────────────────────
      const koP = koPredsAll[pi] || {};
    const koKeys = Object.keys(koP);
    let koSection = "";
    if (koKeys.length > 0) {
      const roundNames = { r32:"Round of 32 (16 avos)", r16:"Oitavos de Final", qf:"Quartos de Final", sf:"Meias-Final", tp:"3.º Lugar", f:"Final" };
      const mm = getMM();
      const koRows = MM_ROUNDS.map(round => {
        const games = mm[round.id] || [];
        const rows = games.map((game, idx) => {
          const key = `${round.id}:${idx}`;
          const pred = koP[key];
          if (!pred && !game.e1) return "";
          const e1 = game.e1 || "TBD";
          const e2 = game.e2 || "TBD";
          const predScore = pred ? `${pred.gc}–${pred.gf}` : "—";
          const predQual = pred?.qualifier || "—";
          return `<tr>
            <td class="ko-eq">${e1} × ${e2}</td>
            <td class="prd">${predScore}</td>
            <td class="prd">${predQual}</td>
          </tr>`;
        }).filter(Boolean).join("");
        if (!rows) return "";
        return `<tr class="ko-hdr"><td colspan="3">${roundNames[round.id] || round.name}</td></tr>${rows}`;
      }).filter(Boolean).join("");

      if (koRows) {
        koSection = `
        <div class="section-title">⚔️ Mata-Mata — Previsões</div>
        <table class="ko-table">
          <thead><tr><th>Jogo</th><th>Resultado 90'</th><th>Apurado</th></tr></thead>
          <tbody>${koRows}</tbody>
        </table>`;
      }
    }

    // ── Linhas de observações ─────────────────────────────────────────────────
    const obsLines = Array.from({ length: 8 }, (_, i) => `
      <tr>
        <td class="obs-jogo"><span class="obs-label">Jogo</span> ________</td>
        <td class="obs-folha"><span class="obs-label">Na folha:</span> ________</td>
        <td class="obs-bd"><span class="obs-label">Na BD:</span> ________</td>
        <td class="obs-note">Nota: ____________________________</td>
      </tr>`).join("");

    return `
    <div class="page">

      <!-- Cabeçalho -->
      <div class="doc-header">
        <div class="doc-logo">🏆</div>
        <div class="doc-title">
          <div class="doc-main-title">Predictor Parque Biológico — Mundial 2026</div>
          <div class="doc-sub-title">Folha de Consentimento e Verificação de Prognósticos</div>
        </div>
      </div>

      <div class="player-banner">
        <div class="player-name">Jogador: <strong>${nome}</strong></div>
        <div class="player-date">Data: ${today}</div>
      </div>

      <!-- Instruções -->
      <div class="instrucao">
        <strong>Instruções:</strong> Compare os prognósticos abaixo com a fotocópia da folha original.
        Registe na secção de observações qualquer resultado que não coincida. Assine no final para confirmar.
      </div>

      <!-- Prognósticos Fase de Grupos -->
      <div class="section-title">⚽ Fase de Grupos — Prognósticos na Base de Dados</div>
      <div class="grupos-grid">
        <div class="grupos-col">${grupoTable(metade1)}</div>
        <div class="grupos-col">${grupoTable(metade2)}</div>
      </div>

      ${koSection}

      <!-- Observações -->
      <div class="section-title obs-title">📋 Observações — Resultados que não coincidem</div>
      <table class="obs-table">
        <thead>
          <tr>
            <th style="width:16%">Jogo (código)</th>
            <th style="width:22%">Prognóstico na folha</th>
            <th style="width:20%">Prognóstico na BD</th>
            <th>Nota / Decisão tomada</th>
          </tr>
        </thead>
        <tbody>${obsLines}</tbody>
      </table>

      <!-- Declaração -->
      <div class="declaracao">
        <div class="decl-title">📝 Declaração de Consentimento</div>
        <div class="decl-text">
          Eu, <strong>${nome}</strong>, declaro que revi os prognósticos acima listados e confirmo que são os mesmos
          que preenchi na folha original, com exceção das discrepâncias registadas nas observações acima.
          Aceito que os valores na Base de Dados sejam os utilizados para efeitos de classificação final do Predictor.
        </div>
        <div class="sign-row">
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-label">Assinatura de <strong>${nome}</strong></div>
          </div>
          <div class="sign-block sign-block-sm">
            <div class="sign-line"></div>
            <div class="sign-label">Data: ___ / ___ / 2026</div>
          </div>
        </div>
      </div>

      <div class="doc-footer">
        Predictor Parque Biológico — Mundial 2026 &nbsp;·&nbsp; Jogador: ${nome} &nbsp;·&nbsp; ${today}
        &nbsp;·&nbsp; Página ${pi + 1} de ${DADOS.participantes.length}
      </div>
    </div>`;
  });

  // ── CSS ───────────────────────────────────────────────────────────────────────
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", Arial, sans-serif; font-size: 8.5pt; color: #111; background: #fff; }

    .page {
      width: 210mm; min-height: 297mm; padding: 12mm 14mm 10mm;
      display: flex; flex-direction: column; gap: 7px;
      page-break-after: always;
    }
    .page:last-child { page-break-after: auto; }

    /* Header */
    .doc-header { display: flex; align-items: center; gap: 10px; border-bottom: 2.5px solid #1a3a6e; padding-bottom: 6px; }
    .doc-logo { font-size: 22pt; line-height: 1; }
    .doc-main-title { font-size: 11.5pt; font-weight: 800; color: #1a3a6e; }
    .doc-sub-title { font-size: 8pt; color: #555; margin-top: 2px; }

    .player-banner {
      display: flex; justify-content: space-between; align-items: center;
      background: #1a3a6e; color: #fff; padding: 6px 12px; border-radius: 5px;
    }
    .player-name { font-size: 10.5pt; }
    .player-name strong { font-size: 13pt; }
    .player-date { font-size: 7.5pt; opacity: .8; }

    .instrucao {
      background: #fef9e7; border: 1px solid #f0c040; border-radius: 4px;
      padding: 5px 10px; font-size: 7.5pt; line-height: 1.5; color: #555;
    }

    /* Grupos */
    .section-title {
      font-size: 8.5pt; font-weight: 700; color: #1a3a6e;
      border-bottom: 1px solid #c8d6e5; padding-bottom: 3px; margin-top: 2px;
    }
    .grupos-grid { display: flex; gap: 8px; }
    .grupos-col { flex: 1; display: flex; flex-direction: column; gap: 5px; }

    .gt { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
    .gt thead tr:first-child th {
      background: #1a3a6e; color: #fff; font-size: 7pt; text-align: left;
      padding: 2px 5px; letter-spacing: .03em;
    }
    .gt thead tr.sub th {
      background: #e8eef5; color: #444; font-size: 6.5pt; text-align: left;
      padding: 2px 5px; border-bottom: 1px solid #c8d6e5;
    }
    .gt tbody td { padding: 2px 5px; border-bottom: 1px solid #e8eef5; }
    .gt tbody tr:nth-child(odd) td { background: #f8fafc; }
    .cod { width: 22px; font-weight: 700; color: #1a3a6e; white-space: nowrap; }
    .eq  { color: #222; }
    .prd { font-weight: 800; color: #c0392b; white-space: nowrap; text-align: center; width: 32px; }

    /* KO */
    .ko-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
    .ko-table th { background: #e8eef5; padding: 3px 7px; text-align: left; font-size: 7pt; }
    .ko-table td { padding: 2px 7px; border-bottom: 1px solid #e8eef5; }
    .ko-hdr td { background: #1a3a6e; color: #fff; font-size: 7pt; padding: 2px 7px; font-weight: 700; }
    .ko-eq { color: #222; }

    /* Observações */
    .obs-title { margin-top: 3px; }
    .obs-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
    .obs-table th {
      background: #1a3a6e; color: #fff; padding: 3px 7px;
      font-size: 7pt; text-align: left;
    }
    .obs-table td { padding: 5px 7px; border-bottom: 1px solid #ddd; height: 18px; }
    .obs-table tbody tr:nth-child(odd) td { background: #fafafa; }
    .obs-label { font-size: 6.5pt; color: #888; }

    /* Declaração */
    .declaracao {
      border: 1.5px solid #1a3a6e; border-radius: 6px;
      padding: 10px 14px; display: flex; flex-direction: column; gap: 8px;
      margin-top: 3px;
    }
    .decl-title { font-size: 9pt; font-weight: 700; color: #1a3a6e; }
    .decl-text { font-size: 7.5pt; line-height: 1.7; color: #333; }
    .sign-row { display: flex; gap: 20px; margin-top: 4px; }
    .sign-block { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .sign-block-sm { flex: 0 0 160px; }
    .sign-line { border-bottom: 1.5px solid #222; height: 28px; }
    .sign-label { font-size: 7pt; color: #666; text-align: center; }

    /* Footer */
    .doc-footer {
      margin-top: auto; padding-top: 6px; border-top: 1px solid #c8d6e5;
      font-size: 6.5pt; color: #aaa; text-align: center;
    }

    @media print {
      body { margin: 0; }
      .page { margin: 0; padding: 10mm 13mm 9mm; }
      @page { size: A4 portrait; margin: 0; }
    }
  `;

  // ── Abrir nova janela ─────────────────────────────────────────────────────────
  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(`<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Consentimento — Predictor Mundial 2026</title>
  <style>${css}</style>
</head>
<body>
  <div style="position:fixed;top:0;left:0;right:0;background:#1a3a6e;color:#fff;padding:8px 16px;z-index:999;display:flex;align-items:center;justify-content:space-between;font-family:Arial,sans-serif;font-size:9pt;">
    <span>🖨️ Predictor Mundial 2026 — Folhas de Consentimento</span>
    <span style="display:flex;gap:10px;">
      <button onclick="window.print()" style="background:#f5a623;color:#0a0f1e;border:none;padding:6px 16px;border-radius:5px;font-weight:800;cursor:pointer;font-size:9pt;">🖨️ Imprimir / Guardar PDF</button>
      <button onclick="window.close()" style="background:#444;color:#fff;border:none;padding:6px 12px;border-radius:5px;cursor:pointer;font-size:9pt;">✕ Fechar</button>
    </span>
  </div>
  <div style="height:38px;"></div>
  ${pages.join("\n")}
</body>
</html>`);
  w.document.close();
}

// ─── RESET ────────────────────────────────────────────────────────────────────
function resetResultados() {
  if (!confirm("Apagar todos os resultados da fase de grupos? Esta ação não pode ser desfeita.")) return;
  dbRemove(DB_KEYS.RESULTADOS);
  renderTab(activeTab);
}

// ─── LOGIN UI ────────────────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-password").value;
  const btn   = document.getElementById("login-btn");
  const err   = document.getElementById("login-error");
  err.style.display = "none";
  btn.textContent = "A entrar…";
  btn.disabled = true;
  try {
    await dbLogin(email, pass);
    await dbLoadAll();
    showApp();
  } catch (e) {
    err.textContent = "❌ " + (e.message || "Credenciais inválidas");
    err.style.display = "block";
    btn.textContent = "Entrar";
    btn.disabled = false;
  }
}

async function doLogout() {
  if (!confirm("Sair da sessão?")) return;
  await dbLogout();
  document.getElementById("login-overlay").style.display = "flex";
  document.getElementById("login-password").value = "";
  document.getElementById("login-note").textContent = "Sessão terminada.";
  document.getElementById("header-user").style.display = "none";
  document.getElementById("btn-logout").style.display = "none";
}

function showApp() {
  document.getElementById("login-overlay").style.display = "none";
  const u = dbCurrentUser();
  if (u) {
    const el = document.getElementById("header-user");
    el.textContent = "👤 " + (u.email || "").split("@")[0];
    el.style.display = "inline-flex";
    document.getElementById("btn-logout").style.display = "block";
  }
  initFeatures().then(() => {
    getResultados();
    switchTab("resultados");
    apiStartAutoSync(5 * 60 * 1000);
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const overlay = document.getElementById("login-overlay");
  const note    = document.getElementById("login-note");

  if (!dbIsConfigured()) {
    note.textContent = "⚠️ Modo local (Supabase não configurado)";
    overlay.style.display = "none";
    initFeatures().then(() => {
      getResultados();
      switchTab("resultados");
    });
    return;
  }

  note.textContent = "A verificar sessão…";
  const user = await dbInit();
  if (user) {
    // Sessão ativa → carregar dados e arrancar
    await dbLoadAll();
    showApp();
  } else {
    // Sem sessão → mostrar ecrã de login
    note.textContent = "Introduz as tuas credenciais para aceder.";
    document.getElementById("login-btn").disabled = false;
    document.getElementById("login-btn").textContent = "Entrar";
  }
});
