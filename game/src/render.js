// Ember Court — the painting: cards, hands, life tracks, the log, the veils.
// Every picture is inline SVG plus CSS, so each card stays readable even
// as a thumbnail on the judges' contact sheet.

import { ELEMENT_LABEL, ABILITY_TEXT } from './deck.js';
import { START_LIFE } from './rules.js';

// One picture per element — colour AND shape, never words alone, so the
// wheel reads at a glance. The path data is the same art as before; only
// the wrapping changed.
const svgShell = (inner) => '<svg viewBox="0 0 64 64" class="glyph" aria-hidden="true">' + inner + '</svg>';

const GLYPHS = {
  flame: svgShell('<path d="M32 4 C40 18 52 24 52 40 A20 20 0 1 1 12 40 C12 30 20 26 24 16 C28 22 30 24 32 30 C34 22 36 14 32 4 Z" fill="#fff3d6"/><path d="M32 26 C37 33 44 37 44 46 A12 12 0 1 1 20 46 C20 38 26 34 32 26 Z" fill="#ff7a1a"/>'),
  tide: svgShell('<path d="M32 4 C44 24 54 34 54 44 A22 22 0 1 1 10 44 C10 34 20 24 32 4 Z" fill="#dff4ff"/><ellipse cx="24" cy="46" rx="6" ry="9" fill="#ffffff" opacity=".7"/>'),
  thorn: svgShell('<path d="M32 6 C52 14 58 34 50 52 C40 60 22 58 14 44 C8 30 16 12 32 6 Z" fill="#e2ffd9"/><path d="M32 10 L32 56 M32 26 L46 16 M32 26 L18 16 M32 42 L48 32 M32 42 L16 32" stroke="#1f7a33" stroke-width="3" fill="none" stroke-linecap="round"/>'),
  storm: svgShell('<path d="M36 4 L12 36 L28 36 L24 60 L52 26 L34 26 Z" fill="#fff7cc" stroke="#7a5c00" stroke-width="2" stroke-linejoin="round"/>'),
  special: svgShell('<circle cx="32" cy="32" r="26" fill="#efe4ff"/><circle cx="32" cy="32" r="16" fill="#c9a6ff"/><circle cx="32" cy="32" r="7" fill="#5b2a9e"/>'),
};

// Small helper: a node with an optional class and optional text.
function make(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

// A face-up card: power, picture, name, element, and its trick in words.
// Mirror cards hide their power behind a question mark — it is borrowed.
export function cardElement(card, opts = {}) {
  const node = make('div', 'card ' + card.element);
  if (opts.key) node.appendChild(make('span', 'key', String(opts.key)));
  node.appendChild(make('div', 'power', card.ability === 'mirror' ? '?' : String(card.power)));
  node.insertAdjacentHTML('beforeend', GLYPHS[card.element]);
  node.appendChild(make('div', 'card-name', card.name));
  node.appendChild(make('div', 'element', ELEMENT_LABEL[card.element]));
  node.appendChild(make('div', 'ability', card.ability ? ABILITY_TEXT[card.ability] : 'A heavy hitter. No tricks — just power.'));
  if (opts.onClick) node.addEventListener('click', opts.onClick);
  return node;
}

// The Queen's card, still face down: a crown on a dark back.
export function cardBackElement() {
  const node = make('div', 'card-back');
  node.textContent = '♛';
  return node;
}

// The challenger's hand, left to right, keys 1–5, clickable unless locked.
export function renderHand(container, hand, onPlay, locked) {
  container.innerHTML = '';
  hand.forEach((card, i) => {
    const node = cardElement(card, {
      key: i + 1,
      onClick: () => onPlay(i),
    });
    if (locked) node.classList.add('disabled');
    container.appendChild(node);
  });
}

// The Queen's hand stays a secret: a row of small backs, one per card.
export function renderRivalHand(container, count) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) container.appendChild(make('div', 'mini-card'));
}

// A life track: fill width from the life total, red when it runs low.
export function renderLife(fillEl, textEl, life) {
  fillEl.style.width = Math.max(0, (life / START_LIFE) * 100) + '%';
  fillEl.classList.toggle('low', life <= 10);
  textEl.textContent = life + ' / ' + START_LIFE;
}

export function renderDeckCounts(playerEl, rivalEl, playerDeck, rivalDeck) {
  playerEl.textContent = String(playerDeck);
  rivalEl.textContent = String(rivalDeck);
}

export function renderRounds(youEl, rivalEl, youRounds, rivalRounds) {
  youEl.textContent = 'Rounds won: ' + youRounds;
  rivalEl.textContent = 'Rounds won: ' + rivalRounds;
}

export function renderRoundBadge(badgeEl, round) {
  badgeEl.textContent = 'Round ' + round;
}

// The Flow badge: which element carries the +2 bonus right now, if any.
export function renderFlowBadge(badgeEl, element) {
  if (element) {
    badgeEl.textContent = 'Flow: ' + ELEMENT_LABEL[element] + ' +2';
    badgeEl.classList.add('flow-on');
  } else {
    badgeEl.textContent = 'Flow: —';
    badgeEl.classList.remove('flow-on');
  }
}

// The verdict between the two slots: who took the round, and by how much.
export function renderRoundResult(resultEl, outcome) {
  resultEl.innerHTML = '';
  const head = make('div', null, outcome.winner === 'you' ? 'You win the round'
    : outcome.winner === 'rival' ? 'Queen wins the round' : 'Clash — tied');
  head.innerHTML = '<b>' + head.textContent + '</b>';
  resultEl.appendChild(head);
  const score = make('div', null, outcome.yourPower + ' vs ' + outcome.rivalPower);
  resultEl.appendChild(score);
}

// Newest log lines first, keeping only the last few on the table.
export function addLog(listEl, lines, max = 8) {
  for (const line of lines) {
    const li = make('li', null, line);
    listEl.prepend(li);
  }
  while (listEl.children.length > max) listEl.removeChild(listEl.lastChild);
}

// A number that drifts up from the hurt side, then vanishes.
export function floatText(layer, text, cls, xPct, yPct) {
  const span = make('span', cls, text);
  span.style.left = xPct + '%';
  span.style.top = yPct + '%';
  layer.appendChild(span);
  setTimeout(() => span.remove(), 1200);
}

export function showOverlay(overlayEl) { overlayEl.classList.remove('hidden'); }
export function hideOverlay(overlayEl) { overlayEl.classList.add('hidden'); }

// The final veil: crown or skull, the headline, one parting line, and the
// tale of the tape as a row of number-and-label cells.
export function renderEndScreen(endEls, won, stats) {
  endEls.emblem.textContent = won ? '♛' : '☠';
  endEls.emblem.className = 'end-emblem ' + (won ? 'win' : 'lose');
  endEls.title.textContent = won ? 'You win the court!' : 'The Queen keeps the court';
  endEls.line.textContent = won
    ? 'Queen Cinder bows. The Ember Court is yours.'
    : 'Queen Cinder keeps her throne — for now. Duel again and take it back.';
  endEls.stats.innerHTML = '';
  for (const [value, label] of stats) {
    const cell = make('div');
    cell.appendChild(make('b', null, String(value)));
    cell.appendChild(make('span', null, label));
    endEls.stats.appendChild(cell);
  }
}

// The live region, for screen readers: one line about the state of the duel.
export function announce(statusEl, text) {
  statusEl.textContent = text;
}
