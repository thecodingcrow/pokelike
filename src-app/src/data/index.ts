import type { NodeWeightRow } from '@/types';

export { TYPE_CHART } from './typeChart';
export { MOVE_POOL, TYPE_ITEM_MAP } from './moves';
export * from './gymLeaders';
export * from './elite4';
export * from './items';
export * from './evolutions';
export * from './constants';

// ── Node weights per content layer (layers 2–7, indices 0–5) ─────────────────

export const NODE_WEIGHTS: NodeWeightRow[] = [
  // L2 (ci=0)
  { battle: 25, catch: 30, item: 15, trainer: 30, question:  0, pokecenter:  0, move_tutor: 0, trade: 0, legendary: 0 },
  // L3 (ci=1)
  { battle: 20, catch: 20, item: 15, trainer: 30, question: 10, pokecenter:  0, move_tutor: 0, trade: 5, legendary: 0 },
  // L4 (ci=2)
  { battle: 16, catch: 14, item: 12, trainer: 27, question: 13, pokecenter:  0, move_tutor: 9, trade: 9, legendary: 0 },
  // L5 (ci=3)
  { battle: 13, catch: 12, item: 10, trainer: 27, question: 13, pokecenter:  9, move_tutor: 8, trade: 8, legendary: 0 },
  // L6 (ci=4)
  { battle: 13, catch: 10, item:  8, trainer: 27, question: 18, pokecenter:  9, move_tutor: 8, trade: 7, legendary: 0 },
  // L7 (ci=5) — pokecenter heavily weighted; guaranteed to appear via post-pass
  { battle: 20, catch:  9, item: 14, trainer: 18, question:  9, pokecenter: 30, move_tutor: 0, trade: 0, legendary: 0 },
];

// ── Trainer sprite registry ───────────────────────────────────────────────────

/** Filename stems in /sprites/ — must match exactly (case-sensitive). */
export const TRAINER_SPRITE_KEYS = [
  'aceTrainer',
  'bugCatcher',
  'fireSpitter',
  'fisher',
  'hiker',
  'oldGuy',
  'policeman',
  'Scientist',
  'teamRocket',
] as const;

export type TrainerSpriteKey = (typeof TRAINER_SPRITE_KEYS)[number];

export const TRAINER_SPRITE_NAMES: Record<TrainerSpriteKey, string> = {
  aceTrainer:  'Ace Trainer',
  bugCatcher:  'Bug Catcher',
  fireSpitter: 'Fire Breather',
  fisher:      'Fisher',
  hiker:       'Hiker',
  oldGuy:      'Old Man',
  policeman:   'Policeman',
  Scientist:   'Scientist',
  teamRocket:  'Team Rocket Grunt',
};

// ── Gym leader sprite paths ───────────────────────────────────────────────────

export const GYM_LEADER_SPRITES: string[] = [
  'sprites/brock.png',
  'sprites/misty.png',
  'sprites/lt. surge.png',
  'sprites/erika.png',
  'sprites/koga.png',
  'sprites/sabrina.png',
  'sprites/blaine.png',
  'sprites/giovanni.png',
];
