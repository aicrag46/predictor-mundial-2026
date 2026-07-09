const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta } = require("../js/curiosidades.js");

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

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
