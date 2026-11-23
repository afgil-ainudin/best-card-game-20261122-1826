// Ember Court — the hand-in program (Node 22, standard library only).
// The game itself is the game/ folder beside this file: plain static
// files a desktop browser loads offline (game/index.html and its ES
// modules, no library, no network request). This program delivers it: it
// copies game/ and screenshots/ from beside this file into /output and
// writes /output/dossier.json, the summary the judge reads, using the
// vendored make.fun library.
//
// To look at it locally, serve game/ from the kit's starter serve.ts (or
// any static server) and open game/index.html. Outside the grader's
// container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const dest = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(dest, { recursive: true });
cpSync(join(root, 'game'), join(dest, 'game'), { recursive: true });
mkdirSync(join(dest, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) cpSync(join(root, 'screenshots'), join(dest, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest
// refuse an entry the scorer would refuse (more than 4 screenshots, or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files in
// all, or a path under game/ over 1000 bytes: game/ counts beside the
// 1000-entry cap of /output itself, its screenshots/ and dossier.json).
writeFileSync(
  join(dest, 'dossier.json'),
  buildDossier(dest, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
