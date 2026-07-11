// ─── CURIOSIDADES (estatísticas divertidas — partilhado app + testes) ────────
// Ver docs/superpowers/specs/2026-07-09-curiosidades-modo-jantar-design.md

// Em Node importamos getTipo/calcKO de js/scoring.js. No browser, scoring.js
// já os define como globais (carrega antes deste ficheiro) — usamos esse
// objeto diretamente para nunca sombrear os globais do browser.
const _S = typeof module !== "undefined" ? require("./scoring.js") : { getTipo, calcKO };

function maxBy(arr, fn) {
  if (!arr.length) return null;
  return arr.reduce((best, cur) => (fn(cur) > fn(best) ? cur : best), arr[0]);
}
function minBy(arr, fn) {
  if (!arr.length) return null;
  return arr.reduce((best, cur) => (fn(cur) < fn(best) ? cur : best), arr[0]);
}
// Variantes que devolvem TODOS os empatados no valor extremo, não só o
// primeiro — usadas sempre que "vencedor" é mostrado a alguém, para nunca
// escolher arbitrariamente entre pessoas empatadas.
function maxByAll(arr, fn) {
  if (!arr.length) return [];
  const max = Math.max(...arr.map(fn));
  return arr.filter(x => fn(x) === max);
}
function minByAll(arr, fn) {
  if (!arr.length) return [];
  const min = Math.min(...arr.map(fn));
  return arr.filter(x => fn(x) === min);
}
function juntarNomes(entradas) {
  return entradas.map(e => e.nome).join(" & ");
}

// 1-2: Sniper / Coração de Pedra
function calcSniperECoracaoDePedra(participantStats) {
  if (!participantStats.length) {
    return [
      { id: "sniper", icon: "🎯", titulo: "Sniper", vencedor: null, valor: "—", detalhe: "Mais resultados exatos (grupos + mata-mata)" },
      { id: "coracao-de-pedra", icon: "🥶", titulo: "Coração de Pedra", vencedor: null, valor: "—", detalhe: "Mais prognósticos sem qualquer ponto" },
    ];
  }
  const sniper = maxByAll(participantStats, p => p.exatos);
  const coracao = maxByAll(participantStats, p => p.naoPontua);
  return [
    { id: "sniper", icon: "🎯", titulo: "Sniper", vencedor: juntarNomes(sniper), valor: `${sniper[0].exatos} exatos`, detalhe: "Mais resultados exatos (grupos + mata-mata)" },
    { id: "coracao-de-pedra", icon: "🥶", titulo: "Coração de Pedra", vencedor: juntarNomes(coracao), valor: `${coracao[0].naoPontua} sem pontos`, detalhe: "Mais prognósticos sem qualquer ponto" },
  ];
}

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
  const especialista = maxByAll(comRacio, p => p.gsShare);
  const rei = maxByAll(comRacio, p => p.koShare);
  return [
    { id: "especialista-grupos", icon: "📚", titulo: "Especialista de Grupos", vencedor: juntarNomes(especialista), valor: `${Math.round(especialista[0].gsShare * 100)}% dos pontos`, detalhe: "Maior fatia dos pontos vem da fase de grupos" },
    { id: "rei-mata-mata", icon: "🗡️", titulo: "Rei do Mata-Mata", vencedor: juntarNomes(rei), valor: `${Math.round(rei[0].koShare * 100)}% dos pontos`, detalhe: "Maior fatia dos pontos vem do mata-mata" },
  ];
}

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
  const imparavel = maxByAll(comSequencias, p => p.imparavel);
  const seca = maxByAll(comSequencias, p => p.seca);
  return [
    { id: "sequencia-imparavel", icon: "🔥", titulo: "Sequência Imparável", vencedor: imparavel[0].imparavel > 0 ? juntarNomes(imparavel) : null, valor: `${imparavel[0].imparavel} jogos seguidos`, detalhe: "Mais jogos seguidos a pontuar" },
    { id: "seca", icon: "🧊", titulo: "Seca", vencedor: seca[0].seca > 0 ? juntarNomes(seca) : null, valor: `${seca[0].seca} jogos seguidos`, detalhe: "Mais jogos seguidos sem pontuar" },
  ];
}

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

// 9-10: Maior Subida / Maior Queda / Montanha-Russa
function calcTendencias(classHistory) {
  const porDecidirArray = [
    { id: "maior-subida", icon: "📈", titulo: "Maior Subida", vencedor: null, valor: "—", detalhe: "Por decidir — falta histórico" },
    { id: "maior-queda", icon: "📉", titulo: "Maior Queda", vencedor: null, valor: "—", detalhe: "Por decidir — falta histórico" },
    { id: "montanha-russa", icon: "🎢", titulo: "Montanha-Russa", vencedor: null, valor: "—", detalhe: "Por decidir — falta histórico" },
  ];

  if (classHistory.length < 2) {
    return porDecidirArray;
  }
  const primeiro = classHistory[0].ranking;
  const ultimo = classHistory[classHistory.length - 1].ranking;
  const posPrimeiro = {};
  primeiro.forEach(r => { posPrimeiro[r.nome] = r.pos; });
  const deltas = ultimo.map(r => ({ nome: r.nome, delta: (posPrimeiro[r.nome] ?? r.pos) - r.pos }));
  const subida = maxByAll(deltas, d => d.delta);
  const queda = minByAll(deltas, d => d.delta);

  // Guard against empty deltas array (maxByAll/minByAll devolvem [])
  if (!subida.length || !queda.length) {
    return porDecidirArray;
  }

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
  const montanhaRussa = comDesvio.length ? maxByAll(comDesvio, p => p.desvio) : [];

  return [
    { id: "maior-subida", icon: "📈", titulo: "Maior Subida", vencedor: subida[0].delta > 0 ? juntarNomes(subida) : null, valor: `${Math.max(subida[0].delta, 0)} posições`, detalhe: "Desde o primeiro registo até agora" },
    { id: "maior-queda", icon: "📉", titulo: "Maior Queda", vencedor: queda[0].delta < 0 ? juntarNomes(queda) : null, valor: `${Math.max(-queda[0].delta, 0)} posições`, detalhe: "Desde o primeiro registo até agora" },
    { id: "montanha-russa", icon: "🎢", titulo: "Montanha-Russa", vencedor: montanhaRussa.length ? juntarNomes(montanhaRussa) : null, valor: montanhaRussa.length ? `desvio de ${montanhaRussa[0].desvio.toFixed(1)}` : "—", detalhe: "Posição mais instável ao longo do tempo" },
  ];
}

// 11-14: Kamikaze / Betão Armado / Fã de Empates / Nunca Sofre
function calcEstiloApostador(jogosGrupos, previsoesGrupos) {
  const porDecidirArray = [
    { id: "kamikaze", icon: "🎰", titulo: "Kamikaze", vencedor: null, valor: "—", detalhe: "Por decidir — faltam prognósticos" },
    { id: "betao-armado", icon: "🛡️", titulo: "Betão Armado", vencedor: null, valor: "—", detalhe: "Por decidir — faltam prognósticos" },
    { id: "fa-de-empates", icon: "⚖️", titulo: "Fã de Empates", vencedor: null, valor: "—", detalhe: "Por decidir — faltam prognósticos" },
    { id: "nunca-sofre", icon: "🥅", titulo: "Nunca Sofre", vencedor: null, valor: "—", detalhe: "Por decidir — faltam prognósticos" },
  ];

  if (!previsoesGrupos.length) return porDecidirArray;

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

  if (!porParticipante.length) return porDecidirArray;

  const kamikaze = maxByAll(porParticipante, p => p.mediaGolos);
  const betao = minByAll(porParticipante, p => p.mediaGolos);
  const faDeEmpates = maxByAll(porParticipante, p => p.empates);
  const nuncaSofre = maxByAll(porParticipante, p => p.nuncaSofreCount);

  return [
    { id: "kamikaze", icon: "🎰", titulo: "Kamikaze", vencedor: juntarNomes(kamikaze), valor: `${kamikaze[0].mediaGolos.toFixed(1)} golos/jogo`, detalhe: "Maior média de golos previstos por jogo" },
    { id: "betao-armado", icon: "🛡️", titulo: "Betão Armado", vencedor: juntarNomes(betao), valor: `${betao[0].mediaGolos.toFixed(1)} golos/jogo`, detalhe: "Menor média de golos previstos por jogo" },
    { id: "fa-de-empates", icon: "⚖️", titulo: "Fã de Empates", vencedor: faDeEmpates[0].empates > 0 ? juntarNomes(faDeEmpates) : null, valor: `${faDeEmpates[0].empates} empates previstos`, detalhe: "Mais prognósticos de empate" },
    { id: "nunca-sofre", icon: "🥅", titulo: "Nunca Sofre", vencedor: nuncaSofre[0].nuncaSofreCount > 0 ? juntarNomes(nuncaSofre) : null, valor: `${nuncaSofre[0].nuncaSofreCount} vezes`, detalhe: "Mais vezes a acertar uma equipa a sofrer 0 golos" },
  ];
}

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
  const bola = maxByAll(porParticipante, p => p.taxa);
  const zica = minByAll(porParticipante, p => p.taxa);
  return [
    { id: "bola-de-cristal", icon: "🔮", titulo: "Bola de Cristal", vencedor: juntarNomes(bola), valor: `${Math.round(bola[0].taxa * 100)}% (${bola[0].acertos}/${bola[0].total})`, detalhe: "Melhor taxa de acerto em quem passa no mata-mata" },
    { id: "zica", icon: "💀", titulo: "Zica", vencedor: juntarNomes(zica), valor: `${Math.round(zica[0].taxa * 100)}% (${zica[0].acertos}/${zica[0].total})`, detalhe: "Pior taxa de acerto em quem passa no mata-mata" },
  ];
}

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
  const fora = minByAll(comTaxa, p => p.taxa);
  const voz = maxByAll(comTaxa, p => p.taxa);
  return [
    { id: "fora-da-manada", icon: "🐑", titulo: "Fora da Manada", vencedor: juntarNomes(fora), valor: `${Math.round(fora[0].taxa * 100)}% igual à malta`, detalhe: "Previsões mais diferentes do consenso geral" },
    { id: "voz-da-malta", icon: "🤝", titulo: "Voz da Malta", vencedor: juntarNomes(voz), valor: `${Math.round(voz[0].taxa * 100)}% igual à malta`, detalhe: "Previsões mais alinhadas com o consenso geral" },
  ];
}

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
  const entradas = Object.entries(contagem).map(([nome, vezes]) => ({ nome, vezes }));
  if (!entradas.length) {
    return { id: "habitue-jantar", icon: "🍽️", titulo: "Habitué do Jantar", vencedor: null, valor: "0 vezes", detalhe: "Ninguém esteve na metade que paga ainda" };
  }
  const top = maxByAll(entradas, e => e.vezes);
  return { id: "habitue-jantar", icon: "🍽️", titulo: "Habitué do Jantar", vencedor: juntarNomes(top), valor: `${top[0].vezes}x na metade que paga`, detalhe: "Mais vezes na metade que paga o jantar, ao longo da época" };
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

if (typeof module !== "undefined") {
  module.exports = {
    maxBy, minBy, maxByAll, minByAll, juntarNomes,
    calcSniperECoracaoDePedra, calcEspecialistas, calcSequencias,
    calcTotalExatos, calcDistribuicaoMalta, calcTendencias, calcEstiloApostador,
    calcBolaDeCristal, calcContraManada, calcHabitueJantar, calcCuriosidades,
    buildPresentationOrder,
  };
}
