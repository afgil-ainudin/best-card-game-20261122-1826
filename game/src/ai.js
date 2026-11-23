// Ember Court — Queen Cinder's mind: a rival you can read, and beat.
// She weighs every card in her hand against the whole deck (your hand
// stays hidden from her), then plays the best of them — with moods she
// cannot hide: she hoards her giants while ahead, reaches for healing
// when hurt, and spends everything when behind. And because she favours
// the element that beats yours, leaning on one element gets punished.

import { buildDeck, BEATS } from './deck.js';
import { effectivePower, ADVANTAGE_BONUS, BURN_BONUS } from './rules.js';

const EVERY_CARD = buildDeck();

// What a card is worth, on average, against a random card from the deck.
function valueOfPlay(card, hand, ctx, rand) {
  let sum = 0;
  for (const foe of EVERY_CARD) {
    const mine = effectivePower(card, foe, ctx.myLastElement, ctx.iLostLast);
    const theirs = effectivePower(foe, card, ctx.yourLastElement, ctx.youLostLast);
    let mark = 0;
    if (mine > theirs) {
      mark = Math.max(1, mine - theirs);
      if (BEATS[card.element] === foe.element) mark += ADVANTAGE_BONUS;
      if (card.ability === 'burn') mark += BURN_BONUS;
    } else if (theirs > mine) {
      mark = -Math.max(1, theirs - mine);
      if (BEATS[foe.element] === card.element) mark -= ADVANTAGE_BONUS;
      if (foe.ability === 'burn') mark -= BURN_BONUS;
    }
    if (card.ability === 'soak') mark += 2.5; // a heal is worth a little less than damage
    if (card.ability === 'barbs' && mine < theirs) mark += 2;
    sum += mark;
  }
  return sum / EVERY_CARD.length + rand() * 0.6; // a touch of human wobble
}

// The readable "tell": what the Queen is likely to do next, read from
// where she stands. It sits under her life bar, so the player can see
// the mood coming and answer it.
export function queenTell(myLife, yourLife) {
  if (myLife <= 10) return 'She looks hurt — expect her to reach for healing.';
  if (yourLife - myLife >= 8) return 'She is desperate — her strongest cards are coming.';
  if (myLife - yourLife >= 12) return 'She is toying with you — saving her best cards.';
  return 'She studies your hand, weighing her next card.';
}

export function chooseCard(hand, ctx, rand) {
  if (hand.length === 1) return hand[0];
  // Sharp, not perfect: three times in ten she follows instinct instead
  // of her best card. That gap is what makes her beatable — and readable.
  if (rand() < 0.3) return hand[Math.floor(rand() * hand.length)];
  const life = ctx.myLife;
  const behind = ctx.yourLife - life;
  let best = null;
  let bestScore = -Infinity;
  for (const card of hand) {
    let score = valueOfPlay(card, hand, ctx, rand);
    // Moods, legible from how she plays:
    if (life <= 10 && card.ability === 'soak') score += 6; // hurt: she reaches for healing
    if (behind <= -12 && card.power >= 7) score -= 4; // far ahead: she saves her giants
    if (behind >= 8 && card.power >= 6) score += 3; // behind: she spends her best
    if (ctx.yourLastElement && BEATS[card.element] === ctx.yourLastElement) score += 1.5; // she counters your habit
    if (score > bestScore) { bestScore = score; best = card; }
  }
  return best;
}
