// Game constants: BST ranges, level ranges, BST buckets, legendary IDs

export interface BstRange {
  min: number;
  max: number;
}

// BST ranges per map (index 0 = Map 1, index 8 = Final)
export const MAP_BST_RANGES: BstRange[] = [
  { min: 200, max: 310 },   // Map 1
  { min: 280, max: 360 },   // Map 2
  { min: 340, max: 420 },   // Map 3
  { min: 340, max: 420 },   // Map 4
  { min: 400, max: 480 },   // Map 5
  { min: 400, max: 480 },   // Map 6
  { min: 460, max: 530 },   // Map 7
  { min: 460, max: 530 },   // Map 8
  { min: 530, max: 999 },   // Final
];

// [minLevel, maxLevel] per map (index 0 = Map 1)
export const MAP_LEVEL_RANGES: [number, number][] = [
  [1, 5], [8, 15], [15, 22], [22, 30],
  [30, 38], [38, 44], [44, 48], [48, 53], [54, 65]
];

// Gen 1 legendary Pokemon IDs — removed from all wild/catch pools, available only via Legendary node
export const LEGENDARY_IDS: number[] = [144, 145, 146, 150, 151];

// All catchable Gen 1 IDs by BST bucket
// Legendaries are excluded from all buckets — they appear only via the Legendary node
export const GEN1_BST_APPROX: Record<string, number[]> = {
  low:      [10,11,13,14,16,17,19,20,21,23,27,29,32,41,46,48,52,54,56,60,
             69,72,74,79,81,84,86,96,98,100,102,108,111,116,118,120,129,133],
  midLow:   [25,30,33,35,37,39,43,50,58,61,63,66,73,77,83,92,95,96,104,109,
             113,114,116,120,122,123,126,127,128,138,140],
  mid:      [26,36,42,49,51,64,67,70,75,82,85,93,97,101,103,105,107,110,119,
             121,124,125,130,137,139,141],
  midHigh:  [40,44,55,62,76,80,87,88,89,90,91,99,106,115,117,131,
             132,137,142,143],
  high:     [3,6,9,12,15,18,22,24,28,31,34,38,45,47,53,57,59,
             65,68,71,76,78,80,89,94,112,121,130,142,143,149],
  veryHigh: [6,9,65,68,94,112,130,131,143,147,148,149],
};
