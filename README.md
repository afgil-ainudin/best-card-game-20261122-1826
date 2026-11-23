[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/afgil-ainudin/best-card-game-20261122-1826/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/afgil-ainudin/best-card-game-20261122-1826/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

# Ember Court

A duel of cards against Queen Cinder. You and the Queen play one card each
round — higher power wins the round and strikes for the difference, plus 2
when your element beats theirs. Play the same element twice in a row for a
+2 Flow bonus. First to bring the other to 0 life wins the court.

Four elements on a wheel — Flame beats Thorn beats Tide beats Storm beats
Flame — and six abilities: Burn, Soak, Barbs, Surge, Mirror, and Jester.
The Queen reads your habits and answers them, so bait her, then strike.

Open `game/index.html` in a browser to play, or run a screenshot scene
with `?shot=title|play|win|loss&seed=N`.

## How to play

You duel Queen Cinder for the Ember Court. Both sides start at 30 life
with a 30-card deck and a hand of five. Each round you both commit one
card face down, then reveal together — higher power takes the round and
strikes for the difference (minimum 1 damage).

**The element wheel:** Flame beats Thorn beats Tide beats Storm beats
Flame. Winning with the beating element deals +2 damage.

**Flow:** play the same element as your last round for +2 power. Court
specials (Mirror Wisp, Ember Golem, Fate Jester) carry no element, so
they never break — or start — a Flow chain.

**Abilities:** Flame cards Burn (+2 damage on a win) · Tide cards Soak
(heal 3 when played) · Thorn cards Barbs (3 damage back if you lose) ·
Storm cards Surge (+3 power after a lost round) · Mirror Wisp copies the
rival card's power, and two Wisps meet at 5 · Fate Jester wins ties.

**Reading the Queen:** she saves big cards while ahead, reaches for
healing when hurt, and strikes hard when behind. Her mood line under her
life bar says what she is likely to do next — bait her, then answer.

**Keys:** click a card or press 1–5 to play · H for the rules · M to
mute · Escape closes the rules.

## Checks

Headless rule checks live in `tests/rules.test.mjs` — run them with
`node tests/rules.test.mjs`. They pin the Mirror twin rule, the Flow
trail, Surge, and every ability, plus the life clamps at 0 and 30.
