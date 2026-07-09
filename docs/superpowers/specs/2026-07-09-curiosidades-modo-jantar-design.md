# Curiosidades + Modo Jantar com suspense

Data: 2026-07-09

## Objetivo

Dar vida à app durante o resto do campeonato com uma tab de estatísticas
divertidas ("prémios") sobre o desempenho dos jogadores, sempre visível e
atualizada ao vivo — e usar os mesmos dados para dar suspense real ao Modo
Jantar existente, que hoje é só uma lista plana 1º→último.

Não é preciso guardar nenhum dado novo: tudo deriva de `resultados`,
`gsOv` (overrides de prognóstico), `getKOPredsAll()`, `getMataMata()` e do
`CLASS_HISTORY` que já existe (snapshots de posição/pontos ao longo do
tempo, gravados em cada sync da API).

## Arquitetura

- Nova tab de topo **"🏆 Curiosidades"**, junto a Regras/WhatsApp no menu
  "Mais" (mobile) e na nav principal (desktop) — mesmo padrão das tabs
  existentes (`switchTab`, `renderTab`).
- Nova função pura `calcCuriosidades(resultados, gsOv, mm, koP, classHistory)`
  em `js/features.js` (ou novo `js/curiosidades.js` se ficar grande) que
  devolve um array de objetos prémio:
  `{ id, icon, titulo, vencedor, valor, detalhe }`.
- A tab de Curiosidades e o Modo Jantar **partilham esta mesma função** —
  o Modo Jantar só pega em 3-4 prémios dessa lista para intercalar como
  slides.
- Renderização como grelha de cartões ("cromos"), não tabela — cada cartão
  mostra ícone, título do prémio, nome do vencedor e o valor/stat.
- Atualiza sempre que `renderTab('curiosidades')` corre (mesmo padrão das
  outras tabs, recalculado a cada render — sem cache).

## Conteúdo — 20 prémios (em 18 categorias/números, 2 números agrupam um par)

**Melhor / Pior**
1. 🎯 **Sniper** — mais "Exato" (soma fase de grupos + mata-mata). Fonte:
   `calcParticipante(...).exatos` (já agregado).
2. 🥶 **Coração de Pedra** — mais prognósticos "Não Pontuou"
   (`.naoPontua`).
3. 📚 **Especialista de Grupos** / 🗡️ **Rei do Mata-Mata** — maior rácio
   `gsPts/(gsPts+koPts)` vs `koPts/(gsPts+koPts)`. Só entra em jogo quando
   pelo menos um jogador tem `koPts > 0`; até lá mostra "por decidir".

**Sequências** (por participante, percorrendo fase de grupos por código
`A1..L6` e depois mata-mata por ronda `r32→r16→qf→sf→tp→f` e índice)
4. 🔥 **Sequência Imparável** — maior nº de jogos seguidos com resultado
   conhecido em que o tipo não é "Não Pontuou"/"Nada".
5. 🧊 **Seca** — maior nº de jogos seguidos com resultado conhecido em que
   o tipo é "Não Pontuou"/"Nada".
   (Jogos sem resultado ainda são ignorados na sequência, não a
   interrompem nem contam.)

**Números da malta** (agregado de todos os participantes)
6. ⚡ **Total de Exatos da competição** — soma de `.exatos` de todos, com
   `%` sobre o total de oportunidades (`jogosComResultado × nParticipantes`).
7. 🌍 **Distribuição da malta** — contagem agregada Exato/VE/Golos/Nada
   somando todos os participantes, mostrada como barra/lista de %.

**Tendência** (usa `CLASS_HISTORY`, precisa de ≥2 snapshots)
8. 📈 **Maior Subida** / 📉 **Maior Queda** — `posPrimeiroSnapshot -
   posUltimoSnapshot` por participante; máximo positivo = subida, mínimo
   (mais negativo) = queda.
9. 🎢 **Montanha-Russa** — participante com maior desvio-padrão de `pos`
   ao longo de todos os snapshots disponíveis.

**Estilo de apostador**
10. 🎰 **Kamikaze** — maior média de `pgc+pgf` (golos totais previstos)
    por jogo, considerando as previsões de fase de grupos.
11. 🛡️ **Betão Armado** — menor média de `pgc+pgf` previstos.
12. ⚖️ **Fã de Empates** — mais previsões com `pgc === pgf`.
13. 🥅 **Nunca Sofre** — mais previsões corretas de uma equipa a sofrer 0
    golos (previu 0 e a equipa realmente fez 0 nesse jogo).

**Mata-mata específico**
14. 🔮 **Bola de Cristal** — melhor taxa de acerto no campo "Apurado"
    (qualifier) do mata-mata, só contando jogos já decididos. Mínimo de 3
    jogos decididos para entrar no prémio (evita ruído no início).
15. 💀 **Zica** — pior taxa de acerto no "Apurado" (mesmo critério mínimo).

**Contra a manada** (só fase de grupos, por ser onde há mais previsões
por jogo; por cada jogo com ≥4 previsões submetidas, calcula o par
`pgc-pgf` mais comum entre a malta — a moda; empate na moda resolve-se
pelo primeiro encontrado, de forma determinística)
16. 🐑 **Fora da Manada** — menor % de jogos em que a previsão de um
    participante coincide exatamente com a moda desse jogo.
17. 🤝 **Voz da Malta** — maior % de coincidência com a moda.

**Ligado ao jantar**
18. 🍽️ **Habitué do Jantar** — participante que mais vezes esteve na
    metade que paga (`paga === true`) ao longo dos snapshots do
    `CLASS_HISTORY`.

(Nota: a lista tem 20 prémios individuais no total — números 3 e "8"
(Maior Subida/Maior Queda) agrupam 2 prémios cada, os restantes são 1
prémio por número. Números 1-9 e 18 vêm da primeira leva aprovada, 10-17
da segunda.)

**Fora de scope (não entra nesta versão):** qualquer prémio que precise
de timestamp por prognóstico (ex.: "mais rápido a prognosticar") — não
existe esse campo hoje em `gsOv`/`koPreds`, e adicionar isso é trabalho à
parte.

## Modo Jantar — mecânica de suspense

Estado atual (`js/features.js:237-277`): `renderPresentationSlide` gera
slides na ordem `cls` (1º ao último) e mostra posição+pontos+paga de
imediato, um clique = um slide.

A fronteira entre quem paga e quem não paga (posição `half`/`half+1`,
onde `half = Math.floor(nParticipantes/2)`, ex. 5º/6º com 10
participantes) é o momento de maior peso emocional do grupo — mais do
que saber quem é campeão — por isso fica reservada para o **clímax
final**, depois até do próprio campeão.

Novo fluxo, em 4 fases:

**Fase A — pior bloco** (últimas posições até logo acima da fronteira,
ex. 10º→7º com 10 participantes): revela do último lugar para cima,
claramente "paga o jantar", sem ainda mexer na fronteira.
1. **Revelação em 2 tempos por pessoa** — 1º clique nessa posição mostra
   só "posição + nome" (nome pode entrar com efeito de blur→foco); 2º
   clique no mesmo slide revela pontos + badge paga/não paga.
2. **Slides de prémio intercalados** — a cada 2-3 posições reveladas,
   insere um slide vindo de `calcCuriosidades()` (ex. Sniper, Kamikaze,
   Fora da Manada — escolhidos por ordem fixa, não aleatória, para ser
   previsível ao testar).

**Fase B — bloco de cima, sem a fronteira** (da posição logo acima da
fronteira até ao 2º lugar, ex. 4º→2º): mesma mecânica de revelação em 2
tempos + prémios intercalados.

**Fase C — campeão**: slide próprio em ecrã inteiro com animação de
confetti (CSS), distinto dos slides normais — celebra o 1º lugar, mas
**não é o fim** da apresentação.

**Fase D — a fronteira, clímax final**: revela primeiro a posição
`half+1` ("quem paga o jantar hoje", com pequena animação/emoji cómico
em vez do badge estático atual) e só depois, como último slide de
sempre, a posição `half` ("quem escapou por um triz"). Esta fase tem
layout de destaque próprio (maior que os slides normais, mais próximo do
slide de campeão em impacto visual).

Tudo client-side (CSS/JS), sem infraestrutura nova — a única peça nova de
verdade é o gerador de slides de prémio, que consome
`calcCuriosidades()`.

## Testes

- Testes unitários (padrão `tests/scoring.test.js`) para
  `calcCuriosidades`: casos com dados mínimos (1-2 jogos com resultado),
  empates entre participantes (deve escolher um de forma determinística,
  não crashar), e o caso de `CLASS_HISTORY` vazio ou com 1 snapshot só
  (prémios de tendência devem ficar "por decidir", não rebentar).
- Verificação manual no browser: tab Curiosidades com os dados reais
  atuais da competição, e um percurso completo do Modo Jantar revisto.
