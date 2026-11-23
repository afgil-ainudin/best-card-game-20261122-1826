// Ember Court — staged screenshot scenes (?shot=title|play|win|loss&seed=N).
// Each scene is a genuine state of the same game code: the same deck, the
// same painters, the same veils the player sees. Seeded, so every shot
// comes out identical on each run.

import { buildDeck, cardById, shuffleDeck, mulberry32 } from './deck.js';
import * as render from './render.js';

// A hand built from card ids, fresh copies so scenes never share objects.
function cardsFromIds(ids) {
  return ids.map((id) => ({ ...cardById(id) }));
}

export function runShot(shot, seed, game) {
  const { state, els } = game;
  const rng = mulberry32(seed);

  if (shot === 'title') {
    game.startDuel(seed);
    // The title veil rests over a table that has just been dealt.
    render.showOverlay(els.titleScreen);
    return;
  }

  if (shot === 'play') {
    game.startDuel(seed);
    state.round = 6;
    state.life = { you: 26, rival: 18 };
    state.roundsWon = { you: 3, rival: 2 };
    state.yourLastElement = 'flame';
    state.yourHand = cardsFromIds(['phoenix-queen', 'tidecaller', 'thorn-wolf', 'mirror-wisp', 'storm-sage']);
    state.rivalHand = cardsFromIds(['moon-jelly', 'rose-golem', 'gale-runner', 'ember-golem', 'vine-archer']);
    state.yourDeck = shuffleDeck(buildDeck(), rng).slice(0, 14);
    state.rivalDeck = shuffleDeck(buildDeck(), rng).slice(0, 15);
    // Earlier rounds first: they settle below the round about to be played.
    render.addLog(els.logList, [
      'Round 4: her Tidecaller soothed the Queen (+3 life).',
      'Round 5: your Flame Knight beat her Bramble Pup — 4 damage.',
    ]);
    // A round already under way: both cards revealed, yours ahead.
    game.playScripted({ ...cardById('inferno-drake') }, { ...cardById('coral-guard') });
    return;
  }

  if (shot === 'win') {
    game.startDuel(seed);
    state.round = 9;
    state.life = { you: 14, rival: 0 };
    state.roundsWon = { you: 5, rival: 3 };
    state.stats = { damageDealt: 34, damageTaken: 16, cardsPlayed: 9 };
    state.yourHand = cardsFromIds(['phoenix-queen', 'tidecaller', 'thorn-wolf', 'mirror-wisp', 'storm-sage']);
    state.rivalHand = cardsFromIds(['moon-jelly', 'rose-golem', 'gale-runner']);
    game.renderAll();
    game.endDuel(true);
    return;
  }

  if (shot === 'loss') {
    game.startDuel(seed);
    state.round = 11;
    state.life = { you: 0, rival: 9 };
    state.roundsWon = { you: 4, rival: 6 };
    state.stats = { damageDealt: 21, damageTaken: 30, cardsPlayed: 11 };
    state.yourHand = cardsFromIds(['dew-sprite', 'bramble-pup', 'spark-mouse']);
    state.rivalHand = cardsFromIds(['phoenix-queen', 'moon-jelly', 'rose-golem', 'storm-sage']);
    game.renderAll();
    game.endDuel(false);
    return;
  }

  // An unknown scene name: fall back to the title veil.
  game.startDuel(seed);
  render.showOverlay(els.titleScreen);
}
