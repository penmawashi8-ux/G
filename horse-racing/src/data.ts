import { BaseHorse, Part, PlayerColor } from './types';

// New mechanic: die >= speed → success → advance exactly speed マス
// Expected advance per turn = (7 - speed) / 6 * speed
//   speed=2: 1.67  speed=3: 2.0  speed=4: 2.0  speed=5: 1.67  (optimal at 3-4)
// hp = health; eliminated when damage >= hp
export const BASE_HORSES_HONMEI: BaseHorse[] = [
  { id: 'h-a', name: '疾風',   speed: 5, hp: 3, type: 'honmei' }, // ハイリスク・ハイリターン (5マス×33%)
  { id: 'h-b', name: '堅実',   speed: 3, hp: 5, type: 'honmei' }, // 安定型・高耐久 (3マス×67%)
  { id: 'h-c', name: '万能',   speed: 4, hp: 4, type: 'honmei' }, // バランス型 (4マス×50%)
  { id: 'h-d', name: '鉄壁',   speed: 2, hp: 6, type: 'honmei' }, // 超堅牢・低速 (2マス×83%)
];

export const BASE_HORSES_TAIKOU: BaseHorse[] = [
  { id: 't-w', name: '閃光',   speed: 5, hp: 2, type: 'taikou' }, // 超ガラス砲 (5マス×33%、即落)
  { id: 't-x', name: '機敏',   speed: 4, hp: 3, type: 'taikou' }, // 速さ重視 (4マス×50%)
  { id: 't-y', name: '一歩',   speed: 3, hp: 3, type: 'taikou' }, // 標準型 (3マス×67%)
  { id: 't-z', name: '大地',   speed: 2, hp: 4, type: 'taikou' }, // 守備型 (2マス×83%)
];

// speedMod: +1 = speed上昇（成功時進むマス増・成功率下がる）
//           -1 = speed低下（成功時進むマス減・成功率上がる）
// hpMod:   +N = 耐久力アップ
export const ALL_PARTS: Part[] = [
  // Jockeys
  { id: 'j1', slot: 'jockey', name: '名騎手',     speedMod:  0, hpMod: +2 }, // 純粋HP補強
  { id: 'j2', slot: 'jockey', name: '軽量騎手',   speedMod: -1, hpMod: -1 }, // 安定↑ 耐久↓
  { id: 'j3', slot: 'jockey', name: '熟練騎手',   speedMod: -1, hpMod:  0 }, // 成功率↑
  { id: 'j4', slot: 'jockey', name: '強引な騎手', speedMod: +1, hpMod: -1 }, // 大前進↑ 耐久↓
  { id: 'j5', slot: 'jockey', name: '戦略騎手',   speedMod: +1, hpMod: +1 }, // 両方+1
  { id: 'j6', slot: 'jockey', name: '闘志の騎手', speedMod: -1, hpMod: +1 }, // 安定↑ 耐久↑

  // Blinkers
  { id: 'b1', slot: 'blinker', name: '標準ブリンカー',    speedMod: -1, hpMod:  0 }, // 成功率↑
  { id: 'b2', slot: 'blinker', name: '強制ブリンカー',    speedMod: -2, hpMod:  0 }, // 大幅安定↑
  { id: 'b3', slot: 'blinker', name: 'ハーフブリンカー',  speedMod: -1, hpMod: -1 }, // 安定↑ 耐久↓
  { id: 'b4', slot: 'blinker', name: 'チューブブリンカー',speedMod:  0, hpMod: +2 }, // 純粋HP補強
  { id: 'b5', slot: 'blinker', name: 'クロスブリンカー',  speedMod: +1, hpMod: +1 }, // 両方+1
  { id: 'b6', slot: 'blinker', name: 'フルブリンカー',    speedMod: +2, hpMod: -1 }, // 大前進↑ 耐久↓

  // Cheeks
  { id: 'c1', slot: 'cheek', name: '標準チーク', speedMod:  0, hpMod: +1 }, // 小HP補強
  { id: 'c2', slot: 'cheek', name: '強化チーク', speedMod:  0, hpMod: +2 }, // 大HP補強
  { id: 'c3', slot: 'cheek', name: '軽量チーク', speedMod: -1, hpMod: -1 }, // 安定↑ 耐久↓
  { id: 'c4', slot: 'cheek', name: '革製チーク', speedMod: -1, hpMod: +1 }, // 安定↑ 耐久↑
  { id: 'c5', slot: 'cheek', name: '金属チーク', speedMod: +1, hpMod: +1 }, // 両方+1
  { id: 'c6', slot: 'cheek', name: '試作チーク', speedMod: +2, hpMod: -2 }, // 極端な速度↑ 耐久↓↓
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
