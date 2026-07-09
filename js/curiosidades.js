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

if (typeof module !== "undefined") {
  module.exports = { maxBy, minBy, calcSniperECoracaoDePedra, calcEspecialistas };
}
