// Ember Court — the deck: every card, its element, power and ability.
// Four elements, each told apart by colour AND shape: Flame (red, triangle),
// Tide (blue, droplet), Thorn (green, leaf), Storm (yellow, bolt).

export const ELEMENTS = ['flame', 'tide', 'thorn', 'storm'];

export const ELEMENT_LABEL = {
  flame: 'Flame',
  tide: 'Tide',
  thorn: 'Thorn',
  storm: 'Storm',
  special: 'Court',
};

// The wheel: flame > thorn > tide > storm > flame.
export const BEATS = { flame: 'thorn', thorn: 'tide', tide: 'storm', storm: 'flame' };

export function elementBeats(a, b) {
  return BEATS[a] === b;
}

// Seeded random so screenshot scenes and tests are reproducible.
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleDeck(cards, rand) {
  const deck = cards.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Abilities, keyed by the card's ability id:
//  burn  — Flame: +2 damage when its side wins the round.
//  soak  — Tide: its side heals 3 life when the card is played.
//  barbs — Thorn: if its side loses the round, the winner takes 3 damage back.
//  surge — Storm: +3 power if its side lost the previous round.
//  mirror — Mirror Wisp: its power becomes the rival card's power.
//  jester — Fate Jester: wins a tied round outright.
const CARD_DEFS = [
  // Flame — Burn
  { id: 'ember-imp', name: 'Ember Imp', element: 'flame', power: 2, ability: 'burn' },
  { id: 'cinder-fox', name: 'Cinder Fox', element: 'flame', power: 3, ability: 'burn' },
  { id: 'flame-knight', name: 'Flame Knight', element: 'flame', power: 4, ability: 'burn' },
  { id: 'pyre-witch', name: 'Pyre Witch', element: 'flame', power: 5, ability: 'burn' },
  { id: 'inferno-drake', name: 'Inferno Drake', element: 'flame', power: 6, ability: 'burn' },
  { id: 'phoenix-queen', name: 'Phoenix Queen', element: 'flame', power: 8, ability: 'burn' },
  // Tide — Soak
  { id: 'dew-sprite', name: 'Dew Sprite', element: 'tide', power: 2, ability: 'soak' },
  { id: 'river-monk', name: 'River Monk', element: 'tide', power: 3, ability: 'soak' },
  { id: 'coral-guard', name: 'Coral Guard', element: 'tide', power: 4, ability: 'soak' },
  { id: 'tidecaller', name: 'Tidecaller', element: 'tide', power: 5, ability: 'soak' },
  { id: 'leviathan', name: 'Leviathan', element: 'tide', power: 6, ability: 'soak' },
  { id: 'moon-jelly', name: 'Moon Jelly', element: 'tide', power: 7, ability: 'soak' },
  // Thorn — Barbs
  { id: 'bramble-pup', name: 'Bramble Pup', element: 'thorn', power: 2, ability: 'barbs' },
  { id: 'vine-archer', name: 'Vine Archer', element: 'thorn', power: 3, ability: 'barbs' },
  { id: 'thorn-wolf', name: 'Thorn Wolf', element: 'thorn', power: 4, ability: 'barbs' },
  { id: 'grove-warden', name: 'Grove Warden', element: 'thorn', power: 5, ability: 'barbs' },
  { id: 'rose-golem', name: 'Rose Golem', element: 'thorn', power: 6, ability: 'barbs' },
  { id: 'ancient-oak', name: 'Ancient Oak', element: 'thorn', power: 7, ability: 'barbs' },
  // Storm — Surge
  { id: 'spark-mouse', name: 'Spark Mouse', element: 'storm', power: 2, ability: 'surge' },
  { id: 'gale-runner', name: 'Gale Runner', element: 'storm', power: 3, ability: 'surge' },
  { id: 'thunder-hawk', name: 'Thunder Hawk', element: 'storm', power: 4, ability: 'surge' },
  { id: 'storm-sage', name: 'Storm Sage', element: 'storm', power: 5, ability: 'surge' },
  { id: 'tempest-roc', name: 'Tempest Roc', element: 'storm', power: 6, ability: 'surge' },
  { id: 'sky-serpent', name: 'Sky Serpent', element: 'storm', power: 7, ability: 'surge' },
  // Court specials — no element of their own, they bend the rules instead.
  { id: 'mirror-wisp', name: 'Mirror Wisp', element: 'special', power: 0, ability: 'mirror' },
  { id: 'mirror-wisp-2', name: 'Mirror Wisp', element: 'special', power: 0, ability: 'mirror' },
  { id: 'ember-golem', name: 'Ember Golem', element: 'special', power: 9, ability: null },
  { id: 'ember-golem-2', name: 'Ember Golem', element: 'special', power: 9, ability: null },
  { id: 'fate-jester', name: 'Fate Jester', element: 'special', power: 5, ability: 'jester' },
  { id: 'fate-jester-2', name: 'Fate Jester', element: 'special', power: 5, ability: 'jester' },
];

export const ABILITY_TEXT = {
  burn: 'Burn: +2 damage when you win the round.',
  soak: 'Soak: heal 3 life when played.',
  barbs: 'Barbs: if you lose, the winner takes 3.',
  surge: 'Surge: +3 power after a lost round.',
  mirror: 'Mirror: copies the rival card\u2019s power — two Mirrors meet at 5.',
  jester: 'Jester: wins a tied round.',
};

export function buildDeck() {
  return CARD_DEFS.map((c) => ({ ...c, uid: c.id }));
}

export function cardById(id) {
  return CARD_DEFS.find((c) => c.id === id);
}
