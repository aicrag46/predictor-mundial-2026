// ─── SCORING (partilhado app + testes) ───────────────────────────────────────
const KO_PONTOS = {
  r32: { exato: 7,  ve: 3,  golos: 1, qual: 3  },
  r16: { exato: 10, ve: 4,  golos: 2, qual: 5  },
  qf:  { exato: 15, ve: 6,  golos: 3, qual: 10 },
  sf:  { exato: 20, ve: 8,  golos: 4, qual: 15 },
  tp:  { exato: 25, ve: 10, golos: 5, qual: 15 },
  f:   { exato: 35, ve: 15, golos: 6, qual: 15 },
};

function vit(a, b) { return a > b ? "c" : b > a ? "f" : "e"; }

function getTipo(pgc, pgf, rgc, rgf) {
  if (rgc === null || rgc === undefined) return "Pendente";
  if (pgc === rgc && pgf === rgf) return "Exato";
  if (vit(pgc, pgf) === vit(rgc, rgf)) return "Vencedor/Empate";
  if (pgc === rgc || pgf === rgf) return "Golos Equipa";
  return "Não Pontuou";
}

function getPontos(tipo) {
  return { Exato: 5, "Vencedor/Empate": 2, "Golos Equipa": 1, "Não Pontuou": 0, Pendente: 0 }[tipo] ?? 0;
}

function calcKO(roundId, pgc, pgf, pqual, rgc, rgf, rqual) {
  if (rgc === null || rgc === undefined) {
    return { tipoScore: "Pendente", scorePts: 0, qualMatch: false, qualPts: 0, pts: 0 };
  }
  const tbl = KO_PONTOS[roundId] || KO_PONTOS.r32;
  const tipoScore = getTipo(pgc, pgf, rgc, rgf);
  const scorePts = { Exato: tbl.exato, "Vencedor/Empate": tbl.ve, "Golos Equipa": tbl.golos, "Não Pontuou": 0, Pendente: 0 }[tipoScore] ?? 0;
  const qualMatch = Boolean(rqual && pqual && pqual === rqual);
  const qualPts = qualMatch ? tbl.qual : 0;
  return { tipoScore, scorePts, qualMatch, qualPts, pts: scorePts + qualPts };
}

function getTipoKO(pgc, pgf, pqual, rgc, rgf, rqual) {
  return calcKO("r32", pgc, pgf, pqual, rgc, rgf, rqual).tipoScore;
}

if (typeof module !== "undefined") module.exports = { KO_PONTOS, vit, getTipo, getPontos, calcKO, getTipoKO };
