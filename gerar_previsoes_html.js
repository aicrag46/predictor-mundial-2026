/**
 * Gera 10 ficheiros HTML individuais — Predictor Parque Biológico · Mundial 2026
 * 100% STATIC HTML — sem JavaScript para renderização inicial
 * Funciona em WhatsApp, email, qualquer browser, com ou sem JS
 */

const fs   = require("fs");
const path = require("path");

eval(fs.readFileSync(path.join(__dirname, "js/data.js"), "utf8"));

// ─── Schedule ─────────────────────────────────────────────────────────────────
const SCHEDULE = {
  A1:{data:"2026-06-11",hora:"00:00",cidade:"Cidade do México"},  A2:{data:"2026-06-12",hora:"04:00",cidade:"Guadalajara"},
  B1:{data:"2026-06-13",hora:"00:00",cidade:"Toronto"},           D1:{data:"2026-06-13",hora:"03:00",cidade:"Los Angeles"},
  B2:{data:"2026-06-14",hora:"00:00",cidade:"São Francisco"},     C1:{data:"2026-06-14",hora:"03:00",cidade:"Nova Jérsia"},
  C2:{data:"2026-06-14",hora:"22:00",cidade:"Boston"},            D2:{data:"2026-06-15",hora:"01:00",cidade:"Houston"},
  E1:{data:"2026-06-15",hora:"19:00",cidade:"Dallas"},            E2:{data:"2026-06-15",hora:"22:00",cidade:"Filadélfia"},
  F1:{data:"2026-06-16",hora:"00:00",cidade:"Monterrey"},         F2:{data:"2026-06-16",hora:"02:00",cidade:"Monterrey"},
  G1:{data:"2026-06-16",hora:"20:00",cidade:"Atlanta"},           G2:{data:"2026-06-16",hora:"23:00",cidade:"Seattle"},
  H1:{data:"2026-06-17",hora:"01:00",cidade:"Los Angeles"},       H2:{data:"2026-06-17",hora:"20:00",cidade:"Miami"},
  I1:{data:"2026-06-17",hora:"00:00",cidade:"Nova Jérsia"},       I2:{data:"2026-06-17",hora:"03:00",cidade:"Boston"},
  J1:{data:"2026-06-17",hora:"22:00",cidade:"Kansas City"},       J2:{data:"2026-06-18",hora:"01:00",cidade:"São Francisco"},
  K1:{data:"2026-06-18",hora:"00:00",cidade:"Houston"},           K2:{data:"2026-06-18",hora:"03:00",cidade:"Dallas"},
  L1:{data:"2026-06-18",hora:"20:00",cidade:"Filadélfia"},        L2:{data:"2026-06-18",hora:"23:00",cidade:"Toronto"},
  A3:{data:"2026-06-19",hora:"17:00",cidade:"Atlanta"},           A4:{data:"2026-06-19",hora:"20:00",cidade:"Guadalajara"},
  B3:{data:"2026-06-19",hora:"20:00",cidade:"Los Angeles"},       B4:{data:"2026-06-19",hora:"23:00",cidade:"Vancouver"},
  C3:{data:"2026-06-20",hora:"20:00",cidade:"Boston"},            C4:{data:"2026-06-20",hora:"23:00",cidade:"Houston"},
  D3:{data:"2026-06-21",hora:"17:00",cidade:"Dallas"},            D4:{data:"2026-06-21",hora:"20:00",cidade:"Kansas City"},
  E3:{data:"2026-06-21",hora:"20:00",cidade:"Seattle"},           E4:{data:"2026-06-21",hora:"23:00",cidade:"Miami"},
  F3:{data:"2026-06-22",hora:"00:00",cidade:"Los Angeles"},       F4:{data:"2026-06-22",hora:"03:00",cidade:"Dallas"},
  G3:{data:"2026-06-22",hora:"20:00",cidade:"Nova Jérsia"},       G4:{data:"2026-06-22",hora:"23:00",cidade:"Seattle"},
  H3:{data:"2026-06-23",hora:"00:00",cidade:"Kansas City"},       H4:{data:"2026-06-23",hora:"03:00",cidade:"São Francisco"},
  I3:{data:"2026-06-23",hora:"20:00",cidade:"Houston"},           I4:{data:"2026-06-23",hora:"23:00",cidade:"Atlanta"},
  J3:{data:"2026-06-24",hora:"00:00",cidade:"Filadélfia"},        J4:{data:"2026-06-24",hora:"03:00",cidade:"Miami"},
  K3:{data:"2026-06-24",hora:"20:00",cidade:"Boston"},            K4:{data:"2026-06-24",hora:"23:00",cidade:"Kansas City"},
  L3:{data:"2026-06-25",hora:"00:00",cidade:"Dallas"},            L4:{data:"2026-06-25",hora:"03:00",cidade:"Filadélfia"},
  A5:{data:"2026-06-25",hora:"21:00",cidade:"Cidade do México"},  A6:{data:"2026-06-25",hora:"21:00",cidade:"Monterrey"},
  B5:{data:"2026-06-25",hora:"00:00",cidade:"Vancouver"},         B6:{data:"2026-06-25",hora:"00:00",cidade:"Seattle"},
  C5:{data:"2026-06-26",hora:"00:00",cidade:"Los Angeles"},       C6:{data:"2026-06-26",hora:"00:00",cidade:"Atlanta"},
  D5:{data:"2026-06-26",hora:"02:00",cidade:"Nova Jérsia"},       D6:{data:"2026-06-26",hora:"02:00",cidade:"Miami"},
  E5:{data:"2026-06-26",hora:"21:00",cidade:"Kansas City"},       E6:{data:"2026-06-26",hora:"21:00",cidade:"Boston"},
  F5:{data:"2026-06-27",hora:"00:00",cidade:"Houston"},           F6:{data:"2026-06-27",hora:"00:00",cidade:"São Francisco"},
  G5:{data:"2026-06-27",hora:"02:00",cidade:"Dallas"},            G6:{data:"2026-06-27",hora:"02:00",cidade:"Seattle"},
  H5:{data:"2026-06-27",hora:"21:00",cidade:"Houston"},           H6:{data:"2026-06-27",hora:"21:00",cidade:"Guadalajara"},
  I5:{data:"2026-06-28",hora:"00:00",cidade:"Los Angeles"},       I6:{data:"2026-06-28",hora:"00:00",cidade:"Toronto"},
  J5:{data:"2026-06-28",hora:"02:00",cidade:"Kansas City"},       J6:{data:"2026-06-28",hora:"02:00",cidade:"Dallas"},
  K5:{data:"2026-06-28",hora:"21:00",cidade:"Miami"},             K6:{data:"2026-06-28",hora:"21:00",cidade:"Atlanta"},
  L5:{data:"2026-06-28",hora:"02:00",cidade:"Nova Jérsia"},       L6:{data:"2026-06-28",hora:"02:00",cidade:"Filadélfia"},
};

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
};
const fl = t => FLAGS[t] || "🏳";

const GROUP_COLORS = {
  A:"#ef4444",B:"#f97316",C:"#eab308",D:"#22c55e",
  E:"#06b6d4",F:"#6366f1",G:"#a855f7",H:"#ec4899",
  I:"#14b8a6",J:"#f59e0b",K:"#3b82f6",L:"#10b981"
};

function getJornada(cod) {
  const n = parseInt(cod.slice(1));
  return n <= 2 ? 1 : n <= 4 ? 2 : 3;
}

function fmtDataLong(d) {
  const dt    = new Date(d + "T12:00:00");
  const dias  = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${dias[dt.getDay()]}, ${dt.getDate()} de ${meses[dt.getMonth()]} de ${dt.getFullYear()}`;
}

function fmtDataShort(d) {
  const dt    = new Date(d + "T12:00:00");
  const dias  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${dias[dt.getDay()]} ${dt.getDate()} ${meses[dt.getMonth()]}`;
}

// ─── Renderizar card estático ──────────────────────────────────────────────────
function renderCard(j, pred) {
  const color   = GROUP_COLORS[j.grupo] || "#f59e0b";
  const predStr = pred ? `${pred.casa}-${pred.fora}` : null;
  const jornada = getJornada(j.codigo);

  const predHtml = predStr
    ? `<div class="pred-score">${predStr}</div>`
    : `<div class="pred-score empty">Sem previsão</div>`;

  // data-attrs para filtros JS
  return `<div class="game-card"
  data-grupo="${j.grupo}"
  data-jornada="${jornada}"
  data-search="${j.casa.toLowerCase()} ${j.fora.toLowerCase()} ${j.codigo.toLowerCase()} ${j.grupo.toLowerCase()}">

  <div class="card-stripe" style="background:linear-gradient(90deg,${color},${color}66)"></div>

  <div class="card-head">
    <div class="card-badges">
      <span class="grupo-badge" style="background:${color}22;color:${color};border:1px solid ${color}44">Grupo ${j.grupo}</span>
      <span class="jornada-badge">Jornada ${jornada}</span>
      <span class="card-codigo">${j.codigo}</span>
    </div>
    <div class="card-time">🕐 ${j.hora} <small>(Lisboa)</small></div>
  </div>

  <div class="card-teams">
    <div class="team">
      <span class="team-flag">${fl(j.casa)}</span>
      <div class="team-name">${j.casa}</div>
    </div>
    <div class="vs-wrap">
      <span class="vs-text">VS</span>
    </div>
    <div class="team">
      <span class="team-flag">${fl(j.fora)}</span>
      <div class="team-name">${j.fora}</div>
    </div>
  </div>

  <div class="pred-box">
    <div class="pred-left">
      <div class="pred-tag">🎯 A minha previsão</div>
      ${predHtml}
    </div>
    <div class="pred-right">
      <div class="pred-ball">⚽</div>
      <div class="pred-city">📍 ${j.cidade}</div>
    </div>
  </div>

</div>`;
}

// ─── Renderizar grupos de data estaticamente ───────────────────────────────────
function renderAllGames(nome) {
  const preds = DADOS.prognosticos[nome] || {};

  // Agrupar por data
  const byDate = {};
  DADOS.jogos.forEach(j => {
    const sch = SCHEDULE[j.codigo] || { data:"2026-06-11", hora:"00:00", cidade:"" };
    if (!byDate[sch.data]) byDate[sch.data] = [];
    byDate[sch.data].push({ ...j, hora: sch.hora, cidade: sch.cidade });
  });

  return Object.keys(byDate).sort().map(data => {
    const jogos  = byDate[data];
    const label  = fmtDataLong(data);
    const cards  = jogos.map(j => renderCard(j, preds[j.codigo])).join("\n");
    return `
<div class="date-group" data-date="${data}">
  <div class="date-label">
    <span class="date-label-icon">📅</span>
    <span class="date-label-text">${label}</span>
    <div class="date-label-line"></div>
    <span class="date-label-count">${jogos.length} jogo${jogos.length > 1 ? "s" : ""}</span>
  </div>
  <div class="cards-grid">
${cards}
  </div>
</div>`;
  }).join("\n");
}

// ─── Gerar HTML completo ───────────────────────────────────────────────────────
function buildHTML(nome, pi) {
  const preds      = DADOS.prognosticos[nome] || {};
  const totalPreds = Object.keys(preds).length;
  const today      = new Date().toLocaleDateString("pt-PT");
  const grupos     = [...new Set(DADOS.jogos.map(j => j.grupo))].sort();
  const gamesHTML  = renderAllGames(nome);

  const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#03092b;--navy2:#060f2e;--navy3:#0a1640;
  --gold:#c9a84c;--gold2:#f0c96a;--gold3:#fff3b0;
  --red:#c8102e;--blue:#003DA5;
  --text:#e8eef8;--muted:#7a90b8;--border:rgba(255,255,255,.07);
  --radius:14px;
}
html{scroll-behavior:smooth}
body{background:var(--navy);color:var(--text);
  font-family:"Segoe UI",system-ui,-apple-system,sans-serif;
  min-height:100vh;overflow-x:hidden;}
body::before{
  content:"";position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%,rgba(0,61,165,.35) 0%,transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 80%,rgba(200,16,46,.12) 0%,transparent 55%),
    radial-gradient(ellipse 50% 30% at 10% 60%,rgba(201,168,76,.08) 0%,transparent 50%);
}
/* HERO */
.hero{position:relative;z-index:1;padding:0 20px;
  background:linear-gradient(180deg,rgba(0,30,90,.95) 0%,rgba(3,9,43,.98) 100%);
  border-bottom:1px solid rgba(201,168,76,.25);overflow:hidden;}
.hero::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(255,255,255,.018) 60px,rgba(255,255,255,.018) 61px),
    repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(255,255,255,.018) 60px,rgba(255,255,255,.018) 61px);}
.hero-inner{max-width:720px;margin:0 auto;padding:40px 0 36px;text-align:center;position:relative;}
.wc-badge{display:inline-flex;align-items:center;gap:8px;
  background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.3);
  padding:6px 16px;border-radius:20px;font-size:.72rem;font-weight:700;
  color:var(--gold2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:20px;}
.trophy-wrap{font-size:4rem;line-height:1;margin-bottom:8px;
  animation:float 3s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.hero-event{font-size:.85rem;font-weight:700;color:var(--muted);
  letter-spacing:.15em;text-transform:uppercase;margin-bottom:6px;}
.hero-name{font-size:clamp(2rem,7vw,3.2rem);font-weight:900;
  background:linear-gradient(135deg,var(--gold) 0%,var(--gold2) 50%,var(--gold3) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  line-height:1.1;margin-bottom:4px;filter:drop-shadow(0 2px 16px rgba(201,168,76,.4));}
.hero-doc{font-size:.82rem;color:var(--muted);margin-bottom:24px;}
.hero-divider{display:flex;align-items:center;gap:12px;margin:0 auto 24px;max-width:400px;}
.hero-divider::before,.hero-divider::after{content:"";flex:1;height:1px;
  background:linear-gradient(90deg,transparent,rgba(201,168,76,.4),transparent);}
.hero-stats{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.stat-pill{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);
  border-radius:24px;padding:8px 18px;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:80px;}
.stat-pill-val{font-size:1.4rem;font-weight:900;color:var(--gold2);line-height:1;}
.stat-pill-lbl{font-size:.62rem;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;}
.hosts{display:flex;justify-content:center;gap:14px;margin-top:20px;
  font-size:.7rem;color:var(--muted);align-items:center;flex-wrap:wrap;}
.host-flag{font-size:1.4rem;}
.host-sep{opacity:.3;}
/* INFO BAR */
.info-bar{position:relative;z-index:1;background:rgba(0,61,165,.15);
  border-bottom:1px solid rgba(0,61,165,.3);
  padding:10px 20px;text-align:center;font-size:.78rem;color:rgba(147,197,253,.9);}
.info-bar strong{color:#93c5fd;}
/* FILTER */
.filter-bar{position:sticky;top:0;z-index:100;
  background:rgba(3,9,43,.97);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border-bottom:1px solid rgba(201,168,76,.15);
  padding:10px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
.search-wrap{position:relative;flex:1;min-width:150px;max-width:240px;}
.search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:.75rem;opacity:.45;pointer-events:none;}
.search-wrap input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
  color:var(--text);padding:7px 10px 7px 32px;border-radius:8px;font-size:.8rem;outline:none;transition:border-color .2s;}
.search-wrap input::placeholder{color:var(--muted);}
.search-wrap input:focus{border-color:var(--gold);}
.filter-chips{display:flex;gap:5px;flex-wrap:wrap;}
.fsep{width:1px;height:22px;background:var(--border);flex-shrink:0;align-self:center;}
.chip{border:1px solid rgba(255,255,255,.1);background:transparent;color:var(--muted);
  padding:5px 12px;border-radius:20px;cursor:pointer;font-size:.72rem;font-weight:600;transition:all .17s;white-space:nowrap;}
.chip:hover{border-color:var(--gold);color:var(--gold);}
.chip.active{background:var(--gold);border-color:var(--gold);color:#03092b;}
/* CONTENT */
.content{max-width:960px;margin:0 auto;padding:24px 16px 60px;position:relative;z-index:1;}
/* PONTUAÇÃO BOX */
.info-section{max-width:960px;margin:0 auto 0;padding:20px 16px 0;position:relative;z-index:1;}
.info-box{background:rgba(0,61,165,.1);border:1px solid rgba(0,61,165,.25);border-radius:var(--radius);
  padding:18px 20px;display:grid;grid-template-columns:1fr 1fr;gap:16px;}
@media(max-width:520px){.info-box{grid-template-columns:1fr;}}
.info-title{grid-column:1/-1;font-size:.8rem;font-weight:800;color:#93c5fd;letter-spacing:.07em;text-transform:uppercase;margin-bottom:4px;}
.pts-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05);}
.pts-row:last-child{border-bottom:none;}
.pts-label{font-size:.78rem;color:var(--muted);}
.pts-val{font-size:.85rem;font-weight:800;color:var(--text);}
.pts-val.gold{color:var(--gold2);}
/* DATE GROUP */
.date-group{margin-bottom:32px;}
.game-card.hidden{display:none;}
.date-group.all-hidden{display:none;}
.date-label{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.date-label-icon{font-size:.9rem;}
.date-label-text{font-size:.78rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;white-space:nowrap;}
.date-label-line{flex:1;height:1px;background:linear-gradient(90deg,rgba(201,168,76,.3),transparent);}
.date-label-count{font-size:.7rem;color:var(--muted);white-space:nowrap;}
/* CARDS */
.cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;}
.game-card{background:linear-gradient(145deg,rgba(10,22,64,.9),rgba(6,15,46,.95));
  border:1px solid rgba(255,255,255,.07);border-radius:var(--radius);overflow:hidden;
  transition:transform .2s,box-shadow .2s,border-color .2s;}
.game-card:hover{transform:translateY(-3px);
  box-shadow:0 12px 40px rgba(0,0,0,.5),0 0 0 1px rgba(201,168,76,.2);
  border-color:rgba(201,168,76,.25);}
.card-stripe{height:3px;width:100%;}
.card-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px 8px;}
.card-badges{display:flex;gap:6px;align-items:center;}
.grupo-badge{font-size:.62rem;font-weight:800;padding:3px 9px;border-radius:6px;letter-spacing:.04em;}
.jornada-badge{font-size:.6rem;color:var(--muted);font-weight:600;background:rgba(255,255,255,.05);padding:3px 8px;border-radius:6px;}
.card-codigo{font-size:.6rem;color:rgba(255,255,255,.3);font-weight:700;}
.card-time{font-size:.68rem;color:var(--muted);}
.card-time small{font-size:.55rem;opacity:.6;}
.card-teams{padding:14px 14px 12px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;}
.team{text-align:center;}
.team-flag{font-size:2.6rem;display:block;line-height:1.1;}
.team-name{font-size:.72rem;font-weight:600;color:var(--text);margin-top:5px;line-height:1.25;}
.vs-wrap{text-align:center;}
.vs-text{font-size:.75rem;font-weight:800;color:rgba(255,255,255,.25);display:block;letter-spacing:.05em;}
.pred-box{margin:0 12px 12px;border-radius:10px;padding:11px 14px;
  display:flex;align-items:center;justify-content:space-between;
  border:1px solid rgba(201,168,76,.2);
  background:linear-gradient(135deg,rgba(201,168,76,.08),rgba(201,168,76,.03));
  position:relative;overflow:hidden;}
.pred-box::before{content:"";position:absolute;top:-50%;right:-30%;width:120px;height:120px;border-radius:50%;
  background:radial-gradient(circle,rgba(201,168,76,.08),transparent 70%);pointer-events:none;}
.pred-tag{font-size:.58rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;}
.pred-score{font-size:1.8rem;font-weight:900;
  background:linear-gradient(135deg,var(--gold),var(--gold2));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  line-height:1;letter-spacing:.05em;}
.pred-score.empty{font-size:.82rem;color:var(--muted);font-weight:600;
  -webkit-text-fill-color:var(--muted);background:none;}
.pred-right{text-align:right;}
.pred-city{font-size:.62rem;color:var(--muted);line-height:1.5;max-width:110px;text-align:right;}
.pred-ball{font-size:1.3rem;opacity:.3;margin-bottom:2px;}
/* NO RESULTS */
.no-results{display:none;text-align:center;padding:60px 20px;color:var(--muted);}
.no-results.visible{display:block;}
.no-results-icon{font-size:3rem;margin-bottom:12px;}
/* FOOTER */
.footer{position:relative;z-index:1;text-align:center;padding:24px 20px 32px;
  border-top:1px solid var(--border);color:var(--muted);font-size:.72rem;line-height:1.8;}
.footer strong{color:var(--gold);}
.footer-stars{font-size:1.1rem;margin-bottom:8px;opacity:.6;}
@media(max-width:600px){
  .hero-name{font-size:2rem;}
  .cards-grid{grid-template-columns:1fr;}
  .filter-bar{gap:7px;}
}`;

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>⚽ Previsões de ${nome} · Mundial 2026</title>
<style>${CSS}</style>
</head>
<body>

<div class="hero">
  <div class="hero-inner">
    <div class="wc-badge">⚽ Predictor Parque Biológico · 2026</div>
    <div class="trophy-wrap">🏆</div>
    <div class="hero-event">As minhas previsões · FIFA World Cup 2026™</div>
    <div class="hero-name">${nome}</div>
    <div class="hero-doc">Documento pessoal e confidencial</div>
    <div class="hero-divider"><span>⚽</span></div>
    <div class="hero-stats">
      <div class="stat-pill"><span class="stat-pill-val">${totalPreds}</span><span class="stat-pill-lbl">Previsões</span></div>
      <div class="stat-pill"><span class="stat-pill-val">72</span><span class="stat-pill-lbl">Jogos</span></div>
      <div class="stat-pill"><span class="stat-pill-val">3</span><span class="stat-pill-lbl">Jornadas</span></div>
      <div class="stat-pill"><span class="stat-pill-val">12</span><span class="stat-pill-lbl">Grupos</span></div>
    </div>
    <div class="hosts">
      <span class="host-flag">🇺🇸</span><span>Estados Unidos</span>
      <span class="host-sep">·</span>
      <span class="host-flag">🇨🇦</span><span>Canadá</span>
      <span class="host-sep">·</span>
      <span class="host-flag">🇲🇽</span><span>México</span>
      <span class="host-sep">·</span>
      <span>11 Jun – 19 Jul 2026</span>
    </div>
  </div>
</div>

<div class="info-bar">
  ℹ️ Este ficheiro contém <strong>exclusivamente as tuas previsões</strong>.
  A classificação é revelada <strong>no jantar</strong>. 🍽️🤫
</div>

<div class="filter-bar">
  <div class="search-wrap">
    <span class="search-icon">🔍</span>
    <input type="text" id="searchInput" placeholder="Pesquisar equipa…" oninput="applyFilters()">
  </div>
  <div class="fsep"></div>
  <div class="filter-chips">
    <button class="chip active" data-f="all"  onclick="setFilter('all')">Todos</button>
    <button class="chip"        data-f="j1"   onclick="setFilter('j1')">Jornada 1</button>
    <button class="chip"        data-f="j2"   onclick="setFilter('j2')">Jornada 2</button>
    <button class="chip"        data-f="j3"   onclick="setFilter('j3')">Jornada 3</button>
    <div class="fsep"></div>
    ${grupos.map(g => `<button class="chip" data-f="g${g}" onclick="setFilter('g${g}')">Gr.${g}</button>`).join("")}
  </div>
</div>

<div class="info-section">
  <div class="info-box">
    <div class="info-title">🎯 Como funciona a pontuação — Fase de Grupos</div>
    <div>
      <div class="pts-row"><span class="pts-label">✅ Resultado exato</span><span class="pts-val gold">5 pts</span></div>
      <div class="pts-row"><span class="pts-label">🔵 Vencedor / Empate</span><span class="pts-val">2 pts</span></div>
      <div class="pts-row"><span class="pts-label">🟡 Golos de uma equipa</span><span class="pts-val">1 pt</span></div>
      <div class="pts-row"><span class="pts-label">❌ Não pontuou</span><span class="pts-val" style="color:var(--muted)">0 pts</span></div>
    </div>
    <div>
      <div class="pts-row"><span class="pts-label">⚠️ Pontos não acumulam</span><span class="pts-val" style="font-size:.72rem;color:var(--muted)">Melhor categoria</span></div>
      <div class="pts-row"><span class="pts-label">🍽️ Top 5</span><span class="pts-val" style="font-size:.72rem;color:var(--muted)">Jantam de graça</span></div>
      <div class="pts-row"><span class="pts-label">💸 Bottom 5</span><span class="pts-val" style="font-size:.72rem;color:var(--muted)">Pagam o jantar</span></div>
    </div>
  </div>
</div>

<div class="content">
  <div class="no-results" id="noResults">
    <div class="no-results-icon">🔎</div>
    <div>Nenhuma previsão encontrada</div>
  </div>
${gamesHTML}
</div>

<div class="footer">
  <div class="footer-stars">⭐ ⚽ 🏆 ⚽ ⭐</div>
  <strong>Predictor Parque Biológico — Mundial 2026</strong><br>
  Documento pessoal de <strong>${nome}</strong><br>
  Gerado em ${today} · Confidencial · Não partilhar
</div>

<script>
/* Filtros — o conteúdo já está no HTML, JS apenas mostra/esconde */
let activeFilter = "all";

function setFilter(f) {
  activeFilter = f;
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.f === f));
  applyFilters();
}

function applyFilters() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  let anyVisible = false;

  document.querySelectorAll(".game-card").forEach(card => {
    const grupo   = card.dataset.grupo;
    const jornada = card.dataset.jornada;
    const search  = card.dataset.search || "";

    let show = true;
    if (q && !search.includes(q)) show = false;
    if (activeFilter === "j1" && jornada !== "1") show = false;
    if (activeFilter === "j2" && jornada !== "2") show = false;
    if (activeFilter === "j3" && jornada !== "3") show = false;
    if (activeFilter.startsWith("g") && grupo !== activeFilter.slice(1)) show = false;

    card.classList.toggle("hidden", !show);
    if (show) anyVisible = true;
  });

  // Esconder grupos de data que ficaram todos vazios
  document.querySelectorAll(".date-group").forEach(dg => {
    const hasVisible = [...dg.querySelectorAll(".game-card")].some(c => !c.classList.contains("hidden"));
    dg.classList.toggle("all-hidden", !hasVisible);
  });

  document.getElementById("noResults").classList.toggle("visible", !anyVisible);
}
</script>
</body>
</html>`;
}

// ─── Output ───────────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, "previsoes_jogadores");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
fs.readdirSync(outDir).filter(f => f.endsWith(".html")).forEach(f => fs.unlinkSync(path.join(outDir, f)));

DADOS.participantes.forEach((nome, pi) => {
  const safe = nome.normalize("NFD").replace(/\p{Diacritic}/gu,"").replace(/\s+/g,"_").replace(/[^a-zA-Z0-9_]/g,"");
  const file = path.join(outDir, `Previsoes_${safe}.html`);
  fs.writeFileSync(file, buildHTML(nome, pi), "utf8");
  const kb   = (fs.statSync(file).size / 1024).toFixed(1);
  const np   = Object.keys(DADOS.prognosticos[nome] || {}).length;
  // Verificar que as previsões estão mesmo no HTML como texto estático
  const html = fs.readFileSync(file, "utf8");
  const hasPreds = html.includes("pred-score") && !html.includes("render(JOGOS)");
  console.log(`${hasPreds ? "✅" : "❌"}  Previsoes_${safe}.html  (${kb}KB · ${np}/72 previsões · HTML estático: ${hasPreds ? "SIM" : "NÃO"})`);
});

console.log(`\n📁  previsoes_jogadores/`);
console.log(`🎉  ${DADOS.participantes.length} ficheiros prontos — HTML 100% estático!`);
