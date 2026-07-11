const { maxBy, minBy, maxByAll, minByAll, juntarNomes, calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias, calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador, calcBolaDeCristal, calcContraManada, calcHabitueJantar, calcCuriosidades, buildPresentationOrder } = require("../js/curiosidades.js");

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log("  ✅", msg); }
  else { failed++; console.error("  ❌", msg); }
}

console.log("Curiosidades — helpers");
ok(maxBy([{ n: 1 }, { n: 3 }, { n: 2 }], x => x.n).n === 3, "maxBy encontra o maior");
ok(minBy([{ n: 1 }, { n: 3 }, { n: 2 }], x => x.n).n === 1, "minBy encontra o menor");
ok(maxBy([], x => x.n) === null, "maxBy devolve null em array vazio");
ok(maxByAll([{n:1},{n:3},{n:2}], x=>x.n).length === 1 && maxByAll([{n:1},{n:3},{n:2}], x=>x.n)[0].n === 3, "maxByAll sem empate devolve só o maior");
ok(maxByAll([{n:3},{n:1},{n:3}], x=>x.n).length === 2, "maxByAll com empate devolve todos os empatados");
ok(minByAll([{n:3},{n:1},{n:1}], x=>x.n).length === 2, "minByAll com empate devolve todos os empatados");
ok(maxByAll([], x=>x.n).length === 0, "maxByAll devolve [] em array vazio");
ok(juntarNomes([{nome:"Ana"}]) === "Ana", "juntarNomes com 1 nome não acrescenta separador");
ok(juntarNomes([{nome:"Ana"},{nome:"Bruno"}]) === "Ana & Bruno", "juntarNomes junta vários nomes com & ");

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

console.log("Curiosidades — Tendências");
const hist5 = [
  { ts: 1, ranking: [{ nome: "Ana", pts: 5, pos: 3 }, { nome: "Bruno", pts: 10, pos: 1 }] },
  { ts: 2, ranking: [{ nome: "Ana", pts: 20, pos: 1 }, { nome: "Bruno", pts: 10, pos: 3 }] },
];
const [subida, queda, montanha] = calcTendencias(hist5);
ok(subida.vencedor === "Ana" && subida.valor === "2 posições", "Maior Subida: Ana foi de 3º a 1º");
ok(queda.vencedor === "Bruno" && queda.valor === "2 posições", "Maior Queda: Bruno foi de 1º a 3º");
ok(montanha.vencedor === "Ana & Bruno", `Montanha-Russa empatada mostra os dois nomes (veio ${montanha.vencedor})`);
const semHistorico = calcTendencias([]);
ok(semHistorico.every(a => a.vencedor === null), "sem histórico fica tudo por decidir");
const umSnapshot = calcTendencias([{ ts: 1, ranking: [{ nome: "Ana", pts: 5, pos: 1 }] }]);
ok(umSnapshot.every(a => a.vencedor === null), "com 1 snapshot só, fica por decidir");
const emptyRankingHistory = [
  { ts: 1, ranking: [] },
  { ts: 2, ranking: [] },
];
const emptyRankingResult = calcTendencias(emptyRankingHistory);
ok(emptyRankingResult.every(a => a.vencedor === null), "com ranking vazio em ambos snapshots, fica por decidir (não rebentar)");

console.log("Curiosidades — Estilo de Apostador");
const jogosGrupos6 = [{ codigo: "A1", gc: 0, gf: 0 }, { codigo: "A2", gc: 1, gf: 2 }];
const previsoesGrupos6 = [
  { nome: "Ana", preds: { A1: { gc: 3, gf: 2 }, A2: { gc: 2, gf: 2 } } },   // média 4.5 (total 9 golos em 2 jogos), 1 empate previsto, 0 "nunca sofre"
  { nome: "Bruno", preds: { A1: { gc: 0, gf: 0 }, A2: { gc: 1, gf: 0 } } }, // média 0.5 (total 1 golo em 2 jogos), 1 empate previsto, acerta A1 (0-0 -> ambos 0 golos sofridos)
];
const [kamikaze, betao, faDeEmpates, nuncaSofre] = calcEstiloApostador(jogosGrupos6, previsoesGrupos6);
ok(kamikaze.vencedor === "Ana", "Kamikaze = maior média de golos previstos");
ok(betao.vencedor === "Bruno", "Betão Armado = menor média de golos previstos");
ok(faDeEmpates.vencedor === "Ana & Bruno", `Fã de Empates empatado (1 cada) mostra os dois nomes (veio ${faDeEmpates.vencedor})`);
ok(nuncaSofre.vencedor === "Bruno" && nuncaSofre.valor === "2 vezes", "Nunca Sofre: Bruno acerta 0-0 em A1 (2 golos sofridos corretos)");
const emptyResult = calcEstiloApostador([], []);
ok(emptyResult.length === 4, "sem previsões devolve 4 prémios por decidir");
ok(emptyResult.every(a => a.vencedor === null), "todos os prémios vazios têm vencedor === null");

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

console.log("Curiosidades — Habitué do Jantar + orquestrador");
const hist9 = [
  { ts: 1, ranking: [{ nome: "Ana", pts: 1, pos: 1 }, { nome: "Bruno", pts: 0, pos: 2 }] },
  { ts: 2, ranking: [{ nome: "Ana", pts: 1, pos: 2 }, { nome: "Bruno", pts: 2, pos: 1 }] },
  { ts: 3, ranking: [{ nome: "Ana", pts: 1, pos: 2 }, { nome: "Bruno", pts: 2, pos: 1 }] },
];
const habitue = calcHabitueJantar(hist9);
ok(habitue.vencedor === "Ana" && habitue.valor === "2x na metade que paga", "Habitué do Jantar conta snapshots na metade que paga (pos > half)");
ok(calcHabitueJantar([]).vencedor === null, "sem histórico fica por decidir");

// Empate: Bruno e Carla pagaram 3x cada (o máximo), Ana só 2x (não deve
// entrar no empate) — quando há empate no topo, mostra os dois nomes
// juntos em vez de escolher um arbitrariamente.
const histEmpate = [
  { ts: 1, ranking: [
    { nome: "Zeca", pts: 5, pos: 1 }, { nome: "Yara", pts: 4, pos: 2 },
    { nome: "Ana", pts: 3, pos: 3 }, { nome: "Bruno", pts: 2, pos: 4 },
    { nome: "Carla", pts: 1, pos: 5 },
  ] },
  { ts: 2, ranking: [
    { nome: "Ana", pts: 5, pos: 1 }, { nome: "Yara", pts: 4, pos: 2 },
    { nome: "Zeca", pts: 3, pos: 3 }, { nome: "Bruno", pts: 2, pos: 4 },
    { nome: "Carla", pts: 1, pos: 5 },
  ] },
  { ts: 3, ranking: [
    { nome: "Zeca", pts: 5, pos: 1 }, { nome: "Yara", pts: 4, pos: 2 },
    { nome: "Ana", pts: 3, pos: 3 }, { nome: "Bruno", pts: 2, pos: 4 },
    { nome: "Carla", pts: 1, pos: 5 },
  ] },
];
const habitueEmpate = calcHabitueJantar(histEmpate);
ok(habitueEmpate.vencedor === "Bruno & Carla" && habitueEmpate.valor === "3x na metade que paga", `empate no topo mostra os dois nomes, não escolhe um (veio ${habitueEmpate.vencedor})`);

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

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
