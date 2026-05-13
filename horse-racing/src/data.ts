import { BaseHorse, Part, PlayerColor } from './types';

// speed = dice threshold (lower is easier / faster)
// hp    = health points
export const BASE_HORSES_HONMEI: BaseHorse[] = [
  { id: 'h-a', name: '本命馬A', speed: 2, hp: 4, type: 'honmei' },
  { id: 'h-b', name: '本命馬B', speed: 1, hp: 3, type: 'honmei' },
  { id: 'h-c', name: '本命馬C', speed: 3, hp: 5, type: 'honmei' },
  { id: 'h-d', name: '本命馬D', speed: 2, hp: 5, type: 'honmei' },
];

export const BASE_HORSES_TAIKOU: BaseHorse[] = [
  { id: 't-x', name: '対抗馬X', speed: 2, hp: 3, type: 'taikou' },
  { id: 't-y', name: '対抗馬Y', speed: 3, hp: 4, type: 'taikou' },
  { id: 't-z', name: '対抗馬Z', speed: 1, hp: 2, type: 'taikou' },
  { id: 't-w', name: '対抗馬W', speed: 2, hp: 3, type: 'taikou' },
];

// speedMod: negative = easier to succeed (lower threshold), positive = harder
// hpMod: positive = more durable
export const ALL_PARTS: Part[] = [
  // Jockeys
  { id: 'j1', slot: 'jockey', name: '名騎手',     speedMod:  0, hpMod: +2 },
  { id: 'j2', slot: 'jockey', name: '軽量騎手',   speedMod: -1, hpMod: -1 },
  { id: 'j3', slot: 'jockey', name: '熟練騎手',   speedMod: -1, hpMod:  0 },
  { id: 'j4', slot: 'jockey', name: '強引な騎手', speedMod: +1, hpMod: -1 },
  { id: 'j5', slot: 'jockey', name: '守備騎手',   speedMod: +1, hpMod: +2 },
  { id: 'j6', slot: 'jockey', name: '闘志の騎手', speedMod: -1, hpMod: +1 },

  // Blinkers
  { id: 'b1', slot: 'blinker', name: '標準ブリンカー',    speedMod: -1, hpMod:  0 },
  { id: 'b2', slot: 'blinker', name: '強制ブリンカー',    speedMod: -2, hpMod: +1 },
  { id: 'b3', slot: 'blinker', name: 'ハーフブリンカー',  speedMod: -1, hpMod: -1 },
  { id: 'b4', slot: 'blinker', name: 'チューブブリンカー',speedMod:  0, hpMod: +2 },
  { id: 'b5', slot: 'blinker', name: 'クロスブリンカー',  speedMod: +1, hpMod: +1 },
  { id: 'b6', slot: 'blinker', name: 'フルブリンカー',    speedMod: +2, hpMod: -1 },

  // Cheeks
  { id: 'c1', slot: 'cheek', name: '標準チーク', speedMod:  0, hpMod: +1 },
  { id: 'c2', slot: 'cheek', name: '強化チーク', speedMod:  0, hpMod: +2 },
  { id: 'c3', slot: 'cheek', name: '軽量チーク', speedMod: -1, hpMod: -1 },
  { id: 'c4', slot: 'cheek', name: '革製チーク', speedMod: -1, hpMod: +1 },
  { id: 'c5', slot: 'cheek', name: '金属チーク', speedMod: +1, hpMod: +2 },
  { id: 'c6', slot: 'cheek', name: '試作チーク', speedMod: +2, hpMod: -2 },
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
