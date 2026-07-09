const { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas } = require("../js/curiosidades.js");

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

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
