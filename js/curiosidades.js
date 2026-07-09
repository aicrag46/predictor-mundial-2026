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
