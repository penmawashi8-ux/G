import { BaseHorse, Part, PlayerColor } from './types';

export const BASE_HORSES_HONMEI: BaseHorse[] = [
  { id: 'h-a', name: '本命馬A', ability: 2, speed: 2, motivation: 4, grit: 4, type: 'honmei' },
  { id: 'h-b', name: '本命馬B', ability: 3, speed: 1, motivation: 3, grit: 5, type: 'honmei' },
  { id: 'h-c', name: '本命馬C', ability: 2, speed: 3, motivation: 3, grit: 3, type: 'honmei' },
  { id: 'h-d', name: '本命馬D', ability: 1, speed: 2, motivation: 5, grit: 6, type: 'honmei' },
];

export const BASE_HORSES_TAIKOU: BaseHorse[] = [
  { id: 't-x', name: '対抗馬X', ability: 3, speed: 2, motivation: 3, grit: 3, type: 'taikou' },
  { id: 't-y', name: '対抗馬Y', ability: 2, speed: 1, motivation: 4, grit: 5, type: 'taikou' },
  { id: 't-z', name: '対抗馬Z', ability: 1, speed: 3, motivation: 5, grit: 4, type: 'taikou' },
  { id: 't-w', name: '対抗馬W', ability: 2, speed: 2, motivation: 3, grit: 4, type: 'taikou' },
];

export const ALL_PARTS: Part[] = [
  { id: 'j1', slot: 'jockey', name: '名騎手',     abilityMod: 0,  speedMod: 1,  motivationMod: 0,  gritMod: 2,  extraDice: 0, extraReroll: 0 },
  { id: 'j2', slot: 'jockey', name: '軽量騎手',   abilityMod: 1,  speedMod: 0,  motivationMod: 0,  gritMod: -1, extraDice: 1, extraReroll: 0 },
  { id: 'j3', slot: 'jockey', name: '熟練騎手',   abilityMod: 0,  speedMod: 1,  motivationMod: 1,  gritMod: -1, extraDice: 0, extraReroll: 0 },
  { id: 'j4', slot: 'jockey', name: '強引な騎手', abilityMod: 1,  speedMod: 0,  motivationMod: 0,  gritMod: -2, extraDice: 1, extraReroll: 0 },
  { id: 'j5', slot: 'jockey', name: '守備騎手',   abilityMod: -1, speedMod: 0,  motivationMod: 0,  gritMod: 3,  extraDice: 0, extraReroll: 0 },
  { id: 'j6', slot: 'jockey', name: '闘志の騎手', abilityMod: 0,  speedMod: 0,  motivationMod: 2,  gritMod: -1, extraDice: 0, extraReroll: 0 },
  { id: 'b1', slot: 'blinker', name: '標準ブリンカー',   abilityMod: 0,  speedMod: 0,  motivationMod: 1,  gritMod: 0,  extraDice: 0, extraReroll: 0 },
  { id: 'b2', slot: 'blinker', name: '強制ブリンカー',   abilityMod: -1, speedMod: 0,  motivationMod: 2,  gritMod: 0,  extraDice: 0, extraReroll: 0 },
  { id: 'b3', slot: 'blinker', name: 'ハーフブリンカー', abilityMod: 0,  speedMod: 1,  motivationMod: -1, gritMod: 0,  extraDice: 1, extraReroll: 0 },
  { id: 'b4', slot: 'blinker', name: 'チューブブリンカー', abilityMod: 0, speedMod: 0, motivationMod: -1, gritMod: 2,  extraDice: 0, extraReroll: 0 },
  { id: 'b5', slot: 'blinker', name: 'クロスブリンカー', abilityMod: 1,  speedMod: -1, motivationMod: 0,  gritMod: 0,  extraDice: 0, extraReroll: 1 },
  { id: 'b6', slot: 'blinker', name: 'フルブリンカー',   abilityMod: 0,  speedMod: 2,  motivationMod: 0,  gritMod: -2, extraDice: 0, extraReroll: 0 },
  { id: 'c1', slot: 'cheek', name: '標準チーク', abilityMod: 0,  speedMod: 0,  motivationMod: 0,  gritMod: 1,  extraDice: 0, extraReroll: 0 },
  { id: 'c2', slot: 'cheek', name: '強化チーク', abilityMod: 0,  speedMod: -1, motivationMod: 0,  gritMod: 2,  extraDice: 0, extraReroll: 0 },
  { id: 'c3', slot: 'cheek', name: '軽量チーク', abilityMod: 0,  speedMod: 1,  motivationMod: 0,  gritMod: -1, extraDice: 1, extraReroll: 0 },
  { id: 'c4', slot: 'cheek', name: '革製チーク', abilityMod: -1, speedMod: 0,  motivationMod: 1,  gritMod: 1,  extraDice: 0, extraReroll: 0 },
  { id: 'c5', slot: 'cheek', name: '金属チーク', abilityMod: 0,  speedMod: 0,  motivationMod: -1, gritMod: 3,  extraDice: 0, extraReroll: 0 },
  { id: 'c6', slot: 'cheek', name: '試作チーク', abilityMod: 1,  speedMod: 0,  motivationMod: 0,  gritMod: -2, extraDice: 0, extraReroll: 1 },
];

export const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'black', 'purple'];
export const PLAYER_NAMES = ['赤プレイヤー', '緑プレイヤー', '黒プレイヤー', '紫プレイヤー'];
export const COLOR_LABEL: Record<PlayerColor, string> = {
  red: '赤', green: '緑', black: '黒', purple: '紫',
};
export const COLOR_CLASS: Record<PlayerColor, string> = {
  red:    'bg-rose-500 text-white border-rose-600',
  green:  'bg-emerald-500 text-white border-emerald-600',
  black:  'bg-slate-700 text-white border-slate-800',
  purple: 'bg-violet-500 text-white border-violet-600',
};
export const COLOR_TEXT: Record<PlayerColor, string> = {
  red: 'text-rose-600', green: 'text-emerald-600', black: 'text-slate-700', purple: 'text-violet-600',
};
export const COLOR_BG_LIGHT: Record<PlayerColor, string> = {
  red: 'bg-rose-100', green: 'bg-emerald-100', black: 'bg-slate-200', purple: 'bg-violet-100',
};
export const COLOR_BORDER: Record<PlayerColor, string> = {
  red: 'border-rose-400', green: 'border-emerald-400', black: 'border-slate-500', purple: 'border-violet-400',
};
