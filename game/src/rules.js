// Ember Court — the rulebook: how a single round is settled.
// Pure functions, no DOM anywhere: the same code runs the table game and
// the headless checks, so a screenshot and a test can never disagree.

import { elementBeats } from './deck.js';

export const START_LIFE = 30;
export const HAND_SIZE = 5;
export const FLOW_BONUS = 2; // same element as your last round
export const ADVANTAGE_BONUS = 2; // element beats the rival's element
export const BURN_BONUS = 2;
export const SOAK_HEAL = 3;
export const BARBS_DAMAGE = 3;
export const SURGE_BONUS = 3;
export const MIRROR_VS_MIRROR = 5; // two Wisps reflecting each other

// What a card is really worth this round, before the two sides are weighed
// against each other. Mirror borrows the rival's strength; a Mirror facing
// another Mirror finds nothing to borrow, so the two meet at five —
// otherwise the Wisp would be a dead card the moment it met its twin.
export function effectivePower(card, rivalCard, lastElement, lostLastRound) {
  if (card.ability === 'mirror') {
    if (rivalCard.ability === 'mirror') return MIRROR_VS_MIRROR;
    return rivalCard.power;
  }
  let power = card.power;
  if (card.element !== 'special' && card.element === lastElement) power += FLOW_BONUS;
  if (card.ability === 'surge' && lostLastRound) power += SURGE_BONUS;
  return power;
}

// Settle one round. `you` and `rival` are the cards on the table; `ctx`
// carries the trail of the round before (last elements, who lost). The
// result says who took it, how hard it hit, and what the log should tell.
export function resolveRound(you, rival, ctx) {
  const yourPower = effectivePower(you, rival, ctx.yourLastElement, ctx.youLostLast);
  const rivalPower = effectivePower(rival, you, ctx.rivalLastElement, ctx.rivalLostLast);
  const yourAdvantage = elementBeats(you.element, rival.element);
  const rivalAdvantage = elementBeats(rival.element, you.element);

  let winner = null; // 'you' | 'rival' | null (a clash)
  if (yourPower > rivalPower) winner = 'you';
  else if (rivalPower > yourPower) winner = 'rival';
  else if (you.ability === 'jester' && rival.ability !== 'jester') winner = 'you';
  else if (rival.ability === 'jester' && you.ability !== 'jester') winner = 'rival';

  const outcome = {
    yourPower,
    rivalPower,
    yourAdvantage,
    rivalAdvantage,
    winner,
    damageToRival: 0,
    damageToYou: 0,
    healYou: 0,
    healRival: 0,
    barbsToRival: 0,
    barbsToYou: 0,
    lines: [],
  };

  if (you.ability === 'soak') { outcome.healYou = SOAK_HEAL; outcome.lines.push('Your ' + you.name + ' soothes you (+3 life).'); }
  if (rival.ability === 'soak') { outcome.healRival = SOAK_HEAL; outcome.lines.push('The Queen\u2019s ' + rival.name + ' soothes her (+3 life).'); }

  if (winner === 'you') {
    let dmg = Math.max(1, yourPower - rivalPower);
    if (yourAdvantage) { dmg += ADVANTAGE_BONUS; outcome.lines.push('Element advantage +2 for you.'); }
    if (you.ability === 'burn') { dmg += BURN_BONUS; outcome.lines.push('Burn! ' + you.name + ' adds +2 damage.'); }
    outcome.damageToRival = dmg;
    if (rival.ability === 'barbs') { outcome.barbsToYou = BARBS_DAMAGE; outcome.lines.push('Barbs! The Queen\u2019s ' + rival.name + ' stings you for 3.'); }
    outcome.lines.unshift('You take the round ' + yourPower + ' vs ' + rivalPower + ' — ' + dmg + ' damage to the Queen.');
  } else if (winner === 'rival') {
    let dmg = Math.max(1, rivalPower - yourPower);
    if (rivalAdvantage) { dmg += ADVANTAGE_BONUS; outcome.lines.push('Element advantage +2 for the Queen.'); }
    if (rival.ability === 'burn') { dmg += BURN_BONUS; outcome.lines.push('Burn! The Queen\u2019s ' + rival.name + ' adds +2 damage.'); }
    outcome.damageToYou = dmg;
    if (you.ability === 'barbs') { outcome.barbsToRival = BARBS_DAMAGE; outcome.lines.push('Barbs! Your ' + you.name + ' stings the Queen for 3.'); }
    outcome.lines.unshift('The Queen takes the round ' + rivalPower + ' vs ' + yourPower + ' — ' + dmg + ' damage to you.');
  } else {
    outcome.lines.unshift('A clash — ' + yourPower + ' vs ' + rivalPower + '. No damage; both sides draw a card.');
  }
  return outcome;
}

// Fold an outcome into the life totals: never below zero, never above the
// starting life, even when a Soak heals past it.
export function applyOutcome(life, outcome) {
  const next = { you: life.you, rival: life.rival };
  next.you = Math.min(START_LIFE, next.you + outcome.healYou - outcome.damageToYou - outcome.barbsToYou);
  next.rival = Math.min(START_LIFE, next.rival + outcome.healRival - outcome.damageToRival - outcome.barbsToRival);
  next.you = Math.max(0, next.you);
  next.rival = Math.max(0, next.rival);
  return next;
}

export function describeWinner(outcome) {
  if (outcome.winner === 'you') return 'You win the round';
  if (outcome.winner === 'rival') return 'Queen wins the round';
  return 'Clash — tied';
}
