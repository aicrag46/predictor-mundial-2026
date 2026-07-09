# Curiosidades + Modo Jantar com Suspense — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Curiosidades" tab with 20 fun, auto-updating stats/awards computed from existing data, and rewrite the Modo Jantar presentation to reveal positions worst→best with the paga/não-paga boundary saved as the final climax.

**Architecture:** A new pure, Node-testable calculation module (`js/curiosidades.js`, same pattern as `js/scoring.js`) computes all awards and the presentation reveal order from plain data structures. `js/app.js` gathers real app state into that shape (`buildCuriosidadesInput`) and renders the new tab. `js/features.js` reuses the same award data to rebuild the Modo Jantar slide sequence.

**Tech Stack:** Vanilla JS (no build step, no framework), hand-rolled test runner (`node tests/*.test.js`), existing CSS custom properties in `css/style.css`.

## Global Constraints

- No new persisted data — everything derives from `resultados`, `gsOv`, `mm`, `koP`, and the existing `CLASS_HISTORY` snapshots (spec: "Arquitetura").
- `js/curiosidades.js` must be requireable from Node (same `if (typeof module !== "undefined") module.exports = {...}` pattern as `js/scoring.js`) so it can be unit tested the same way as `tests/scoring.test.js`.
- Every award function returns objects shaped `{ id, icon, titulo, vencedor, valor, detalhe }` (`vencedor: null` means "por decidir").
- Reuse `getTipo`/`calcKO` from `js/scoring.js` for any scoring-type computation — never re-implement scoring rules.
- Spec source of truth: `docs/superpowers/specs/2026-07-09-curiosidades-modo-jantar-design.md`.

---

## Task 1: Bootstrap `js/curiosidades.js` + test harness + Sniper / Coração de Pedra

**Files:**
- Create: `js/curiosidades.js`
- Create: `tests/curiosidades.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `maxBy(arr, fn)`, `minBy(arr, fn)` (internal helpers, exported for testing), `calcSniperECoracaoDePedra(participantStats)` where `participantStats` is `Array<{ nome: string, exatos: number, naoPontua: number, gsPts: number, koPts: number, ve: number, golos: number }>`. Returns `Array<{ id, icon, titulo, vencedor, valor, detalhe }>` (2 entries).

- [ ] **Step 1: Write the failing test**

Create `tests/curiosidades.test.js`:

```js
const { maxBy, minBy, calcSniperECoracaoDePedra } = require("../js/curiosidades.js");

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log("  ✅", msg); }
  else { failed++; console.error("  ❌", msg); }
}

console.log("Curiosidades — helpers");
ok(maxBy([{ n: 1 }, { n: 3 }, { n: 2 }], x => x.n).n === 3, "maxBy encontra o maior");
ok(minBy([{ n: 1 }, { n: 3 }, { n: 2 }], x => x.n).n === 1, "minBy encontra o menor");
ok(maxBy([], x => x.n) === null, "maxBy devolve null em array vazio");

console.log("Curiosidades — Sniper / Coração de Pedra");
const stats1 = [
  { nome: "Ana", exatos: 5, naoPontua: 2, gsPts: 10, koPts: 0, ve: 1, golos: 1 },
  { nome: "Bruno", exatos: 8, naoPontua: 6, gsPts: 15, koPts: 0, ve: 1, golos: 1 },
];
const [sniper, coracao] = calcSniperECoracaoDePedra(stats1);
ok(sniper.id === "sniper" && sniper.vencedor === "Bruno" && sniper.valor === "8 exatos", "Sniper = mais exatos");
ok(coracao.id === "coracao-de-pedra" && coracao.vencedor === "Bruno" && coracao.valor === "6 sem pontos", "Coração de Pedra = mais Não Pontuou");
const [sniperVazio, coracaoVazio] = calcSniperECoracaoDePedra([]);
ok(sniperVazio.vencedor === null && coracaoVazio.vencedor === null, "lista vazia devolve 2 prémios por decidir");

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/curiosidades.test.js`
Expected: `Error: Cannot find module '../js/curiosidades.js'`

- [ ] **Step 3: Write minimal implementation**

Create `js/curiosidades.js`:

```js
// ─── CURIOSIDADES (estatísticas divertidas — partilhado app + testes) ────────
// Ver docs/superpowers/specs/2026-07-09-curiosidades-modo-jantar-design.md

function maxBy(arr, fn) {
  if (!arr.length) return null;
  return arr.reduce((best, cur) => (fn(cur) > fn(best) ? cur : best), arr[0]);
}
function minBy(arr, fn) {
  if (!arr.length) return null;
  return arr.reduce((best, cur) => (fn(cur) < fn(best) ? cur : best), arr[0]);
}

// 1-2: Sniper / Coração de Pedra
function calcSniperECoracaoDePedra(participantStats) {
  if (!participantStats.length) {
    return [
      { id: "sniper", icon: "🎯", titulo: "Sniper", vencedor: null, valor: "—", detalhe: "Mais resultados exatos (grupos + mata-mata)" },
      { id: "coracao-de-pedra", icon: "🥶", titulo: "Coração de Pedra", vencedor: null, valor: "—", detalhe: "Mais prognósticos sem qualquer ponto" },
    ];
  }
  const sniper = maxBy(participantStats, p => p.exatos);
  const coracao = maxBy(participantStats, p => p.naoPontua);
  return [
    { id: "sniper", icon: "🎯", titulo: "Sniper", vencedor: sniper.nome, valor: `${sniper.exatos} exatos`, detalhe: "Mais resultados exatos (grupos + mata-mata)" },
    { id: "coracao-de-pedra", icon: "🥶", titulo: "Coração de Pedra", vencedor: coracao.nome, valor: `${coracao.naoPontua} sem pontos`, detalhe: "Mais prognósticos sem qualquer ponto" },
  ];
}

if (typeof module !== "undefined") {
  module.exports = { maxBy, minBy, calcSniperECoracaoDePedra };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/curiosidades.test.js`
Expected: `6 passed, 0 failed`

- [ ] **Step 5: Wire into `npm test`**

In `package.json`, change:
```json
"test": "node tests/scoring.test.js"
```
to:
```json
"test": "node tests/scoring.test.js && node tests/curiosidades.test.js"
```

- [ ] **Step 6: Run full suite and commit**

Run: `npm test`
Expected: both test files run, `12 passed, 0 failed` then `6 passed, 0 failed`.

```bash
git add js/curiosidades.js tests/curiosidades.test.js package.json
git commit -m "Bootstrap js/curiosidades.js com prémios Sniper e Coração de Pedra"
```

---

## Task 2: Especialista de Grupos / Rei do Mata-Mata

**Files:**
- Modify: `js/curiosidades.js`
- Modify: `tests/curiosidades.test.js`

**Interfaces:**
- Consumes: `maxBy` (Task 1).
- Produces: `calcEspecialistas(participantStats)` → `Array<{ id, icon, titulo, vencedor, valor, detalhe }>` (2 entries; `vencedor: null` when nobody has `koPts > 0` yet).

- [ ] **Step 1: Write the failing test**

Insert into `tests/curiosidades.test.js`, right before the final `console.log("\n" + passed ...` line:

```js
console.log("Curiosidades — Especialista de Grupos / Rei do Mata-Mata");
const stats2 = [
  { nome: "Ana", exatos: 0, naoPontua: 0, gsPts: 40, koPts: 10, ve: 0, golos: 0 },
  { nome: "Bruno", exatos: 0, naoPontua: 0, gsPts: 20, koPts: 30, ve: 0, golos: 0 },
];
const [especialista, rei] = calcEspecialistas(stats2);
ok(especialista.vencedor === "Ana", "Especialista de Grupos = maior fatia gsPts");
ok(rei.vencedor === "Bruno", "Rei do Mata-Mata = maior fatia koPts");
const semKO = [{ nome: "Ana", exatos: 0, naoPontua: 0, gsPts: 40, koPts: 0, ve: 0, golos: 0 }];
const [especialistaPend, reiPend] = calcEspecialistas(semKO);
ok(especialistaPend.vencedor === null && reiPend.vencedor === null, "sem koPts > 0 fica por decidir");
```

Update the `require` line at the top of the file to also pull `calcEspecialistas`:
```js
const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas } = require("../js/curiosidades.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/curiosidades.test.js`
Expected: `TypeError: calcEspecialistas is not a function`

- [ ] **Step 3: Write minimal implementation**

Insert into `js/curiosidades.js`, right after `calcSniperECoracaoDePedra` and before the `if (typeof module !== "undefined")` line:

```js
// 3-4: Especialista de Grupos / Rei do Mata-Mata
function calcEspecialistas(participantStats) {
  const comKO = participantStats.filter(p => p.koPts > 0);
  if (!comKO.length) {
    return [
      { id: "especialista-grupos", icon: "📚", titulo: "Especialista de Grupos", vencedor: null, valor: "—", detalhe: "Por decidir — ainda sem pontos no mata-mata" },
      { id: "rei-mata-mata", icon: "🗡️", titulo: "Rei do Mata-Mata", vencedor: null, valor: "—", detalhe: "Por decidir — ainda sem pontos no mata-mata" },
    ];
  }
  const comRacio = comKO.map(p => ({ ...p, gsShare: p.gsPts / (p.gsPts + p.koPts), koShare: p.koPts / (p.gsPts + p.koPts) }));
  const especialista = maxBy(comRacio, p => p.gsShare);
  const rei = maxBy(comRacio, p => p.koShare);
  return [
    { id: "especialista-grupos", icon: "📚", titulo: "Especialista de Grupos", vencedor: especialista.nome, valor: `${Math.round(especialista.gsShare * 100)}% dos pontos`, detalhe: "Maior fatia dos pontos vem da fase de grupos" },
    { id: "rei-mata-mata", icon: "🗡️", titulo: "Rei do Mata-Mata", vencedor: rei.nome, valor: `${Math.round(rei.koShare * 100)}% dos pontos`, detalhe: "Maior fatia dos pontos vem do mata-mata" },
  ];
}
```

Update the `module.exports` line to:
```js
module.exports = { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/curiosidades.test.js`
Expected: `9 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add js/curiosidades.js tests/curiosidades.test.js
git commit -m "Adicionar prémios Especialista de Grupos e Rei do Mata-Mata"
```

---

## Task 3: Sequências (Sequência Imparável / Seca)

**Files:**
- Modify: `js/curiosidades.js`
- Modify: `tests/curiosidades.test.js`

**Interfaces:**
- Consumes: `maxBy` (Task 1); `getTipo`, `calcKO` from `js/scoring.js`.
- Produces: `calcSequencias(jogosGrupos, previsoesGrupos, jogosMataMata, previsoesMataMata)`.
  - `jogosGrupos: Array<{ codigo: string, gc: number|null, gf: number|null }>`
  - `previsoesGrupos: Array<{ nome: string, preds: { [codigo]: { gc: number, gf: number } } }>`
  - `jogosMataMata: Array<{ key: string, roundId: string, gc: number|null, gf: number|null, winner: string|null }>`
  - `previsoesMataMata: Array<{ nome: string, preds: { [key]: { gc: number, gf: number, qualifier: string|null } } }>`
  - Returns 2 entries (`vencedor: null` when best streak is 0).

- [ ] **Step 1: Write the failing test**

Insert into `tests/curiosidades.test.js` before the final summary line:

```js
console.log("Curiosidades — Sequências");
const jogosGrupos3 = [
  { codigo: "A1", gc: 2, gf: 0 }, { codigo: "A2", gc: 1, gf: 1 },
  { codigo: "A3", gc: 0, gf: 3 }, { codigo: "A4", gc: 2, gf: 2 },
];
const previsoesGrupos3 = [
  { nome: "Ana", preds: {
    A1: { gc: 2, gf: 0 }, // Exato -> pontua
    A2: { gc: 1, gf: 1 }, // Exato -> pontua
    A3: { gc: 1, gf: 0 }, // Não Pontuou
    A4: { gc: 2, gf: 2 }, // Exato -> pontua
  } },
];
const jogosMataMata3 = [{ key: "r32:0", roundId: "r32", gc: null, gf: null, winner: null }];
const previsoesMataMata3 = [{ nome: "Ana", preds: {} }];
const [imparavel, seca] = calcSequencias(jogosGrupos3, previsoesGrupos3, jogosMataMata3, previsoesMataMata3);
ok(imparavel.vencedor === "Ana" && imparavel.valor === "2 jogos seguidos", "Sequência Imparável ignora jogo pendente e para na falha");
ok(seca.vencedor === "Ana" && seca.valor === "1 jogos seguidos", "Seca conta o único jogo sem pontos");
ok(calcSequencias([], [], [], []).length === 2, "sem jogos devolve 2 prémios (vencedor null)");
```

Update the `require` line:
```js
const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias } = require("../js/curiosidades.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/curiosidades.test.js`
Expected: `TypeError: calcSequencias is not a function`

- [ ] **Step 3: Write minimal implementation**

At the very top of `js/curiosidades.js` (before `function maxBy`), add the scoring.js interop:

```js
// Em Node importamos getTipo/calcKO de js/scoring.js. No browser, scoring.js
// já os define como globais (carrega antes deste ficheiro) — usamos esse
// objeto diretamente para nunca sombrear os globais do browser.
const _S = typeof module !== "undefined" ? require("./scoring.js") : { getTipo, calcKO };
```

Insert into `js/curiosidades.js`, right after `calcEspecialistas` and before `if (typeof module !== "undefined")`:

```js
// 5-6: Sequência Imparável / Seca
function calcSequencias(jogosGrupos, previsoesGrupos, jogosMataMata, previsoesMataMata) {
  const previsoesGruposPorNome = {};
  previsoesGrupos.forEach(p => { previsoesGruposPorNome[p.nome] = p.preds; });
  const previsoesMataMataPorNome = {};
  previsoesMataMata.forEach(p => { previsoesMataMataPorNome[p.nome] = p.preds; });

  const nomes = previsoesGrupos.map(p => p.nome);

  function maiorSequencia(bools, alvo) {
    let melhor = 0, atual = 0;
    for (const v of bools) {
      if (v === alvo) { atual++; melhor = Math.max(melhor, atual); }
      else atual = 0;
    }
    return melhor;
  }

  const comSequencias = nomes.map(nome => {
    const bools = [];
    const predsGrupos = previsoesGruposPorNome[nome] || {};
    jogosGrupos.forEach(j => {
      if (j.gc === null || j.gc === undefined) return;
      const pred = predsGrupos[j.codigo];
      if (!pred) return;
      const tipo = _S.getTipo(pred.gc, pred.gf, j.gc, j.gf);
      bools.push(tipo !== "Não Pontuou");
    });
    const predsKO = previsoesMataMataPorNome[nome] || {};
    jogosMataMata.forEach(j => {
      if (j.gc === null || j.gc === undefined) return;
      const pred = predsKO[j.key];
      if (!pred || pred.gc === null || pred.gc === undefined) return;
      const ko = _S.calcKO(j.roundId, pred.gc, pred.gf, pred.qualifier, j.gc, j.gf, j.winner);
      bools.push(ko.pts > 0);
    });
    return { nome, imparavel: maiorSequencia(bools, true), seca: maiorSequencia(bools, false) };
  });

  if (!comSequencias.length) {
    return [
      { id: "sequencia-imparavel", icon: "🔥", titulo: "Sequência Imparável", vencedor: null, valor: "0 jogos seguidos", detalhe: "Mais jogos seguidos a pontuar" },
      { id: "seca", icon: "🧊", titulo: "Seca", vencedor: null, valor: "0 jogos seguidos", detalhe: "Mais jogos seguidos sem pontuar" },
    ];
  }
  const imparavel = maxBy(comSequencias, p => p.imparavel);
  const seca = maxBy(comSequencias, p => p.seca);
  return [
    { id: "sequencia-imparavel", icon: "🔥", titulo: "Sequência Imparável", vencedor: imparavel.imparavel > 0 ? imparavel.nome : null, valor: `${imparavel.imparavel} jogos seguidos`, detalhe: "Mais jogos seguidos a pontuar" },
    { id: "seca", icon: "🧊", titulo: "Seca", vencedor: seca.seca > 0 ? seca.nome : null, valor: `${seca.seca} jogos seguidos`, detalhe: "Mais jogos seguidos sem pontuar" },
  ];
}
```

Update `module.exports`:
```js
module.exports = { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/curiosidades.test.js`
Expected: `12 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add js/curiosidades.js tests/curiosidades.test.js
git commit -m "Adicionar prémios Sequência Imparável e Seca"
```

---

## Task 4: Total de Exatos da Competição / Distribuição da Malta

**Files:**
- Modify: `js/curiosidades.js`
- Modify: `tests/curiosidades.test.js`

**Interfaces:**
- Produces: `calcTotalExatos(participantStats, nJogosComResultado)` → 1 entry. `calcDistribuicaoMalta(participantStats)` → 1 entry.

- [ ] **Step 1: Write the failing test**

Insert before the final summary line:

```js
console.log("Curiosidades — Total de Exatos / Distribuição da Malta");
const stats4 = [
  { nome: "Ana", exatos: 3, ve: 2, golos: 1, naoPontua: 4, gsPts: 0, koPts: 0 },
  { nome: "Bruno", exatos: 5, ve: 1, golos: 0, naoPontua: 4, gsPts: 0, koPts: 0 },
];
const totalExatos = calcTotalExatos(stats4, 10);
ok(totalExatos.valor === "8 exatos", "Total de Exatos soma todos os participantes");
ok(totalExatos.detalhe.includes("40%"), "% sobre oportunidades (8 / (10*2) = 40%)");
const distribuicao = calcDistribuicaoMalta(stats4);
ok(distribuicao.valor === "8 Exato · 3 VE · 1 Golos · 8 Nada", "Distribuição soma cada categoria");
```

Update the `require` line:
```js
const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta } = require("../js/curiosidades.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/curiosidades.test.js`
Expected: `TypeError: calcTotalExatos is not a function`

- [ ] **Step 3: Write minimal implementation**

Insert into `js/curiosidades.js`, after `calcSequencias` and before `if (typeof module !== "undefined")`:

```js
// 7: Total de Exatos da competição
function calcTotalExatos(participantStats, nJogosComResultado) {
  const total = participantStats.reduce((sum, p) => sum + p.exatos, 0);
  const oportunidades = nJogosComResultado * participantStats.length;
  const pct = oportunidades > 0 ? Math.round((total / oportunidades) * 1000) / 10 : 0;
  return {
    id: "total-exatos", icon: "⚡", titulo: "Total de Exatos da Competição", vencedor: null,
    valor: `${total} exatos`,
    detalhe: oportunidades > 0 ? `${pct}% de acerto exato em ${oportunidades} oportunidades` : "Ainda sem jogos com resultado",
  };
}

// 8: Distribuição da malta
function calcDistribuicaoMalta(participantStats) {
  const totais = participantStats.reduce((acc, p) => {
    acc.exatos += p.exatos; acc.ve += p.ve; acc.golos += p.golos; acc.naoPontua += p.naoPontua;
    return acc;
  }, { exatos: 0, ve: 0, golos: 0, naoPontua: 0 });
  const soma = totais.exatos + totais.ve + totais.golos + totais.naoPontua;
  const pct = n => (soma > 0 ? Math.round((n / soma) * 1000) / 10 : 0);
  return {
    id: "distribuicao-malta", icon: "🌍", titulo: "Distribuição da Malta", vencedor: null,
    valor: `${totais.exatos} Exato · ${totais.ve} VE · ${totais.golos} Golos · ${totais.naoPontua} Nada`,
    detalhe: `${pct(totais.exatos)}% Exato · ${pct(totais.ve)}% VE · ${pct(totais.golos)}% Golos · ${pct(totais.naoPontua)}% Nada`,
  };
}
```

Update `module.exports`:
```js
module.exports = { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/curiosidades.test.js`
Expected: `15 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add js/curiosidades.js tests/curiosidades.test.js
git commit -m "Adicionar prémios Total de Exatos e Distribuição da Malta"
```

---

## Task 5: Tendências (Maior Subida / Maior Queda / Montanha-Russa)

**Files:**
- Modify: `js/curiosidades.js`
- Modify: `tests/curiosidades.test.js`

**Interfaces:**
- Consumes: `maxBy`, `minBy` (Task 1).
- Produces: `calcTendencias(classHistory)` → 3 entries, where `classHistory: Array<{ ts: number, ranking: Array<{ nome: string, pts: number, pos: number }> }>`.

- [ ] **Step 1: Write the failing test**

Insert before the final summary line:

```js
console.log("Curiosidades — Tendências");
const hist5 = [
  { ts: 1, ranking: [{ nome: "Ana", pts: 5, pos: 3 }, { nome: "Bruno", pts: 10, pos: 1 }] },
  { ts: 2, ranking: [{ nome: "Ana", pts: 20, pos: 1 }, { nome: "Bruno", pts: 10, pos: 3 }] },
];
const [subida, queda, montanha] = calcTendencias(hist5);
ok(subida.vencedor === "Ana" && subida.valor === "2 posições", "Maior Subida: Ana foi de 3º a 1º");
ok(queda.vencedor === "Bruno" && queda.valor === "2 posições", "Maior Queda: Bruno foi de 1º a 3º");
ok(montanha.vencedor === "Ana" || montanha.vencedor === "Bruno", "Montanha-Russa escolhe alguém com histórico");
const semHistorico = calcTendencias([]);
ok(semHistorico.every(a => a.vencedor === null), "sem histórico fica tudo por decidir");
const umSnapshot = calcTendencias([{ ts: 1, ranking: [{ nome: "Ana", pts: 5, pos: 1 }] }]);
ok(umSnapshot.every(a => a.vencedor === null), "com 1 snapshot só, fica por decidir");
```

Update the `require` line:
```js
const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias } = require("../js/curiosidades.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/curiosidades.test.js`
Expected: `TypeError: calcTendencias is not a function`

- [ ] **Step 3: Write minimal implementation**

Insert into `js/curiosidades.js`, after `calcDistribuicaoMalta` and before `if (typeof module !== "undefined")`:

```js
// 9-10: Maior Subida / Maior Queda / Montanha-Russa
function calcTendencias(classHistory) {
  if (classHistory.length < 2) {
    return [
      { id: "maior-subida", icon: "📈", titulo: "Maior Subida", vencedor: null, valor: "—", detalhe: "Por decidir — falta histórico" },
      { id: "maior-queda", icon: "📉", titulo: "Maior Queda", vencedor: null, valor: "—", detalhe: "Por decidir — falta histórico" },
      { id: "montanha-russa", icon: "🎢", titulo: "Montanha-Russa", vencedor: null, valor: "—", detalhe: "Por decidir — falta histórico" },
    ];
  }
  const primeiro = classHistory[0].ranking;
  const ultimo = classHistory[classHistory.length - 1].ranking;
  const posPrimeiro = {};
  primeiro.forEach(r => { posPrimeiro[r.nome] = r.pos; });
  const deltas = ultimo.map(r => ({ nome: r.nome, delta: (posPrimeiro[r.nome] ?? r.pos) - r.pos }));
  const subida = maxBy(deltas, d => d.delta);
  const queda = minBy(deltas, d => d.delta);

  const posPorNome = {};
  classHistory.forEach(snap => {
    snap.ranking.forEach(r => {
      if (!posPorNome[r.nome]) posPorNome[r.nome] = [];
      posPorNome[r.nome].push(r.pos);
    });
  });
  function desvioPadrao(nums) {
    const media = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variancia = nums.reduce((a, b) => a + (b - media) ** 2, 0) / nums.length;
    return Math.sqrt(variancia);
  }
  const comDesvio = Object.entries(posPorNome)
    .filter(([, posicoes]) => posicoes.length >= 2)
    .map(([nome, posicoes]) => ({ nome, desvio: desvioPadrao(posicoes) }));
  const montanhaRussa = comDesvio.length ? maxBy(comDesvio, p => p.desvio) : null;

  return [
    { id: "maior-subida", icon: "📈", titulo: "Maior Subida", vencedor: subida.delta > 0 ? subida.nome : null, valor: `${Math.max(subida.delta, 0)} posições`, detalhe: "Desde o primeiro registo até agora" },
    { id: "maior-queda", icon: "📉", titulo: "Maior Queda", vencedor: queda.delta < 0 ? queda.nome : null, valor: `${Math.max(-queda.delta, 0)} posições`, detalhe: "Desde o primeiro registo até agora" },
    { id: "montanha-russa", icon: "🎢", titulo: "Montanha-Russa", vencedor: montanhaRussa ? montanhaRussa.nome : null, valor: montanhaRussa ? `desvio de ${montanhaRussa.desvio.toFixed(1)}` : "—", detalhe: "Posição mais instável ao longo do tempo" },
  ];
}
```

Update `module.exports`:
```js
module.exports = { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/curiosidades.test.js`
Expected: `20 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add js/curiosidades.js tests/curiosidades.test.js
git commit -m "Adicionar prémios de tendência (Subida, Queda, Montanha-Russa)"
```

---

## Task 6: Estilo de Apostador (Kamikaze / Betão Armado / Fã de Empates / Nunca Sofre)

**Files:**
- Modify: `js/curiosidades.js`
- Modify: `tests/curiosidades.test.js`

**Interfaces:**
- Consumes: `maxBy`, `minBy` (Task 1).
- Produces: `calcEstiloApostador(jogosGrupos, previsoesGrupos)` → 4 entries. `jogosGrupos`/`previsoesGrupos` same shape as Task 3.

- [ ] **Step 1: Write the failing test**

Insert before the final summary line:

```js
console.log("Curiosidades — Estilo de Apostador");
const jogosGrupos6 = [{ codigo: "A1", gc: 0, gf: 0 }, { codigo: "A2", gc: 1, gf: 2 }];
const previsoesGrupos6 = [
  { nome: "Ana", preds: { A1: { gc: 3, gf: 2 }, A2: { gc: 2, gf: 2 } } },   // média 4.5, 1 empate previsto, 0 "nunca sofre"
  { nome: "Bruno", preds: { A1: { gc: 0, gf: 0 }, A2: { gc: 1, gf: 0 } } }, // média 0.5, 1 empate previsto, acerta A1 (0-0 -> ambos 0 golos sofridos)
];
const [kamikaze, betao, faDeEmpates, nuncaSofre] = calcEstiloApostador(jogosGrupos6, previsoesGrupos6);
ok(kamikaze.vencedor === "Ana", "Kamikaze = maior média de golos previstos");
ok(betao.vencedor === "Bruno", "Betão Armado = menor média de golos previstos");
ok(faDeEmpates.vencedor === "Ana" || faDeEmpates.vencedor === "Bruno", "Fã de Empates escolhe quem previu mais empates (empate técnico aqui, 1 cada)");
ok(nuncaSofre.vencedor === "Bruno" && nuncaSofre.valor === "2 vezes", "Nunca Sofre: Bruno acerta 0-0 em A1 (2 golos sofridos corretos)");
ok(calcEstiloApostador([], []).length === 0, "sem previsões devolve array vazio");
```

Update the `require` line:
```js
const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador } = require("../js/curiosidades.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/curiosidades.test.js`
Expected: `TypeError: calcEstiloApostador is not a function`

- [ ] **Step 3: Write minimal implementation**

Insert into `js/curiosidades.js`, after `calcTendencias` and before `if (typeof module !== "undefined")`:

```js
// 11-14: Kamikaze / Betão Armado / Fã de Empates / Nunca Sofre
function calcEstiloApostador(jogosGrupos, previsoesGrupos) {
  if (!previsoesGrupos.length) return [];
  const porParticipante = previsoesGrupos.map(p => {
    const preds = Object.values(p.preds);
    const totalGolos = preds.reduce((s, pr) => s + pr.gc + pr.gf, 0);
    const mediaGolos = preds.length ? totalGolos / preds.length : 0;
    const empates = preds.filter(pr => pr.gc === pr.gf).length;
    let nuncaSofreCount = 0;
    jogosGrupos.forEach(j => {
      if (j.gc === null || j.gc === undefined) return;
      const pred = p.preds[j.codigo];
      if (!pred) return;
      if (pred.gc === 0 && j.gc === 0) nuncaSofreCount++;
      if (pred.gf === 0 && j.gf === 0) nuncaSofreCount++;
    });
    return { nome: p.nome, mediaGolos, empates, nuncaSofreCount, nPreds: preds.length };
  }).filter(p => p.nPreds > 0);

  if (!porParticipante.length) return [];
  const kamikaze = maxBy(porParticipante, p => p.mediaGolos);
  const betao = minBy(porParticipante, p => p.mediaGolos);
  const faDeEmpates = maxBy(porParticipante, p => p.empates);
  const nuncaSofre = maxBy(porParticipante, p => p.nuncaSofreCount);

  return [
    { id: "kamikaze", icon: "🎰", titulo: "Kamikaze", vencedor: kamikaze.nome, valor: `${kamikaze.mediaGolos.toFixed(1)} golos/jogo`, detalhe: "Maior média de golos previstos por jogo" },
    { id: "betao-armado", icon: "🛡️", titulo: "Betão Armado", vencedor: betao.nome, valor: `${betao.mediaGolos.toFixed(1)} golos/jogo`, detalhe: "Menor média de golos previstos por jogo" },
    { id: "fa-de-empates", icon: "⚖️", titulo: "Fã de Empates", vencedor: faDeEmpates.empates > 0 ? faDeEmpates.nome : null, valor: `${faDeEmpates.empates} empates previstos`, detalhe: "Mais prognósticos de empate" },
    { id: "nunca-sofre", icon: "🥅", titulo: "Nunca Sofre", vencedor: nuncaSofre.nuncaSofreCount > 0 ? nuncaSofre.nome : null, valor: `${nuncaSofre.nuncaSofreCount} vezes`, detalhe: "Mais vezes a acertar uma equipa a sofrer 0 golos" },
  ];
}
```

Update `module.exports`:
```js
module.exports = { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/curiosidades.test.js`
Expected: `25 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add js/curiosidades.js tests/curiosidades.test.js
git commit -m "Adicionar prémios de estilo de apostador (Kamikaze, Betão Armado, Fã de Empates, Nunca Sofre)"
```

---

## Task 7: Bola de Cristal / Zica

**Files:**
- Modify: `js/curiosidades.js`
- Modify: `tests/curiosidades.test.js`

**Interfaces:**
- Consumes: `maxBy`, `minBy` (Task 1).
- Produces: `calcBolaDeCristal(jogosMataMata, previsoesMataMata)` → 2 entries. Same shapes as Task 3's KO params.

- [ ] **Step 1: Write the failing test**

Insert before the final summary line:

```js
console.log("Curiosidades — Bola de Cristal / Zica");
const jogosMM7 = [
  { key: "r16:0", winner: "Portugal" }, { key: "r16:1", winner: "França" },
  { key: "r16:2", winner: "Brasil" }, { key: "r16:3", winner: null },
];
const previsoesMM7 = [
  { nome: "Ana", preds: {
    "r16:0": { qualifier: "Portugal" }, "r16:1": { qualifier: "França" }, "r16:2": { qualifier: "Argentina" },
  } },
  { nome: "Bruno", preds: {
    "r16:0": { qualifier: "Espanha" }, "r16:1": { qualifier: "Bélgica" }, "r16:2": { qualifier: "Croácia" },
  } },
];
const [bola, zica] = calcBolaDeCristal(jogosMM7, previsoesMM7);
ok(bola.vencedor === "Ana" && bola.valor === "67% (2/3)", "Bola de Cristal = melhor taxa de acerto no Apurado");
ok(zica.vencedor === "Bruno" && zica.valor === "0% (0/3)", "Zica = pior taxa de acerto no Apurado");
const poucoDecidido = calcBolaDeCristal([{ key: "r16:0", winner: "Portugal" }], [{ nome: "Ana", preds: { "r16:0": { qualifier: "Portugal" } } }]);
ok(poucoDecidido.every(a => a.vencedor === null), "menos de 3 jogos decididos fica por decidir");
```

Update the `require` line:
```js
const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador, calcBolaDeCristal } = require("../js/curiosidades.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/curiosidades.test.js`
Expected: `TypeError: calcBolaDeCristal is not a function`

- [ ] **Step 3: Write minimal implementation**

Insert into `js/curiosidades.js`, after `calcEstiloApostador` and before `if (typeof module !== "undefined")`:

```js
// 15-16: Bola de Cristal / Zica
function calcBolaDeCristal(jogosMataMata, previsoesMataMata) {
  const decididos = jogosMataMata.filter(j => j.winner);
  const porParticipante = previsoesMataMata.map(p => {
    let acertos = 0, total = 0;
    decididos.forEach(j => {
      const pred = p.preds[j.key];
      if (!pred || !pred.qualifier) return;
      total++;
      if (pred.qualifier === j.winner) acertos++;
    });
    return { nome: p.nome, acertos, total, taxa: total ? acertos / total : 0 };
  }).filter(p => p.total >= 3);

  if (!porParticipante.length) {
    return [
      { id: "bola-de-cristal", icon: "🔮", titulo: "Bola de Cristal", vencedor: null, valor: "—", detalhe: "Por decidir — poucos jogos de mata-mata decididos" },
      { id: "zica", icon: "💀", titulo: "Zica", vencedor: null, valor: "—", detalhe: "Por decidir — poucos jogos de mata-mata decididos" },
    ];
  }
  const bola = maxBy(porParticipante, p => p.taxa);
  const zica = minBy(porParticipante, p => p.taxa);
  return [
    { id: "bola-de-cristal", icon: "🔮", titulo: "Bola de Cristal", vencedor: bola.nome, valor: `${Math.round(bola.taxa * 100)}% (${bola.acertos}/${bola.total})`, detalhe: "Melhor taxa de acerto em quem passa no mata-mata" },
    { id: "zica", icon: "💀", titulo: "Zica", vencedor: zica.nome, valor: `${Math.round(zica.taxa * 100)}% (${zica.acertos}/${zica.total})`, detalhe: "Pior taxa de acerto em quem passa no mata-mata" },
  ];
}
```

Update `module.exports`:
```js
module.exports = { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador, calcBolaDeCristal };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/curiosidades.test.js`
Expected: `28 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add js/curiosidades.js tests/curiosidades.test.js
git commit -m "Adicionar prémios Bola de Cristal e Zica"
```

---

## Task 8: Fora da Manada / Voz da Malta

**Files:**
- Modify: `js/curiosidades.js`
- Modify: `tests/curiosidades.test.js`

**Interfaces:**
- Consumes: `maxBy`, `minBy` (Task 1).
- Produces: `calcContraManada(jogosGrupos, previsoesGrupos)` → 2 entries. Same shapes as Task 3.

- [ ] **Step 1: Write the failing test**

Insert before the final summary line:

```js
console.log("Curiosidades — Fora da Manada / Voz da Malta");
const jogosGrupos8 = [{ codigo: "A1" }, { codigo: "A2" }];
const previsoesGrupos8 = [
  { nome: "Ana",   preds: { A1: { gc: 2, gf: 1 }, A2: { gc: 1, gf: 1 } } },
  { nome: "Bruno", preds: { A1: { gc: 2, gf: 1 }, A2: { gc: 1, gf: 1 } } },
  { nome: "Carla", preds: { A1: { gc: 2, gf: 1 }, A2: { gc: 1, gf: 1 } } },
  { nome: "Duda",  preds: { A1: { gc: 0, gf: 3 }, A2: { gc: 3, gf: 0 } } },
];
const [fora, voz] = calcContraManada(jogosGrupos8, previsoesGrupos8);
ok(fora.vencedor === "Duda" && fora.valor === "0% igual à malta", "Fora da Manada = Duda nunca bate com a moda (2-1/1-1)");
ok(voz.valor === "100% igual à malta", "Voz da Malta = 100% de coincidência para quem segue a moda");
const poucosJogadores = calcContraManada(jogosGrupos8, previsoesGrupos8.slice(0, 2));
ok(poucosJogadores.every(a => a.vencedor === null), "menos de 4 jogadores fica por decidir");
```

Update the `require` line:
```js
const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador, calcBolaDeCristal, calcContraManada } = require("../js/curiosidades.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/curiosidades.test.js`
Expected: `TypeError: calcContraManada is not a function`

- [ ] **Step 3: Write minimal implementation**

Insert into `js/curiosidades.js`, after `calcBolaDeCristal` and before `if (typeof module !== "undefined")`:

```js
// 17-18: Fora da Manada / Voz da Malta
function calcContraManada(jogosGrupos, previsoesGrupos) {
  if (previsoesGrupos.length < 4) {
    return [
      { id: "fora-da-manada", icon: "🐑", titulo: "Fora da Manada", vencedor: null, valor: "—", detalhe: "Por decidir — poucos jogadores com prognóstico" },
      { id: "voz-da-malta", icon: "🤝", titulo: "Voz da Malta", vencedor: null, valor: "—", detalhe: "Por decidir — poucos jogadores com prognóstico" },
    ];
  }
  const conformidade = {};
  previsoesGrupos.forEach(p => { conformidade[p.nome] = { igual: 0, total: 0 }; });

  jogosGrupos.forEach(j => {
    const contagem = {};
    previsoesGrupos.forEach(p => {
      const pred = p.preds[j.codigo];
      if (!pred) return;
      const chave = `${pred.gc}-${pred.gf}`;
      contagem[chave] = (contagem[chave] || 0) + 1;
    });
    const entradas = Object.entries(contagem);
    const totalPrevisoes = entradas.reduce((s, [, n]) => s + n, 0);
    if (totalPrevisoes < 4) return;
    const moda = entradas.reduce((best, cur) => (cur[1] > best[1] ? cur : best), entradas[0])[0];
    previsoesGrupos.forEach(p => {
      const pred = p.preds[j.codigo];
      if (!pred) return;
      conformidade[p.nome].total++;
      if (`${pred.gc}-${pred.gf}` === moda) conformidade[p.nome].igual++;
    });
  });

  const comTaxa = Object.entries(conformidade)
    .map(([nome, c]) => ({ nome, taxa: c.total ? c.igual / c.total : 0, total: c.total }))
    .filter(p => p.total > 0);

  if (!comTaxa.length) {
    return [
      { id: "fora-da-manada", icon: "🐑", titulo: "Fora da Manada", vencedor: null, valor: "—", detalhe: "Por decidir — poucos jogos com prognósticos suficientes" },
      { id: "voz-da-malta", icon: "🤝", titulo: "Voz da Malta", vencedor: null, valor: "—", detalhe: "Por decidir — poucos jogos com prognósticos suficientes" },
    ];
  }
  const fora = minBy(comTaxa, p => p.taxa);
  const voz = maxBy(comTaxa, p => p.taxa);
  return [
    { id: "fora-da-manada", icon: "🐑", titulo: "Fora da Manada", vencedor: fora.nome, valor: `${Math.round(fora.taxa * 100)}% igual à malta`, detalhe: "Previsões mais diferentes do consenso geral" },
    { id: "voz-da-malta", icon: "🤝", titulo: "Voz da Malta", vencedor: voz.nome, valor: `${Math.round(voz.taxa * 100)}% igual à malta`, detalhe: "Previsões mais alinhadas com o consenso geral" },
  ];
}
```

Update `module.exports`:
```js
module.exports = { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador, calcBolaDeCristal, calcContraManada };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/curiosidades.test.js`
Expected: `31 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add js/curiosidades.js tests/curiosidades.test.js
git commit -m "Adicionar prémios Fora da Manada e Voz da Malta"
```

---

## Task 9: Habitué do Jantar + orquestrador `calcCuriosidades`

**Files:**
- Modify: `js/curiosidades.js`
- Modify: `tests/curiosidades.test.js`

**Interfaces:**
- Consumes: all functions from Tasks 1-8.
- Produces: `calcHabitueJantar(classHistory)` → 1 entry. `calcCuriosidades(input)` → `Array<{ id, icon, titulo, vencedor, valor, detalhe }>` (all 20 awards), where `input` has keys `participantStats`, `jogosGrupos`, `previsoesGrupos`, `jogosMataMata`, `previsoesMataMata`, `classHistory` (all optional, default `[]`).

- [ ] **Step 1: Write the failing test**

Insert before the final summary line:

```js
console.log("Curiosidades — Habitué do Jantar + orquestrador");
const hist9 = [
  { ts: 1, ranking: [{ nome: "Ana", pts: 1, pos: 1 }, { nome: "Bruno", pts: 0, pos: 2 }] },
  { ts: 2, ranking: [{ nome: "Ana", pts: 1, pos: 2 }, { nome: "Bruno", pts: 2, pos: 1 }] },
];
const habitue = calcHabitueJantar(hist9);
ok(habitue.vencedor === "Ana" && habitue.valor === "1x na metade que paga", "Habitué do Jantar conta snapshots na metade que paga (pos > half)");
ok(calcHabitueJantar([]).vencedor === null, "sem histórico fica por decidir");

const awards = calcCuriosidades({
  participantStats: stats4,
  jogosGrupos: jogosGrupos3,
  previsoesGrupos: previsoesGrupos3,
  jogosMataMata: jogosMataMata3,
  previsoesMataMata: previsoesMataMata3,
  classHistory: hist9,
});
ok(awards.length === 20, `calcCuriosidades devolve 20 prémios (veio ${awards.length})`);
ok(awards.every(a => a.id && a.icon && a.titulo), "todos os prémios têm id/icon/titulo");
ok(calcCuriosidades({}).length === 20, "input vazio não rebenta, devolve 20 prémios com por-decidir");
```

Update the `require` line:
```js
const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador, calcBolaDeCristal, calcContraManada, calcHabitueJantar, calcCuriosidades } = require("../js/curiosidades.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/curiosidades.test.js`
Expected: `TypeError: calcHabitueJantar is not a function`

- [ ] **Step 3: Write minimal implementation**

Insert into `js/curiosidades.js`, after `calcContraManada` and before `if (typeof module !== "undefined")`:

```js
// 19: Habitué do Jantar
function calcHabitueJantar(classHistory) {
  if (!classHistory.length) {
    return { id: "habitue-jantar", icon: "🍽️", titulo: "Habitué do Jantar", vencedor: null, valor: "—", detalhe: "Por decidir — falta histórico" };
  }
  const contagem = {};
  classHistory.forEach(snap => {
    const half = Math.floor(snap.ranking.length / 2);
    snap.ranking.forEach(r => {
      if (r.pos > half) contagem[r.nome] = (contagem[r.nome] || 0) + 1;
    });
  });
  const entradas = Object.entries(contagem);
  if (!entradas.length) {
    return { id: "habitue-jantar", icon: "🍽️", titulo: "Habitué do Jantar", vencedor: null, valor: "0 vezes", detalhe: "Ninguém esteve na metade que paga ainda" };
  }
  const [nome, vezes] = entradas.reduce((best, cur) => (cur[1] > best[1] ? cur : best), entradas[0]);
  return { id: "habitue-jantar", icon: "🍽️", titulo: "Habitué do Jantar", vencedor: nome, valor: `${vezes}x na metade que paga`, detalhe: "Mais vezes na metade que paga o jantar, ao longo da época" };
}

// Orquestrador — junta todos os prémios num único array
function calcCuriosidades(input) {
  const {
    participantStats = [],
    jogosGrupos = [],
    previsoesGrupos = [],
    jogosMataMata = [],
    previsoesMataMata = [],
    classHistory = [],
  } = input || {};

  const nJogosComResultado = jogosGrupos.filter(j => j.gc !== null && j.gc !== undefined).length;

  return [
    ...calcSniperECoracaoDePedra(participantStats),
    ...calcEspecialistas(participantStats),
    ...calcSequencias(jogosGrupos, previsoesGrupos, jogosMataMata, previsoesMataMata),
    calcTotalExatos(participantStats, nJogosComResultado),
    calcDistribuicaoMalta(participantStats),
    ...calcTendencias(classHistory),
    ...calcEstiloApostador(jogosGrupos, previsoesGrupos),
    ...calcBolaDeCristal(jogosMataMata, previsoesMataMata),
    ...calcContraManada(jogosGrupos, previsoesGrupos),
    calcHabitueJantar(classHistory),
  ];
}
```

Note: with `previsoesGrupos: []`, `calcEstiloApostador` currently returns
`[]` (0 entries) instead of the usual 4 "por decidir" entries — every
other award group falls back to placeholder entries on empty input, so
this one must too for `calcCuriosidades({})` to always total 20 (not a
number that shifts depending on how much data exists yet). Verify the
full count: `calcSniperECoracaoDePedra([])`→2 (por decidir, per Task 1's
final fix), `calcEspecialistas([])`→2, `calcSequencias([],[],[],[])`→2,
`calcTotalExatos`→1, `calcDistribuicaoMalta`→1, `calcTendencias([])`→3,
`calcEstiloApostador([],[])`→4 (after the fix below), `calcBolaDeCristal([],[])`→2,
`calcContraManada([],[])`→2, `calcHabitueJantar([])`→1.
Total = 2+2+2+1+1+3+4+2+2+1 = **20**. ✅

Fix: `calcEstiloApostador` must return 4 "por decidir" entries instead of `[]` when there is no data, for consistency with every other award group. Go back and adjust Task 6's implementation and test before continuing:

In `js/curiosidades.js`, replace the early-return line in `calcEstiloApostador`:
```js
  if (!previsoesGrupos.length) return [];
```
with:
```js
  if (!previsoesGrupos.length) {
    return [
      { id: "kamikaze", icon: "🎰", titulo: "Kamikaze", vencedor: null, valor: "—", detalhe: "Por decidir — falta prognósticos" },
      { id: "betao-armado", icon: "🛡️", titulo: "Betão Armado", vencedor: null, valor: "—", detalhe: "Por decidir — falta prognósticos" },
      { id: "fa-de-empates", icon: "⚖️", titulo: "Fã de Empates", vencedor: null, valor: "—", detalhe: "Por decidir — falta prognósticos" },
      { id: "nunca-sofre", icon: "🥅", titulo: "Nunca Sofre", vencedor: null, valor: "—", detalhe: "Por decidir — falta prognósticos" },
    ];
  }
```
And the second guard further down:
```js
  if (!porParticipante.length) return [];
```
becomes the same 4-entry block (repeat it, or factor into a tiny local function `porDecidirApostador()` returning that array and call it from both guards).

In `tests/curiosidades.test.js`, update the Task 6 assertion:
```js
ok(calcEstiloApostador([], []).length === 0, "sem previsões devolve array vazio");
```
to:
```js
ok(calcEstiloApostador([], []).length === 4, "sem previsões devolve 4 prémios por decidir");
```

Now recount: `calcEstiloApostador([],[])` → 4. Total = 2+2+2+1+1+3+4+2+2+1 = **20**. ✅

Update `module.exports`:
```js
module.exports = {
  maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias,
  calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador,
  calcBolaDeCristal, calcContraManada, calcHabitueJantar, calcCuriosidades,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/curiosidades.test.js`
Expected: `36 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add js/curiosidades.js tests/curiosidades.test.js
git commit -m "Adicionar Habitué do Jantar e orquestrador calcCuriosidades"
```

---

## Task 10: `buildPresentationOrder` (ordem de revelação do Modo Jantar)

**Files:**
- Modify: `js/curiosidades.js`
- Modify: `tests/curiosidades.test.js`

**Interfaces:**
- Produces: `buildPresentationOrder(n)` → `Array<{ pos: number, fase: "A"|"B"|"C"|"D" }>`, `n` = número de participantes. Fase A = pior bloco (posição `n` até `half+2`, descendente). Fase B = bloco de cima sem a fronteira (posição `half-1` até `2`, descendente). Fase C = campeão (posição `1`). Fase D = fronteira paga/não-paga (posição `half+1` depois `half`), onde `half = Math.floor(n/2)`.

- [ ] **Step 1: Write the failing test**

Insert before the final summary line:

```js
console.log("Curiosidades — buildPresentationOrder");
const ordem10 = buildPresentationOrder(10);
ok(ordem10.length === 10, "10 participantes -> 10 entradas, uma por posição");
ok(ordem10.map(o => o.pos).sort((a, b) => a - b).join(",") === "1,2,3,4,5,6,7,8,9,10", "cobre todas as posições sem repetir");
ok(ordem10[0].pos === 10 && ordem10[0].fase === "A", "começa no último lugar (fase A)");
ok(ordem10.slice(0, 4).every(o => o.fase === "A"), "fase A = posições 10,9,8,7");
ok(ordem10.slice(4, 7).every(o => o.fase === "B"), "fase B = posições 4,3,2");
ok(ordem10[7].pos === 1 && ordem10[7].fase === "C", "fase C = posição 1 (campeão)");
ok(ordem10[8].pos === 6 && ordem10[8].fase === "D", "fase D revela primeiro quem paga (6º)");
ok(ordem10[9].pos === 5 && ordem10[9].fase === "D", "fase D revela por último quem escapa (5º) — clímax final");

ok(buildPresentationOrder(0).length === 0, "0 participantes não rebenta");
ok(buildPresentationOrder(1).length === 1, "1 participante -> só o campeão, sem fronteira duplicada");
const ordem2 = buildPresentationOrder(2);
ok(ordem2.length === 2 && ordem2.map(o => o.pos).sort().join(",") === "1,2", "2 participantes cobre as 2 posições sem duplicar");
```

Update the `require` line:
```js
const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador, calcBolaDeCristal, calcContraManada, calcHabitueJantar, calcCuriosidades, buildPresentationOrder } = require("../js/curiosidades.js");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/curiosidades.test.js`
Expected: `TypeError: buildPresentationOrder is not a function`

- [ ] **Step 3: Write minimal implementation**

Insert into `js/curiosidades.js`, after `calcCuriosidades` and before `if (typeof module !== "undefined")`:

```js
// Ordem de revelação do Modo Jantar: pior bloco -> bloco de cima -> campeão
// -> fronteira paga/não-paga (clímax final). Ver secção "Modo Jantar" da spec.
function buildPresentationOrder(n) {
  if (n <= 0) return [];
  const half = Math.floor(n / 2);
  const ordem = [];
  for (let pos = n; pos >= half + 2; pos--) ordem.push({ pos, fase: "A" });
  for (let pos = half - 1; pos >= 2; pos--) ordem.push({ pos, fase: "B" });
  ordem.push({ pos: 1, fase: "C" });
  if (half >= 1 && half + 1 !== 1) ordem.push({ pos: half + 1, fase: "D" });
  if (half >= 1 && half !== 1) ordem.push({ pos: half, fase: "D" });
  return ordem;
}
```

Update `module.exports`:
```js
module.exports = {
  maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias,
  calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador,
  calcBolaDeCristal, calcContraManada, calcHabitueJantar, calcCuriosidades,
  buildPresentationOrder,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/curiosidades.test.js`
Expected: `47 passed, 0 failed`

- [ ] **Step 5: Run full suite and commit**

Run: `npm test`
Expected: `12 passed, 0 failed` (scoring) then `47 passed, 0 failed` (curiosidades).

```bash
git add js/curiosidades.js tests/curiosidades.test.js
git commit -m "Adicionar buildPresentationOrder para o Modo Jantar"
```

---

## Task 11: Tab "Curiosidades" na app (UI)

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `css/style.css`

**Interfaces:**
- Consumes: `calcCuriosidades` (Task 9), `MM_ROUNDS`, `mmWinner`, `getResultados`, `getGSOverrides`, `getGSPredFor`, `getMataMata`, `getKOPredsAll`, `getKOPredFor`, `calcParticipante`, `dbGet`, `DB_KEYS.CLASS_HISTORY`, `DADOS.participantes`, `DADOS.jogos` (all existing).
- Produces: `buildCuriosidadesInput()` → the `input` object shape consumed by `calcCuriosidades`. `renderCuriosidades()` — renders `#curiosidades-content`.

This task has no automated test (it's DOM rendering wired to live app state, same as every other tab in this codebase — `renderMataMata`, `renderPrevisoes`, etc. aren't unit tested either). Verify manually in the browser at the end.

- [ ] **Step 1: Add the script tag**

In `index.html`, right after the `js/scoring.js` script tag, add:

```html
<script src="js/config.js?v=18"></script>
<script src="js/scoring.js?v=18"></script>
<script src="js/curiosidades.js?v=18"></script>
<script src="js/db.js?v=18"></script>
<script src="js/api.js?v=18"></script>
<script src="js/features.js?v=18"></script>
<script src="js/data.js?v=18"></script>
<script src="js/app.js?v=18"></script>
```

(This bumps every `?v=` from `17` to `18` and inserts the new `curiosidades.js` line — replace the whole block of 7 `<script>` tags with this 8-line block.)

Also bump the stylesheet version:
```html
<link rel="stylesheet" href="css/style.css?v=11" />
```

- [ ] **Step 2: Add the tab nav buttons**

In `index.html`, in the `.tabs-track` div, insert a new button right before the "Regras" button:

```html
<button class="tab-btn"        data-tab="curiosidades" onclick="switchTab('curiosidades')"><span class="tab-icon">🏆</span><span class="tab-label">Curiosidades</span></button>
```

In the `.mobile-sheet-grid` div, insert right before the "Regras" sheet-item:

```html
<button class="sheet-item" data-tab="curiosidades" onclick="switchTab('curiosidades');closeMobileMore()"><span>🏆</span>Curiosidades</button>
```

In `js/app.js`, in `switchTab`, add `"curiosidades"` to the mobile "more" group array:

```js
b.classList.toggle("active", ["revisao-mm","importacoes","previsoes","curiosidades","regras","whatsapp"].includes(tab));
```

- [ ] **Step 3: Add the tab content container**

In `index.html`, in `<main class="main-content">`, insert a new `.tab-content` div right before the `tab-regras` div:

```html
<div class="tab-content" id="tab-curiosidades">
  <div id="curiosidades-content"></div>
</div>
```

- [ ] **Step 4: Wire the render dispatch**

In `js/app.js`, in `renderTab(tab)`, add a new branch right before `else if (tab === "regras")`:

```js
  else if (tab === "curiosidades")  renderCuriosidades();
```

- [ ] **Step 5: Write `buildCuriosidadesInput` and `renderCuriosidades`**

In `js/app.js`, add this right after the `calcClassificacao` function (after its closing `}`, before `const TIPO_CSS = {...}`):

```js
// ─── CURIOSIDADES ────────────────────────────────────────────────────────────
function buildCuriosidadesInput() {
  const resultados = getResultados();
  const gsOv = getGSOverrides();
  const mm = getMataMata();
  const koP = getKOPredsAll();
  const classHistory = dbGet(DB_KEYS.CLASS_HISTORY) || [];

  const participantStats = DADOS.participantes.map(nome =>
    calcParticipante(nome, resultados, gsOv, mm, koP));

  const jogosGrupos = DADOS.jogos.map(j => {
    const r = resultados[j.codigo];
    return { codigo: j.codigo, gc: r ? r.gc : null, gf: r ? r.gf : null };
  });

  const previsoesGrupos = DADOS.participantes.map((nome, pi) => {
    const preds = {};
    DADOS.jogos.forEach(j => {
      const p = getGSPredFor(pi, j.codigo);
      if (p) preds[j.codigo] = { gc: p.casa, gf: p.fora };
    });
    return { nome, preds };
  });

  const jogosMataMata = [];
  MM_ROUNDS.forEach(round => {
    (mm[round.id] || []).forEach((game, idx) => {
      jogosMataMata.push({
        key: `${round.id}:${idx}`, roundId: round.id,
        gc: game.gc, gf: game.gf, winner: mmWinner(game),
      });
    });
  });

  const previsoesMataMata = DADOS.participantes.map((nome, pi) => {
    const preds = {};
    MM_ROUNDS.forEach(round => {
      (mm[round.id] || []).forEach((game, idx) => {
        const p = getKOPredFor(pi, round.id, idx);
        if (p && p.gc !== null && p.gc !== undefined) {
          preds[`${round.id}:${idx}`] = { gc: p.gc, gf: p.gf, qualifier: p.qualifier || null };
        }
      });
    });
    return { nome, preds };
  });

  return { participantStats, jogosGrupos, previsoesGrupos, jogosMataMata, previsoesMataMata, classHistory };
}

function renderCuriosidades() {
  const container = document.getElementById("curiosidades-content");
  if (!container) return;
  const awards = calcCuriosidades(buildCuriosidadesInput());
  let html = `<div class="curiosidades-header">
    <h2 class="curiosidades-title">🏆 Curiosidades da Época</h2>
    <p class="curiosidades-sub">Atualiza sempre que há resultados novos</p>
  </div><div class="curiosidades-grid">`;
  awards.forEach(a => {
    html += `<div class="curio-card ${a.vencedor ? "" : "curio-pending"}">
      <div class="curio-icon">${a.icon}</div>
      <div class="curio-titulo">${a.titulo}</div>
      <div class="curio-vencedor">${a.vencedor || "Por decidir"}</div>
      <div class="curio-valor">${a.valor}</div>
      <div class="curio-detalhe">${a.detalhe}</div>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}
```

- [ ] **Step 6: Add CSS**

In `css/style.css`, append at the end of the file:

```css
/* ─── Curiosidades ─────────────────────────────────────────────────────── */
.curiosidades-header { text-align: center; margin-bottom: 20px; }
.curiosidades-title { font-size: 1.6rem; font-weight: 900; color: var(--gold); }
.curiosidades-sub { color: var(--muted); font-size: .85rem; margin-top: 4px; }
.curiosidades-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px; padding: 4px;
}
.curio-card {
  background: var(--surface); border: 1px solid var(--glass-border);
  border-radius: 16px; padding: 20px; text-align: center;
}
.curio-card.curio-pending { opacity: .55; }
.curio-icon { font-size: 2.2rem; margin-bottom: 8px; }
.curio-titulo { font-weight: 800; color: var(--gold); font-size: .95rem; text-transform: uppercase; letter-spacing: .04em; }
.curio-vencedor { font-size: 1.3rem; font-weight: 900; color: var(--text); margin-top: 6px; }
.curio-valor { color: var(--cyan); font-weight: 700; margin-top: 4px; }
.curio-detalhe { color: var(--muted); font-size: .8rem; margin-top: 6px; }
```

- [ ] **Step 7: Run full test suite (regression check)**

Run: `npm test`
Expected: `12 passed, 0 failed` then `47 passed, 0 failed` (nothing in this task touches tested logic, this just confirms nothing broke).

- [ ] **Step 8: Manual verification**

Start a local server (e.g. `npx serve .` or open `index.html` via the project's existing dev flow), log in, click the new "Curiosidades" tab, and confirm:
- 20 cards render, each with an icon, title, winner name (or "Por decidir"), value and detail line.
- No console errors.

- [ ] **Step 9: Commit**

```bash
git add index.html js/app.js css/style.css
git commit -m "Adicionar tab Curiosidades com 20 prémios ao vivo"
```

---

## Task 12: Modo Jantar com suspense (4 fases)

**Files:**
- Modify: `js/features.js`
- Modify: `css/style.css`

**Interfaces:**
- Consumes: `buildPresentationOrder` (Task 10), `calcCuriosidades` (Task 9), `buildCuriosidadesInput` (Task 11), `calcClassificacao`, `getResultados` (existing).

No automated test (DOM/presentation code, same rationale as Task 11). Verify manually.

- [ ] **Step 1: Replace the Modo Jantar functions**

In `js/features.js`, replace the entire block from `// ─── Modo Apresentação (jantar) ─────` through the end of the old `renderPresentationSlide` function (currently lines 236-277) with:

```js
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
  if (slide.type === "rank" && _presStage === 1) {
    _presStage = 2;
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
  const isFirst = _presSlide === 0;
  const isLast = _presSlide >= _presSlides.length - 1 && !(slide.type === "rank" && _presStage === 1);

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
  }

  const proximoLabel = (slide.type === "rank" && _presStage === 1) ? "Revelar →" : "Seguinte →";
  el.innerHTML = `${bodyHtml}
    <div class="pres-nav">
      <button onclick="presentationPrev()" ${isFirst ? "disabled" : ""}>← Anterior</button>
      <span>${_presSlide + 1} / ${_presSlides.length}</span>
      <button onclick="presentationNext()" ${isLast ? "disabled" : ""}>${proximoLabel}</button>
    </div>`;
}
```

- [ ] **Step 2: Add CSS for the new slide types**

In `css/style.css`, append at the end of the file:

```css
/* ─── Modo Jantar — slides extra ──────────────────────────────────────── */
.pres-blur { filter: blur(6px); transition: filter .3s ease; }
.pres-premio-icon { font-size: 3rem; margin-bottom: 12px; }
.pres-campeao, .pres-fronteira { position: relative; }
.pres-campeao .pres-title { font-size: clamp(2.5rem, 10vw, 4.5rem); }
.pres-confetti {
  position: absolute; inset: -40px -40px auto -40px; height: 300px;
  pointer-events: none;
  background-image:
    radial-gradient(circle, var(--gold) 3px, transparent 3px),
    radial-gradient(circle, var(--cyan) 3px, transparent 3px),
    radial-gradient(circle, var(--emerald) 3px, transparent 3px);
  background-size: 60px 60px, 80px 80px, 70px 70px;
  animation: confetti-fall 3s linear infinite;
  opacity: .6;
}
@keyframes confetti-fall {
  from { background-position: 0 -100px, 20px -140px, 40px -120px; }
  to   { background-position: 0 400px, 20px 440px, 40px 420px; }
}
.pres-fronteira-label { font-size: 1.3rem; font-weight: 800; margin-top: 10px; }
.pres-paga { color: var(--rose); }
```

- [ ] **Step 3: Run full test suite (regression check)**

Run: `npm test`
Expected: `12 passed, 0 failed` then `47 passed, 0 failed`.

- [ ] **Step 4: Manual verification**

Open the app, go to Classificação (or wherever "🎬 Modo jantar" button lives), click it, and walk through the whole sequence:
- Intro slide, then last-place-first reveals with the 2-click reveal (blur → name+pts+badge).
- A "prize" slide appears after every 3rd rank reveal.
- Champion slide (confetti) appears after the top block, but is **not** the last slide.
- The very last two slides are the paga/não-paga boundary, paga person first, then the person who escaped.
- "← Anterior"/"Seguinte →" disable correctly at the first/last slide.

- [ ] **Step 5: Commit**

```bash
git add js/features.js css/style.css
git commit -m "Reescrever Modo Jantar em 4 fases com fronteira paga/não-paga como clímax final"
```

---

## Task 13: Integração final

**Files:**
- None new — final regression pass.

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: `12 passed, 0 failed` (scoring) then `47 passed, 0 failed` (curiosidades), exit code 0.

- [ ] **Step 2: Syntax check every touched JS file**

```bash
node --check js/curiosidades.js
node --check js/app.js
node --check js/features.js
```
Expected: no output (success) from all three.

- [ ] **Step 3: Manual smoke test in the real app**

Log into the deployed/local app and confirm, in order: Curiosidades tab renders with real data (no "—" everywhere unless the tournament genuinely has too little data yet), Modo Jantar runs end-to-end without console errors, and every other existing tab (Resultados, Classificação, Revisão, Mata-Mata, Revisão M-M, Importações, Previsões, Regras, WhatsApp) still works as before.

- [ ] **Step 4: Push**

```bash
git push origin main
```
