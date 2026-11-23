// Ember Court — the duel at the table: court state, turn flow, input, and the round loop.
// The rulebook lives in rules.js, the Queen's judgement in ai.js, the painting in render.js.
// This pass also guards the Flow trail in scripted rounds, the way the live duel does.

import { mulberry32, shuffleDeck, buildDeck } from './deck.js';
import { resolveRound, applyOutcome, HAND_SIZE, START_LIFE } from './rules.js';
import { queenTell, chooseCard } from './ai.js';
import * as render from './render.js';
import * as sound from './sound.js';
import { runShot } from './shots.js';

// Every control on the table, grabbed once so the duel never hunts the DOM twice.
const els = {
  roundBadge: document.getElementById('roundBadge'),
  flowBadge: document.getElementById('flowBadge'),
  rivalHpFill: document.getElementById('rivalHpFill'),
  rivalHpText: document.getElementById('rivalHpText'),
  playerHpFill: document.getElementById('playerHpFill'),
  playerHpText: document.getElementById('playerHpText'),
  rivalRounds: document.getElementById('rivalRounds'),
  rivalTell: document.getElementById('rivalTell'),
  playerRounds: document.getElementById('playerRounds'),
  rivalHand: document.getElementById('rivalHand'),
  playerHand: document.getElementById('playerHand'),
  rivalDeck: document.getElementById('rivalDeckCount'),
  playerDeck: document.getElementById('playerDeckCount'),
  rivalSlot: document.getElementById('rivalCardSlot'),
  playerSlot: document.getElementById('playerCardSlot'),
  roundResult: document.getElementById('roundResult'),
  floatLayer: document.getElementById('floatLayer'),
  logList: document.getElementById('logList'),
  handHint: document.getElementById('handHint'),
  titleScreen: document.getElementById('titleScreen'),
  helpScreen: document.getElementById('helpScreen'),
  endScreen: document.getElementById('endScreen'),
  endEmblem: document.getElementById('endEmblem'),
  endTitle: document.getElementById('endTitle'),
  endLine: document.getElementById('endLine'),
  endStats: document.getElementById('endStats'),
  status: document.getElementById('status'),
  soundBtn: document.getElementById('soundBtn'),
};

// The whole duel in one place: screen, round, life, hands, decks, and the
// trail of the last round (needed for Flow and Surge). shots.js reaches in
// here directly, so these field names are part of the game's surface.
const state = {
  screen: 'title', // title | playing | won | lost
  round: 1,
  life: { you: START_LIFE, rival: START_LIFE },
  roundsWon: { you: 0, rival: 0 },
  yourHand: [],
  rivalHand: [],
  yourDeck: [],
  rivalDeck: [],
  yourDiscard: [],
  rivalDiscard: [],
  yourLastElement: null,
  rivalLastElement: null,
  youLostLast: false,
  rivalLostLast: false,
  resolving: false,
  rand: Math.random,
  stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0 },
};

// Pull one card from a deck, reshuffling the discard pile when the deck is dry.
function pullCard(hand, deck, discard, rand) {
  if (deck.length === 0) {
    if (discard.length === 0) return;
    deck.push(...shuffleDeck(discard.splice(0), rand));
  }
  hand.push(deck.pop());
}

// Both sides draw their opening hands, one card at a time, alternating.
function dealOpeningHands() {
  for (let i = 0; i < HAND_SIZE; i++) {
    pullCard(state.yourHand, state.yourDeck, state.yourDiscard, state.rand);
    pullCard(state.rivalHand, state.rivalDeck, state.rivalDiscard, state.rand);
  }
}

// Repaint every corner of the table from the current state.
function paintTable() {
  render.renderLife(els.playerHpFill, els.playerHpText, state.life.you);
  render.renderLife(els.rivalHpFill, els.rivalHpText, state.life.rival);
  render.renderRounds(els.playerRounds, els.rivalRounds, state.roundsWon.you, state.roundsWon.rival);
  els.rivalTell.textContent = state.screen === 'playing'
    ? queenTell(state.life.rival, state.life.you)
    : 'She studies your hand, weighing her next card.';
  render.renderRivalHand(els.rivalHand, state.rivalHand.length);
  render.renderHand(els.playerHand, state.yourHand, throwCard, state.resolving || state.screen !== 'playing');
  render.renderDeckCounts(els.playerDeck, els.rivalDeck, state.yourDeck.length, state.rivalDeck.length);
  render.renderRoundBadge(els.roundBadge, state.round);
  render.renderFlowBadge(els.flowBadge, state.yourLastElement);
  els.handHint.textContent = state.screen === 'playing'
    ? (state.resolving ? 'The cards are revealed…' : 'Pick a card to duel — click it or press 1–5')
    : 'Pick a card to duel — click it or press 1–5';
}

function note(lines) {
  render.addLog(els.logList, lines);
}

// Set up a fresh duel: seeded when a screenshot asks for one, wild otherwise.
function beginDuel(seed) {
  state.rand = seed === undefined ? Math.random : mulberry32(seed);
  state.screen = 'playing';
  state.round = 1;
  state.life = { you: START_LIFE, rival: START_LIFE };
  state.roundsWon = { you: 0, rival: 0 };
  state.yourHand = [];
  state.rivalHand = [];
  state.yourDeck = shuffleDeck(buildDeck(), state.rand);
  state.rivalDeck = shuffleDeck(buildDeck(), state.rand);
  state.yourDiscard = [];
  state.rivalDiscard = [];
  state.yourLastElement = null;
  state.rivalLastElement = null;
  state.youLostLast = false;
  state.rivalLostLast = false;
  state.resolving = false;
  state.stats = { damageDealt: 0, damageTaken: 0, cardsPlayed: 0 };
  els.rivalSlot.innerHTML = '<span class="slot-hint">Rival plays here</span>';
  els.playerSlot.innerHTML = '<span class="slot-hint">Your card goes here</span>';
  els.roundResult.innerHTML = '';
  els.logList.innerHTML = '';
  dealOpeningHands();
  render.hideOverlay(els.titleScreen);
  render.hideOverlay(els.endScreen);
  note(['Welcome to the Ember Court. The Queen awaits your first card.']);
  paintTable();
  sound.playDeal();
  render.announce(els.status, 'Duel started. Your life 30, Queen Cinder 30.');
}

// The duel is over: show the final screen with the tale of the tape.
function closeDuel(won) {
  state.screen = won ? 'won' : 'lost';
  const tale = [
    [state.round - 1, 'rounds'],
    [state.stats.cardsPlayed, 'cards played'],
    [state.stats.damageDealt, 'damage dealt'],
    [state.stats.damageTaken, 'damage taken'],
  ];
  render.renderEndScreen(
    { emblem: els.endEmblem, title: els.endTitle, line: els.endLine, stats: els.endStats },
    won, tale,
  );
  render.showOverlay(els.endScreen);
  if (won) sound.playWin(); else sound.playLose();
  render.announce(els.status, won ? 'You win the court!' : 'The Queen keeps the court.');
}

function emptySlot(slot) { slot.innerHTML = ''; }

// The player commits a card. The Queen answers at once; the reveal is staged
// so her card stays face down for a beat, then both flip together.
function throwCard(index) {
  if (state.screen !== 'playing' || state.resolving) return;
  if (index < 0 || index >= state.yourHand.length) return;
  state.resolving = true;
  const yourCard = state.yourHand.splice(index, 1)[0];
  const rivalCard = chooseCard(state.rivalHand, {
    myLife: state.life.rival,
    yourLife: state.life.you,
    myLastElement: state.rivalLastElement,
    yourLastElement: state.yourLastElement,
    iLostLast: state.rivalLostLast,
    youLostLast: state.youLostLast,
  }, state.rand);
  state.rivalHand.splice(state.rivalHand.indexOf(rivalCard), 1);
  state.stats.cardsPlayed++;

  emptySlot(els.playerSlot);
  emptySlot(els.rivalSlot);
  const yourNode = render.cardElement(yourCard);
  yourNode.classList.add('played');
  els.playerSlot.appendChild(yourNode);
  els.rivalSlot.appendChild(render.cardBackElement());
  sound.playFlip();
  paintTable();

  setTimeout(() => {
    const rivalNode = render.cardElement(rivalCard);
    rivalNode.classList.add('played');
    els.rivalSlot.replaceChildren(rivalNode);
    sound.playFlip();

    const outcome = resolveRound(yourCard, rivalCard, {
      yourLastElement: state.yourLastElement,
      rivalLastElement: state.rivalLastElement,
      youLostLast: state.youLostLast,
      rivalLostLast: state.rivalLostLast,
    });

    setTimeout(() => settleRound(yourCard, rivalCard, outcome), 650);
  }, 550);
}

// The round is decided: apply damage, glow the winner, float the numbers,
// remember what happened for the next round, then deal the next one.
function settleRound(yourCard, rivalCard, outcome) {
  const before = { ...state.life };
  state.life = applyOutcome(state.life, outcome);
  state.stats.damageDealt += outcome.damageToRival + outcome.barbsToRival;
  state.stats.damageTaken += outcome.damageToYou + outcome.barbsToYou;

  if (outcome.winner === 'you') {
    els.playerSlot.firstChild?.classList.add('winner-glow');
    state.roundsWon.you++;
    sound.playHit();
  } else if (outcome.winner === 'rival') {
    els.rivalSlot.firstChild?.classList.add('winner-glow');
    state.roundsWon.rival++;
    sound.playHit();
  }
  if (outcome.damageToRival > 0) render.floatText(els.floatLayer, '-' + outcome.damageToRival, 'float-dmg', 62, 30);
  if (outcome.damageToYou > 0) render.floatText(els.floatLayer, '-' + outcome.damageToYou, 'float-dmg', 30, 62);
  if (outcome.barbsToRival > 0) render.floatText(els.floatLayer, '-' + outcome.barbsToRival + ' barbs', 'float-dmg', 62, 42);
  if (outcome.barbsToYou > 0) render.floatText(els.floatLayer, '-' + outcome.barbsToYou + ' barbs', 'float-dmg', 30, 50);
  if (outcome.healYou > 0) { render.floatText(els.floatLayer, '+' + outcome.healYou, 'float-heal', 30, 55); sound.playHeal(); }
  if (outcome.healRival > 0) { render.floatText(els.floatLayer, '+' + outcome.healRival, 'float-heal', 62, 35); sound.playHeal(); }

  state.yourDiscard.push(yourCard);
  state.rivalDiscard.push(rivalCard);
  // Court specials carry no element of their own: they leave the Flow trail
  // untouched, so the bonus survives into the next round.
  state.yourLastElement = yourCard.element === 'special' ? state.yourLastElement : yourCard.element;
  state.rivalLastElement = rivalCard.element === 'special' ? state.rivalLastElement : rivalCard.element;
  state.youLostLast = outcome.winner === 'rival';
  state.rivalLostLast = outcome.winner === 'you';

  render.renderRoundResult(els.roundResult, outcome);
  note(outcome.lines);
  render.announce(els.status, 'Life — you ' + state.life.you + ', Queen ' + state.life.rival + '.');

  if (state.life.rival <= 0 || state.life.you <= 0) {
    state.resolving = false;
    paintTable();
    setTimeout(() => closeDuel(state.life.rival <= 0 && state.life.you > 0), 900);
    return;
  }

  // Next round: each side draws, and a tied round draws one extra card each.
  state.round++;
  pullCard(state.yourHand, state.yourDeck, state.yourDiscard, state.rand);
  pullCard(state.rivalHand, state.rivalDeck, state.rivalDiscard, state.rand);
  if (outcome.winner === null) {
    pullCard(state.yourHand, state.yourDeck, state.yourDiscard, state.rand);
    pullCard(state.rivalHand, state.rivalDeck, state.rivalDiscard, state.rand);
  }
  state.resolving = false;
  paintTable();
}

// ---- wiring the table ----
document.getElementById('startBtn').addEventListener('click', () => { sound.playClick(); beginDuel(); });
document.getElementById('againBtn').addEventListener('click', () => { sound.playClick(); beginDuel(); });
document.getElementById('helpBtn').addEventListener('click', () => { sound.playClick(); render.showOverlay(els.helpScreen); });
document.getElementById('closeHelpBtn').addEventListener('click', () => { sound.playClick(); render.hideOverlay(els.helpScreen); });
els.soundBtn.addEventListener('click', () => {
  sound.setMuted(!sound.isMuted());
  els.soundBtn.textContent = 'Sound: ' + (sound.isMuted() ? 'off' : 'on');
});
document.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '5') throwCard(Number(e.key) - 1);
  else if (e.key === 'h' || e.key === 'H') render.showOverlay(els.helpScreen);
  else if (e.key === 'm' || e.key === 'M') els.soundBtn.click();
  else if (e.key === 'Escape') render.hideOverlay(els.helpScreen);
});

// ---- screenshot scenes: ?shot=title|play|win|loss&seed=N ----
// The handle shots.js drives: the same state the player sees, plus a
// timer-free round so a scene can be staged in one call.
export const game = {
  state,
  startDuel: beginDuel,
  endDuel: closeDuel,
  renderAll: paintTable,
  log: note,
  els,
  playScripted(yourCard, rivalCard) {
    // Lay both cards out in the arena and settle them at once, no timers.
    emptySlot(els.playerSlot);
    emptySlot(els.rivalSlot);
    const yn = render.cardElement(yourCard);
    const rn = render.cardElement(rivalCard);
    els.playerSlot.appendChild(yn);
    els.rivalSlot.appendChild(rn);
    const outcome = resolveRound(yourCard, rivalCard, {
      yourLastElement: state.yourLastElement,
      rivalLastElement: state.rivalLastElement,
      youLostLast: state.youLostLast,
      rivalLostLast: state.rivalLostLast,
    });
    state.life = applyOutcome(state.life, outcome);
    if (outcome.winner === 'you') { yn.classList.add('winner-glow'); state.roundsWon.you++; }
    if (outcome.winner === 'rival') { rn.classList.add('winner-glow'); state.roundsWon.rival++; }
    state.yourDiscard.push(yourCard);
    state.rivalDiscard.push(rivalCard);
    // Same guard as the live duel: a Court special must not overwrite the
    // Flow trail, or the next round's bonus dies without a sound.
    state.yourLastElement = yourCard.element === 'special' ? state.yourLastElement : yourCard.element;
    state.rivalLastElement = rivalCard.element === 'special' ? state.rivalLastElement : rivalCard.element;
    render.renderRoundResult(els.roundResult, outcome);
    note(outcome.lines);
    paintTable();
    return outcome;
  },
};

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  const seed = Number(params.get('seed') || '7');
  runShot(shot, seed, game);
} else {
  paintTable();
}
