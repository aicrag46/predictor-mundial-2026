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

// ─── RESULTADOS (localStorage) ──────────────────────────────────────────────
const LS_KEY = "predictor_resultados_2026";

function getResultados() {
  try {
    const r = localStorage.getItem(LS_KEY);
    if (r) return JSON.parse(r);
  } catch {}
  // Inicializar com resultados já jogados do JSON
  const init = {};
  for (const j of DADOS.jogos) {
    if (j.estado === "FT" && j.gc !== null) {
      init[j.codigo] = { gc: j.gc, gf: j.gf };
    }
  }
  saveResultados(init);
  return init;
}

function saveResultados(r) {
  localStorage.setItem(LS_KEY, JSON.stringify(r));
}

// ─── SCORING ────────────────────────────────────────────────────────────────
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
    const cd = j.codigo;
    const p = progs[cd];
    const r = resultados[cd];
    if (!p) continue;
    const tipo = getTipo(p.casa, p.fora, r?.gc, r?.gf);
    const pontos = getPontos(tipo);
    pts += pontos;
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
  const n = stats.length;
  const half = Math.floor(n / 2);
  return stats.map((s, i) => ({ ...s, pos: i + 1, paga: i >= half }));
}

// ─── TIPO CORES ─────────────────────────────────────────────────────────────
const TIPO_CSS = {
  "Exato": "tipo-exato",
  "Vencedor/Empate": "tipo-ve",
  "Golos Equipa": "tipo-golos",
  "Não Pontuou": "tipo-nao",
  "Pendente": "tipo-pendente",
};

// ─── TABS ───────────────────────────────────────────────────────────────────
let activeTab = "resultados";

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.toggle("active", c.id === "tab-" + tab));
  renderTab(tab);
}

function renderTab(tab) {
  const r = getResultados();
  if (tab === "resultados") renderResultados(r);
  else if (tab === "classificacao") renderClassificacao(r);
  else if (tab === "revisao") renderRevisao(r);
  else if (tab === "grupos") renderGrupos(r);
  else if (tab === "whatsapp") renderWhatsapp(r);
}

// ─── TAB: RESULTADOS ────────────────────────────────────────────────────────
function renderResultados(resultados) {
  const grupos = [...new Set(DADOS.jogos.map(j => j.grupo))];
  const container = document.getElementById("resultados-content");

  let html = "";
  for (const g of grupos) {
    const jogos = DADOS.jogos.filter(j => j.grupo === g);
    html += `<div class="grupo-block">
      <div class="grupo-header">Grupo ${g}</div>
      <table class="res-table">
        <thead><tr>
          <th>Cód.</th><th>Jogo</th><th>Resultado</th><th>Estado</th>
        </tr></thead><tbody>`;
    for (const j of jogos) {
      const r = resultados[j.codigo];
      const val = r ? `${r.gc}-${r.gf}` : "";
      const ft = r !== undefined;
      html += `<tr class="${ft ? "row-ft" : ""}">
        <td><span class="badge-grupo">${j.codigo}</span></td>
        <td class="jogo-nome">${fl(j.casa)} <span class="vs">vs</span> ${fl(j.fora)}</td>
        <td>
          <input type="text" class="res-input ${ft ? "res-filled" : ""}"
            placeholder="ex: 2-1"
            value="${val}"
            data-codigo="${j.codigo}"
            maxlength="7"
          />
        </td>
        <td><span class="estado-badge ${ft ? "estado-ft" : "estado-pendente"}">${ft ? "FT" : "PENDENTE"}</span></td>
      </tr>`;
    }
    html += `</tbody></table></div>`;
  }
  container.innerHTML = html;

  container.querySelectorAll(".res-input").forEach(inp => {
    inp.addEventListener("change", e => onResultadoChange(e.target));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.target.blur(); onResultadoChange(e.target); } });
  });
}

function parseRes(str) {
  const m = str.trim().match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (!m) return null;
  return { gc: parseInt(m[1]), gf: parseInt(m[2]) };
}

function onResultadoChange(inp) {
  const cod = inp.dataset.codigo;
  const val = inp.value.trim();
  const resultados = getResultados();

  if (val === "" || val === "-") {
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

// ─── TAB: CLASSIFICAÇÃO ─────────────────────────────────────────────────────
function renderClassificacao(resultados) {
  const cls = calcClassificacao(resultados);
  const jogados = DADOS.jogos.filter(j => resultados[j.codigo]).length;
  const container = document.getElementById("classificacao-content");

  let html = `<div class="cls-info">
    <span>⚽ Jogos com resultado: <strong>${jogados}</strong>/${DADOS.jogos.length}</span>
  </div>
  <table class="cls-table">
    <thead><tr>
      <th>#</th><th>Participante</th>
      <th title="Pontos">Pts</th>
      <th title="Exatos">✅</th>
      <th title="Vencedor/Empate (2pts)">⚽</th>
      <th title="Golos Equipa">🎯</th>
      <th title="Não Pontuou">❌</th>
      <th>Jantar</th>
    </tr></thead><tbody>`;

  for (const s of cls) {
    const posClass = s.pos === 1 ? "pos-1" : s.pos === 2 ? "pos-2" : s.pos === 3 ? "pos-3" : "";
    const pagaClass = s.paga ? "paga-sim" : "paga-nao";
    html += `<tr class="${posClass} ${pagaClass}">
      <td class="pos-col">${s.pos === 1 ? "🥇" : s.pos === 2 ? "🥈" : s.pos === 3 ? "🥉" : s.pos}</td>
      <td class="nome-col"><strong>${s.nome}</strong></td>
      <td class="pts-col"><strong>${s.pts}</strong></td>
      <td>${s.exatos}</td>
      <td>${s.ve}</td>
      <td>${s.golos}</td>
      <td>${s.naoPontua}</td>
      <td><span class="jantar-badge ${s.paga ? "paga" : "nao-paga"}">${s.paga ? "🍽️ PAGA" : "🎉 NÃO PAGA"}</span></td>
    </tr>`;
  }

  html += `</tbody></table>
    <div class="cls-legenda">
      <span class="legenda-item paga-nao-ex">Top 5 — Não paga jantar</span>
      <span class="legenda-item paga-sim-ex">Bottom 5 — Paga jantar</span>
    </div>`;
  container.innerHTML = html;
}

// ─── TAB: REVISÃO LARGA ─────────────────────────────────────────────────────
function renderRevisao(resultados) {
  const container = document.getElementById("revisao-content");
  const participantes = DADOS.participantes;

  let html = `<div class="revisao-scroll"><table class="revisao-table">
    <thead>
      <tr>
        <th class="sticky-col">Jogo</th>
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
    const resStr = r ? `<span class="res-badge">${r.gc}-${r.gf}</span>` : `<span class="pendente-dot">·</span>`;
    html += `<tr>
      <td class="sticky-col jogo-cell">
        <span class="cod-small">${j.codigo}</span>
        ${resStr}
        <span class="equipas-small">${fl(j.casa)} × ${fl(j.fora)}</span>
      </td>`;

    for (const p of participantes) {
      const prog = DADOS.prognosticos[p]?.[j.codigo];
      if (!prog) { html += `<td>—</td>`; continue; }
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

// ─── TAB: GRUPOS ────────────────────────────────────────────────────────────
function renderGrupos(resultados) {
  const container = document.getElementById("grupos-content");
  const grupos = [...new Set(DADOS.jogos.map(j => j.grupo))];

  // Calcular standings por grupo
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
      b.pts - a.pts || b.gd - a.gd || b.gm - a.gm || a.e.localeCompare(b.e)
    );
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
      const qualClass = i < 2 ? "qualifica" : i === 2 ? "terceiro" : "";
      html += `<tr class="${qualClass}">
        <td class="pos-num">${i+1}</td>
        <td class="equipa-nome">${fl(s.e)}</td>
        <td>${s.pj}</td><td>${s.v}</td><td>${s.ep}</td><td>${s.d}</td>
        <td>${s.gm}</td><td>${s.gs}</td><td>${s.gd > 0 ? "+"+s.gd : s.gd}</td>
        <td><strong>${s.pts}</strong></td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }
  html += `</div>
    <div class="grupos-legenda">
      <span class="qualifica-ex">▶ Qualificados</span>
      <span class="terceiro-ex">▶ Melhor 3.º (possível)</span>
    </div>`;
  container.innerHTML = html;
}

// ─── TAB: WHATSAPP ──────────────────────────────────────────────────────────
function renderWhatsapp(resultados) {
  const container = document.getElementById("whatsapp-content");
  const jogosHoje = DADOS.jogos.filter(j => resultados[j.codigo]);

  if (jogosHoje.length === 0) {
    container.innerHTML = `<div class="wa-empty">Ainda não há resultados registados. Introduz resultados no separador <strong>Resultados</strong>.</div>`;
    return;
  }

  const cls = calcClassificacao(resultados);

  // Mensagem geral
  let msgGeral = `🌍 *PREDICTOR PARQUE BIOLÓGICO — MUNDIAL 2026*\n`;
  msgGeral += `📊 _Classificação após ${jogosHoje.length} jogo(s):_\n\n`;
  for (const s of cls) {
    const medal = s.pos === 1 ? "🥇" : s.pos === 2 ? "🥈" : s.pos === 3 ? "🥉" : `${s.pos}.`;
    msgGeral += `${medal} *${s.nome}* — ${s.pts} pts`;
    if (s.exatos > 0) msgGeral += ` (${s.exatos} exatos ✅)`;
    msgGeral += "\n";
  }
  msgGeral += `\n🍽️ _Paga jantar: ${cls.filter(s=>s.paga).map(s=>s.nome.split(" ")[0]).join(", ")}_`;

  // Mensagem jogos do dia (últimos 5 resultados)
  const recentes = [...jogosHoje].reverse().slice(0, 10);
  let msgJogos = `⚽ *RESULTADOS RECENTES*\n\n`;
  for (const j of recentes) {
    const r = resultados[j.codigo];
    msgJogos += `*${fl(j.casa)} ${r.gc} - ${r.gf} ${fl(j.fora)}*\n`;
    msgJogos += `_Grupo ${j.grupo} | ${j.codigo}_\n`;
    msgJogos += `\`\`\`\n`;
    for (const p of DADOS.participantes) {
      const prog = DADOS.prognosticos[p]?.[j.codigo];
      if (!prog) continue;
      const tipo = getTipo(prog.casa, prog.fora, r.gc, r.gf);
      const pts = getPontos(tipo);
      const emoji = { "Exato":"✅","Vencedor/Empate":"⚽","Golos Equipa":"🎯","Não Pontuou":"❌","Pendente":"⏳" }[tipo];
      msgJogos += `${emoji} ${p.split(" ")[0].padEnd(10)} ${prog.resultado}  +${pts}pts\n`;
    }
    msgJogos += `\`\`\`\n\n`;
  }

  let html = `<div class="wa-container">
    <div class="wa-block">
      <div class="wa-title">📊 Mensagem Classificação Geral</div>
      <textarea class="wa-textarea" id="wa-geral" readonly>${msgGeral}</textarea>
      <button class="btn-copy" onclick="copyWA('wa-geral')">📋 Copiar</button>
    </div>
    <div class="wa-block">
      <div class="wa-title">⚽ Mensagem Resultados Recentes</div>
      <textarea class="wa-textarea" id="wa-jogos" readonly>${msgJogos}</textarea>
      <button class="btn-copy" onclick="copyWA('wa-jogos')">📋 Copiar</button>
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
    setTimeout(() => { btn.textContent = orig; }, 2000);
  }).catch(() => {
    ta.select();
    document.execCommand("copy");
  });
}

// ─── RESET ──────────────────────────────────────────────────────────────────
function resetResultados() {
  if (!confirm("Apagar todos os resultados? Esta ação não pode ser desfeita.")) return;
  localStorage.removeItem(LS_KEY);
  renderTab(activeTab);
}

// ─── INIT ───────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar localStorage se vazio
  getResultados();
  switchTab("resultados");
});
