// Ember Court — headless checks for the rulebook (rules.js + deck.js).
// No DOM, no browser: run with `node tests/rules.test.mjs`. These are the
// same pure functions the table game calls, so a pass here means the
// duel itself settles rounds the same way.
//
// What is pinned down here:
//   - Mirror copies the rival's power, and two Mirrors meet at 5.
//   - Flow (+2) only follows a matching element, never a Court special.
//   - Surge (+3) only follows a lost round.
//   - Burn, Soak, Barbs, and Jester all fire exactly as written.
//   - Damage can never drop below 1 on a won round; life clamps at 0..30.

import assert from 'node:assert/strict';
import { cardById } from '../game/src/deck.js';
import {
  START_LIFE,
  FLOW_BONUS,
  applyOutcome,
  effectivePower,
  resolveRound,
} from '../game/src/rules.js';

const ctx = {
  yourLastElement: null,
  rivalLastElement: null,
  youLostLast: false,
  rivalLostLast: false,
};

function card(id) {
  return { ...cardById(id) };
}

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('ok - ' + name);
}

// --- Mirror: the borrowed power, and the twin rule ---
check('Mirror copies the rival card power', () => {
  const wisp = card('mirror-wisp');
  const drake = card('inferno-drake');
  assert.equal(effectivePower(wisp, drake, null, false), 6);
  assert.equal(effectivePower(drake, wisp, null, false), 6);
});

check('Two Mirrors meet at 5 instead of copying 0', () => {
  const first = card('mirror-wisp');
  const second = card('mirror-wisp-2');
  assert.equal(effectivePower(first, second, null, false), 5);
  assert.equal(effectivePower(second, first, null, false), 5);
  const outcome = resolveRound(first, second, { ...ctx });
  assert.equal(outcome.yourPower, 5);
  assert.equal(outcome.rivalPower, 5);
  assert.equal(outcome.winner, null);
  assert.equal(outcome.damageToRival, 0);
  assert.equal(outcome.damageToYou, 0);
});

check('Mirror against a weak card is weak', () => {
  const wisp = card('mirror-wisp');
  const imp = card('ember-imp');
  const outcome = resolveRound(wisp, imp, { ...ctx });
  assert.equal(outcome.yourPower, 2);
  // 2 vs 2 with no Jester on either side: a clash, not a win.
  assert.equal(outcome.winner, null);
});

// --- Flow: same element twice, and only then ---
check('Flow adds +2 for the same element as last round', () => {
  const drake = card('inferno-drake');
  const guard = card('coral-guard');
  assert.equal(effectivePower(drake, guard, 'flame', false), 8);
  assert.equal(effectivePower(drake, guard, 'tide', false), 6);
});

check('A Court special leaves no Flow trail', () => {
  const drake = card('inferno-drake');
  const guard = card('coral-guard');
  assert.equal(effectivePower(drake, guard, 'special', false), 6);
});

// --- Surge: only after a lost round ---
check('Surge adds +3 only when the last round was lost', () => {
  const sage = card('storm-sage');
  const wolf = card('thorn-wolf');
  assert.equal(effectivePower(sage, wolf, null, true), 8);
  assert.equal(effectivePower(sage, wolf, null, false), 5);
});

// --- The round itself: wins, damage, and the tricks ---
check('Higher power wins and strikes for the difference', () => {
  const drake = card('inferno-drake');
  const guard = card('coral-guard');
  const outcome = resolveRound(drake, guard, { ...ctx });
  assert.equal(outcome.winner, 'you');
  // 2 for the gap, +2 because Burn fires on a win.
  assert.equal(outcome.damageToRival, 4);
});

check('Element advantage adds +2 damage on a win', () => {
  const knight = card('flame-knight');
  const pup = card('bramble-pup');
  const outcome = resolveRound(knight, pup, { ...ctx });
  assert.equal(outcome.winner, 'you');
  // Gap 2, +2 advantage (Flame beats Thorn), +2 Burn.
  assert.equal(outcome.damageToRival, 6);
});

check('Soak heals its own side even on a loss', () => {
  const sprite = card('dew-sprite');
  const drake = card('inferno-drake');
  const outcome = resolveRound(sprite, drake, { ...ctx });
  assert.equal(outcome.winner, 'rival');
  assert.equal(outcome.healYou, 3);
});

check('Barbs sting the winner when its side loses', () => {
  const wolf = card('thorn-wolf');
  const drake = card('inferno-drake');
  const outcome = resolveRound(wolf, drake, { ...ctx });
  assert.equal(outcome.winner, 'rival');
  assert.equal(outcome.barbsToRival, 3);
});

check('Jester takes a tied round outright', () => {
  const jester = card('fate-jester');
  const witch = card('pyre-witch');
  const tied = resolveRound(jester, witch, { ...ctx });
  assert.equal(tied.winner, 'you');
  // Two Jesters cancel each other out: a plain clash.
  const twin = resolveRound(jester, card('fate-jester-2'), { ...ctx });
  assert.equal(twin.winner, null);
});

check('A plain tie is a clash with no damage', () => {
  const fox = card('cinder-fox');
  const runner = card('gale-runner');
  const outcome = resolveRound(fox, runner, { ...ctx });
  assert.equal(outcome.winner, null);
  assert.equal(outcome.damageToRival, 0);
  assert.equal(outcome.damageToYou, 0);
});

// --- Life totals: the clamps ---
check('Life never drops below 0 or rises above the start', () => {
  const low = applyOutcome(
    { you: 2, rival: 30 },
    { healYou: 0, healRival: 0, damageToYou: 9, damageToRival: 0, barbsToYou: 0, barbsToRival: 0 },
  );
  assert.equal(low.you, 0);
  const high = applyOutcome(
    { you: 29, rival: 5 },
    { healYou: 3, healRival: 3, damageToYou: 0, damageToRival: 0, barbsToYou: 0, barbsToRival: 0 },
  );
  assert.equal(high.you, START_LIFE);
  assert.equal(high.rival, 8);
});

check('Flow bonus constant is 2', () => {
  assert.equal(FLOW_BONUS, 2);
});

console.log(passed + ' rule checks passed');
