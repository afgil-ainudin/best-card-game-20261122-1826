// Ember Court — the sounds: small WebAudio blips, made in code, no files
// to load. Every effect is one short oscillator note (or a short run of
// them), so the table stays quiet until something happens.

let ctxBox = null;
let silent = false;

export function setMuted(value) {
  silent = value;
}

export function isMuted() {
  return silent;
}

// One shared audio context, woken on first use.
function audio() {
  if (!ctxBox) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctxBox = new AC();
  }
  if (ctxBox.state === 'suspended') ctxBox.resume();
  return ctxBox;
}

// A single note: an oscillator through a gain envelope that rises fast
// and falls away, so nothing clicks or rings.
function blip(freq, dur, type, gain, when = 0) {
  if (silent) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playClick() { blip(660, 0.07, 'triangle', 0.12); }
export function playDeal() { blip(330, 0.09, 'sine', 0.14); blip(495, 0.09, 'sine', 0.1, 0.07); }
export function playFlip() { blip(880, 0.06, 'square', 0.06); }
export function playHit() { blip(160, 0.18, 'sawtooth', 0.16); blip(90, 0.22, 'sawtooth', 0.14, 0.05); }
export function playHeal() { blip(523, 0.14, 'sine', 0.12); blip(784, 0.2, 'sine', 0.1, 0.1); }
export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.22, 'triangle', 0.14, i * 0.11));
}
export function playLose() {
  [392, 330, 262, 196].forEach((f, i) => blip(f, 0.26, 'triangle', 0.12, i * 0.13));
}
