// ─── FEATURES AVANÇADAS ──────────────────────────────────────────────────────

let _pendingConflicts = [];

// ─── Prognósticos protegidos (Supabase) ───────────────────────────────────────
async function loadPrognosticos() {
  // data.js é sempre a fonte de verdade (720 previsões embarcadas)
  const embedded = DADOS.prognosticos || {};
  const nPlayers = Object.keys(embedded).length;
  const nPreds = nPlayers ? Object.keys(embedded[Object.keys(embedded)[0]] || {}).length : 0;

  if (nPlayers >= 10 && nPreds >= 72) return true;

  // Supabase só se data.js falhar (não deve acontecer)
  const p = dbGet(DB_KEYS.PROGNOSTICOS);
  if (p && Object.keys(p).length >= 10) {
    DADOS.prognosticos = p;
    return true;
  }
  console.error("[Prognósticos] data.js incompleto — verifica deploy/cache");
  return false;
}

/** Limpa overrides 0-0 acidentais que bloqueiam a BD */
function healCorruptOverrides() {
  const ov = getGSOverrides();
  let changed = false;
  for (const pi of Object.keys(ov)) {
    for (const cod of Object.keys(ov[pi] || {})) {
      const o = ov[pi][cod];
      const base = DADOS.prognosticos[DADOS.participantes[pi]]?.[cod];
      if (!base) continue;
      // Override 0-0 mas BD tem valores diferentes → lixo de quando prognosticos estavam vazios
      if (o.casa === 0 && o.fora === 0 && (base.casa !== 0 || base.fora !== 0)) {
        delete ov[pi][cod];
        changed = true;
      }
    }
    if (ov[pi] && !Object.keys(ov[pi]).length) delete ov[pi];
  }
  if (changed) {
    saveGSOverrides(ov);
    console.log("[Prognósticos] Overrides corruptos reparados automaticamente");
  }
  return changed;
}

// ─── Histórico classificação ──────────────────────────────────────────────────
function saveClassificationSnapshot(resultados) {
  const cls = calcClassificacao(resultados);
  const snap = {
    ts: Date.now(),
    date: new Date().toISOString(),
    jogos: Object.keys(resultados).length,
    ranking: cls.map(s => ({ nome: s.nome, pts: s.pts, pos: s.pos })),
  };
  const hist = dbGet(DB_KEYS.CLASS_HISTORY) || [];
  const last = hist[hist.length - 1];
  if (last && last.jogos === snap.jogos && last.ranking[0]?.pts === snap.ranking[0]?.pts) return;
  hist.push(snap);
  if (hist.length > 60) hist.splice(0, hist.length - 60);
  dbSet(DB_KEYS.CLASS_HISTORY, hist);
}

function renderClassificationHistory(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const hist = dbGet(DB_KEYS.CLASS_HISTORY) || [];
  if (hist.length < 2) {
    el.innerHTML = `<p class="feat-hint">Histórico disponível após várias sincronizações.</p>`;
    return;
  }
  // Top 3 pelo ranking mais recente — não a ordem em que os jogadores
  // aparecem em DADOS.participantes (isso mostrava sempre os 3 primeiros
  // da lista, não os 3 líderes reais).
  const lastRanking = hist[hist.length - 1]?.ranking || [];
  const top3 = lastRanking.slice(0, 3).map(r => r.nome);
  let html = `<div class="history-chart"><canvas id="history-canvas" height="120"></canvas></div>`;
  html += `<div class="history-list">`;
  hist.slice(-8).reverse().forEach(h => {
    const d = new Date(h.ts).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    html += `<div class="history-row"><span class="history-date">${d}</span><span>${h.jogos} jogos</span><span class="history-leader">🥇 ${h.ranking[0]?.nome || "—"} (${h.ranking[0]?.pts}pts)</span></div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
  drawHistoryChart(hist, top3);
}

function drawHistoryChart(hist, participants) {
  const canvas = document.getElementById("history-canvas");
  if (!canvas || !hist.length) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.parentElement.clientWidth || 400;
  canvas.width = w;
  const h = 120;
  const slice = hist.slice(-12);
  const top3 = participants.slice(0, 3);
  const colors = ["#fbbf24", "#22d3ee", "#34d399"];
  ctx.clearRect(0, 0, w, h);
  slice.forEach((snap, si) => {
    top3.forEach((nome, pi) => {
      const entry = snap.ranking.find(r => r.nome === nome);
      if (!entry) return;
      const x = (si / Math.max(slice.length - 1, 1)) * (w - 40) + 20;
      const y = h - 20 - (entry.pts / Math.max(snap.ranking[0]?.pts || 1, 1)) * (h - 40);
      ctx.fillStyle = colors[pi];
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      if (si > 0) {
        const prev = slice[si - 1].ranking.find(r => r.nome === nome);
        if (prev) {
          const px = ((si - 1) / Math.max(slice.length - 1, 1)) * (w - 40) + 20;
          const py = h - 20 - (prev.pts / Math.max(slice[si - 1].ranking[0]?.pts || 1, 1)) * (h - 40);
          ctx.strokeStyle = colors[pi];
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    });
  });
}

function getLiveScores() {
  return dbGet(DB_KEYS.LIVE_SCORES) || {};
}

// ─── Conflitos API vs manual ──────────────────────────────────────────────────
function queueConflict(codigo, jogo, existing, incoming) {
  _pendingConflicts.push({ codigo, jogo, existing, incoming });
}

function showNextConflict() {
  if (!_pendingConflicts.length) return;
  const c = _pendingConflicts[0];
  const j = c.jogo;
  const modal = document.getElementById("conflict-modal");
  if (!modal) return;
  document.getElementById("conflict-title").textContent =
    `${j.codigo}: ${j.casa} vs ${j.fora}`;
  document.getElementById("conflict-manual").textContent =
    `✋ Manter manual (${c.existing.gc}-${c.existing.gf})`;
  document.getElementById("conflict-api").textContent =
    `🔄 Usar API (${c.incoming.gc}-${c.incoming.gf})`;
  modal.classList.add("active");
  modal.dataset.codigo = c.codigo;
}

function resolveConflict(useApi) {
  const modal = document.getElementById("conflict-modal");
  const cod = modal?.dataset.codigo;
  const c = _pendingConflicts.find(x => x.codigo === cod);
  if (!c) return;
  const resultados = getResultados();
  if (useApi) {
    resultados[c.codigo] = { ...c.incoming, _ts: Date.now(), _api: true };
  } else {
    resultados[c.codigo] = { ...c.existing, _manual: true, _ts: Date.now() };
  }
  saveResultados(resultados);
  _pendingConflicts.shift();
  modal.classList.remove("active");
  if (_pendingConflicts.length) showNextConflict();
  else renderTab(activeTab);
}

// ─── Web Share API ────────────────────────────────────────────────────────────
function shareNative(text, title) {
  if (navigator.share) {
    navigator.share({ title: title || "Predictor 2026", text }).catch(() => copyFallback(text));
  } else {
    copyFallback(text);
  }
}
function copyFallback(text) {
  navigator.clipboard.writeText(text).then(() => alert("Copiado!")).catch(() => {});
}

// ─── Export classificação ─────────────────────────────────────────────────────
function exportClassificacaoImage() {
  const resultados = getResultados();
  const cls = calcClassificacao(resultados);
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 80 + cls.length * 36;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0f1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 22px Outfit, sans-serif";
  ctx.fillText("🏆 Predictor Mundial 2026", 20, 36);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px Outfit, sans-serif";
  ctx.fillText(new Date().toLocaleString("pt-PT"), 20, 58);
  cls.forEach((s, i) => {
    const y = 90 + i * 36;
    ctx.fillStyle = s.paga ? "#fb7185" : "#34d399";
    ctx.font = "16px Outfit, sans-serif";
    ctx.fillText(`${s.pos}. ${s.nome}`, 20, y);
    ctx.fillStyle = "#fbbf24";
    ctx.textAlign = "right";
    ctx.fillText(`${s.pts} pts`, 580, y);
    ctx.textAlign = "left";
  });
  canvas.toBlob(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `classificacao_${Date.now()}.png`;
    a.click();
  });
}

function exportBackupJSON() {
  const backup = {
    exported: new Date().toISOString(),
    resultados: getResultados(),
    matamata: getMataMata(),
    gs_overrides: getGSOverrides(),
    ko_preds: getKOPredsAll(),
    class_history: dbGet(DB_KEYS.CLASS_HISTORY) || [],
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `predictor_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  dbSet(DB_KEYS.BACKUPS, { last: backup.exported, keys: Object.keys(backup.resultados).length });
}

// ─── Modo Apresentação (jantar) ─────────────────────────────────────────────
// A fronteira paga/não-paga (posição half/half+1) é o clímax final — mais
// peso que o próprio campeão. Ver secção "Modo Jantar" da spec.
function buildJantarSlides(cls, awards) {
  const ordem = buildPresentationOrder(cls.length);
  const porPos = {};
  cls.forEach(s => { porPos[s.pos] = s; });
  const slides = [
    { type: "intro", title: "🏆 Predictor Parque Biológico", body: "Mundial 2026 · Revelação no Jantar", sub: `${cls.length} participantes` },
  ];

  const premiosDisponiveis = awards.filter(a => a.vencedor);
  let premioIdx = 0;
  let contadorFaseAB = 0;

  ordem.forEach(({ pos, fase }) => {
    const s = porPos[pos];
    if (!s) return;
    if (fase === "C") {
      slides.push({ type: "campeao", pos: s.pos, nome: s.nome, pts: s.pts, paga: s.paga });
      return;
    }
    if (fase === "D") {
      slides.push({ type: "fronteira", pos: s.pos, nome: s.nome, pts: s.pts, paga: s.paga });
      return;
    }
    slides.push({ type: "rank", pos: s.pos, nome: s.nome, pts: s.pts, paga: s.paga });
    contadorFaseAB++;
    if (contadorFaseAB % 3 === 0 && premioIdx < premiosDisponiveis.length) {
      slides.push({ type: "premio", ...premiosDisponiveis[premioIdx++] });
    }
  });

  return slides;
}

let _presentationActive = false;
let _presSlides = [];
let _presSlide = 0;
let _presStage = 1;

// Nº de cliques de revelação por tipo de slide: 1 = mostra tudo já.
function stageCountFor(slide) {
  if (slide.type === "rank") return 2;
  if (slide.type === "curio") return 3;
  return 1;
}

// ─── Modo Curiosidades (slides das 20 curiosidades, título → stat → nome) ────
function buildCuriosidadesSlides(awards) {
  const comVencedor = awards.filter(a => a.vencedor);
  const slides = [
    { type: "intro", title: "🏆 Curiosidades da Época", body: "As estatísticas mais divertidas do grupo", sub: `${comVencedor.length} prémios` },
  ];
  comVencedor.forEach(a => slides.push({ type: "curio", ...a }));
  return slides;
}

function openCuriosidadesMode() {
  _presentationActive = true;
  const overlay = document.getElementById("presentation-overlay");
  if (!overlay) return;
  const awards = calcCuriosidades(buildCuriosidadesInput());
  _presSlides = buildCuriosidadesSlides(awards);
  _presSlide = 0;
  _presStage = 1;
  overlay.classList.add("active");
  renderPresentationSlide();
}

function openPresentationMode() {
  _presentationActive = true;
  const overlay = document.getElementById("presentation-overlay");
  if (!overlay) return;
  const cls = calcClassificacao(getResultados());
  const awards = calcCuriosidades(buildCuriosidadesInput());
  _presSlides = buildJantarSlides(cls, awards);
  _presSlide = 0;
  _presStage = 1;
  overlay.classList.add("active");
  renderPresentationSlide();
}

function closePresentationMode() {
  _presentationActive = false;
  document.getElementById("presentation-overlay")?.classList.remove("active");
}

function presentationNext() {
  const slide = _presSlides[_presSlide];
  if (_presStage < stageCountFor(slide)) {
    _presStage++;
  } else if (_presSlide < _presSlides.length - 1) {
    _presSlide++;
    _presStage = 1;
  }
  renderPresentationSlide();
}

function presentationPrev() {
  if (_presSlide > 0) {
    _presSlide--;
    _presStage = 1;
  }
  renderPresentationSlide();
}

function renderPresentationSlide() {
  const el = document.getElementById("presentation-content");
  if (!el) return;
  const slide = _presSlides[_presSlide];
  const maxStage = stageCountFor(slide);
  const isFirst = _presSlide === 0;
  const isLast = _presSlide >= _presSlides.length - 1 && _presStage >= maxStage;

  let bodyHtml = "";
  if (slide.type === "intro") {
    bodyHtml = `<div class="pres-slide"><h2 class="pres-title">${slide.title}</h2><p class="pres-body">${slide.body}</p><p class="pres-sub">${slide.sub}</p></div>`;
  } else if (slide.type === "premio") {
    bodyHtml = `<div class="pres-slide pres-premio"><div class="pres-premio-icon">${slide.icon}</div><h2 class="pres-title">${slide.titulo}</h2><p class="pres-body">${slide.vencedor}</p><p class="pres-sub">${slide.valor} · ${slide.detalhe}</p></div>`;
  } else if (slide.type === "rank") {
    bodyHtml = _presStage === 1
      ? `<div class="pres-slide"><h2 class="pres-title pres-blur">${slide.pos}.º lugar</h2><p class="pres-sub">clica para revelar</p></div>`
      : `<div class="pres-slide"><h2 class="pres-title">${slide.pos}.º ${slide.nome}</h2><p class="pres-body">${slide.pts} pontos</p><p class="pres-sub ${slide.paga ? "pres-paga" : ""}">${slide.paga ? "🍽️ Paga o jantar" : "🎉 Não paga!"}</p></div>`;
  } else if (slide.type === "campeao") {
    bodyHtml = `<div class="pres-slide pres-campeao"><div class="pres-confetti"></div><h2 class="pres-title">🏆 CAMPEÃO</h2><p class="pres-body">${slide.nome}</p><p class="pres-sub">${slide.pts} pontos</p></div>`;
  } else if (slide.type === "fronteira") {
    const label = slide.paga ? "😅 Vais pagar o jantar hoje!" : "🥳 Escapaste por um triz!";
    bodyHtml = `<div class="pres-slide pres-fronteira"><h2 class="pres-title">${slide.pos}.º ${slide.nome}</h2><p class="pres-body">${slide.pts} pontos</p><p class="pres-sub pres-fronteira-label">${label}</p></div>`;
  } else if (slide.type === "curio") {
    if (_presStage === 1) {
      bodyHtml = `<div class="pres-slide pres-premio"><div class="pres-premio-icon">${slide.icon}</div><h2 class="pres-title">${slide.titulo}</h2><p class="pres-sub">clica para revelar</p></div>`;
    } else if (_presStage === 2) {
      bodyHtml = `<div class="pres-slide pres-premio"><div class="pres-premio-icon">${slide.icon}</div><h2 class="pres-title">${slide.titulo}</h2><p class="pres-body">${slide.valor}</p><p class="pres-sub">${slide.detalhe}</p></div>`;
    } else {
      bodyHtml = `<div class="pres-slide pres-premio"><div class="pres-premio-icon">${slide.icon}</div><h2 class="pres-title">${slide.titulo}</h2><p class="pres-body">${slide.valor}</p><p class="pres-sub pres-curio-vencedor">🏆 ${slide.vencedor}</p></div>`;
    }
  }

  const proximoLabel = _presStage < maxStage ? "Revelar →" : "Seguinte →";
  el.innerHTML = `${bodyHtml}
    <div class="pres-nav">
      <button onclick="presentationPrev()" ${isFirst ? "disabled" : ""}>← Anterior</button>
      <span>${_presSlide + 1} / ${_presSlides.length}</span>
      <button onclick="presentationNext()" ${isLast ? "disabled" : ""}>${proximoLabel}</button>
    </div>`;
}

// ─── Auto-preencher Mata-Mata (top 2 + 8 melhores terceiros → R32) ──────────
function computeGroupQualified(resultados) {
  const grupos = [...new Set(DADOS.jogos.map(j => j.grupo))].sort();
  const directQualified = [];
  const thirdPlaced = [];

  for (const g of grupos) {
    const jogos = DADOS.jogos.filter(j => j.grupo === g);
    const equipas = new Set();
    jogos.forEach(j => { equipas.add(j.casa); equipas.add(j.fora); });
    const stats = {};
    equipas.forEach(e => { stats[e] = { e, pts: 0, gd: 0, gm: 0, g }; });
    for (const j of jogos) {
      const r = resultados[j.codigo];
      if (!r) continue;
      const { gc, gf } = r;
      const sc = stats[j.casa], sf = stats[j.fora];
      sc.gm += gc; sc.gd += gc - gf;
      sf.gm += gf; sf.gd += gf - gc;
      if (gc > gf) sc.pts += 3;
      else if (gc < gf) sf.pts += 3;
      else { sc.pts++; sf.pts++; }
    }
    const st = Object.values(stats).sort((a, b) =>
      b.pts - a.pts || b.gd - a.gd || b.gm - a.gm || a.e.localeCompare(b.e)
    );
    if (st[0]) directQualified.push(st[0].e);
    if (st[1]) directQualified.push(st[1].e);
    if (st[2]) thirdPlaced.push(st[2]);
  }

  const bestThirds = thirdPlaced
    .sort((a, b) =>
      b.pts - a.pts || b.gd - a.gd || b.gm - a.gm || a.g.localeCompare(b.g)
    )
    .slice(0, 8)
    .map(t => t.e);

  return [...directQualified, ...bestThirds];
}

/** Actualiza R32 com 1.º/2.º + 8 melhores terceiros (corre ao guardar resultados). */
function syncMataMataFromGroups(opts = {}) {
  const resultados = getResultados();
  const qualified = computeGroupQualified(resultados);
  if (qualified.length < 2) return false;

  const mm = getMataMata();
  let changed = false;

  for (let i = 0; i < Math.min(16, Math.floor(qualified.length / 2)); i++) {
    const e1 = qualified[i * 2] || "";
    const e2 = qualified[i * 2 + 1] || "";
    const game = mm.r32[i];
    if (!game || (game.gc !== null && game.gf !== null)) continue;
    if (game.e1 !== e1 || game.e2 !== e2) {
      game.e1 = e1;
      game.e2 = e2;
      changed = true;
    }
  }

  if (!changed) return false;

  saveMataMata(mm);
  if (activeTab === "matamata") renderMataMata(mm);
  if (opts.notify) showApiStatus(`R32 actualizado (${qualified.length} qualificados)`, "ok");
  return true;
}

function autoFillMataMataFromGroups() {
  syncMataMataFromGroups({ notify: true });
}

// ─── Pull to refresh ──────────────────────────────────────────────────────────
function initPullToRefresh() {
  let startY = 0, pulling = false;
  const indicator = document.getElementById("pull-indicator");
  document.addEventListener("touchstart", e => {
    if (window.scrollY <= 0) startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener("touchmove", e => {
    if (startY && e.touches[0].clientY - startY > 80 && window.scrollY <= 0) {
      pulling = true;
      if (indicator) { indicator.style.opacity = "1"; indicator.textContent = "↻ Larga para sincronizar"; }
    }
  }, { passive: true });
  document.addEventListener("touchend", () => {
    if (pulling) apiFetch();
    pulling = false;
    startY = 0;
    if (indicator) setTimeout(() => { indicator.style.opacity = "0"; }, 600);
  });
}

// ─── PWA ──────────────────────────────────────────────────────────────────────
function initPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

// ─── Init all features ────────────────────────────────────────────────────────
async function initFeatures() {
  initPWA();
  initPullToRefresh();
  await loadPrognosticos();
  if (healCorruptOverrides()) {
    showApiStatus("✅ Previsões reparadas automaticamente", "ok");
    try { renderTab(activeTab); } catch {}
  }
  syncMataMataFromGroups({ silent: true });
}
