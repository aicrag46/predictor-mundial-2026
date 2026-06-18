const { getTipo, getPontos, calcKO } = require("../js/scoring.js");

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log("  ✅", msg); }
  else { failed++; console.error("  ❌", msg); }
}

console.log("Scoring — Fase de Grupos");
ok(getTipo(2, 1, 2, 1) === "Exato", "Exato 2-1");
ok(getPontos(getTipo(2, 1, 2, 1)) === 5, "Exato = 5 pts");
ok(getTipo(2, 1, 3, 1) === "Vencedor/Empate", "VE mesmo vencedor");
ok(getPontos(getTipo(2, 1, 3, 1)) === 2, "VE = 2 pts");
ok(getTipo(2, 1, 2, 0) === "Vencedor/Empate", "2-1 vs 2-0 = VE (não golos)");
ok(getTipo(2, 1, 1, 1) === "Golos Equipa", "Golos fora 1=1");
ok(getPontos(getTipo(2, 1, 1, 1)) === 1, "Golos = 1 pt");
ok(getTipo(2, 1, 0, 2) === "Não Pontuou", "Nada certo");
ok(getPontos(getTipo(2, 1, 0, 2)) === 0, "Zero pts");

console.log("Scoring — Mata-Mata");
const ko1 = calcKO("f", 2, 1, "Portugal", 2, 1, "Portugal");
ok(ko1.pts === 35 + 15, "Final exato + qual = 50");
const ko2 = calcKO("r32", 1, 1, "Brasil", 1, 1, "Brasil");
ok(ko2.scorePts === 7 && ko2.qualPts === 3 && ko2.pts === 10, "R32 exato empate + qual");
ok(calcKO("r32", 0, 0, null, null, null, null).pts === 0, "Pendente = 0");

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
