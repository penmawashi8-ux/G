// NOTE: 暫定値。実物カード確認後に随時更新すること。
// 未確認項目: 右手6・7枚目のカード名、背中7枚目のカード名

export type MechRole = "leader" | "wingman"; // 長機(《《) | 僚機(《)
export type PartSlot = "leftHand" | "rightHand" | "backpack"; // 左手 | 右手 | 背中

export interface MechCard {
  id: string;
  name: string; // 外見の暫定名称
  role: MechRole;
  sp: number;
  hp: number;
  aim: number;
  dice: number;
}

export interface PartCard {
  id: string;
  name: string;
  slot: PartSlot;
  sp: number;   // 補正値(delta)
  hp: number;   // 補正値(delta)
  aim: number;  // 補正値(delta)
  bonusDice: number;   // サイコロ追加数
  bonusReroll: number; // リロール追加数
}

// ─── メックカード ────────────────────────────────────────────────

export const mechCards: MechCard[] = [
  // 長機（《《 二重矢印）
  { id: "leader-purple-gray",  name: "紫グレー",       role: "leader",  sp: 3, hp: 3, aim: 3, dice: 2 },
  { id: "leader-dark-red",     name: "暗赤色（ずんぐり）", role: "leader",  sp: 2, hp: 5, aim: 3, dice: 2 },
  { id: "leader-green-x",      name: "緑（X印）",       role: "leader",  sp: 3, hp: 5, aim: 2, dice: 2 },
  { id: "leader-red-scorpion", name: "赤（サソリ型）",   role: "leader",  sp: 3, hp: 5, aim: 2, dice: 2 },

  // 僚機（《 一重矢印）
  { id: "wingman-red-round",   name: "赤（丸っこい）",   role: "wingman", sp: 2, hp: 4, aim: 2, dice: 2 },
  { id: "wingman-gray-teal",   name: "グレー/青緑",      role: "wingman", sp: 3, hp: 3, aim: 3, dice: 1 },
  { id: "wingman-green-small", name: "緑（小型）",       role: "wingman", sp: 2, hp: 4, aim: 2, dice: 2 },
  { id: "wingman-purple-blue", name: "紫青",             role: "wingman", sp: 2, hp: 5, aim: 1, dice: 2 },
];

// ─── パーツカード ────────────────────────────────────────────────

export const partCards: PartCard[] = [
  // 左手（6枚）
  { id: "lh-missile-shield", name: "MISSILE SHIELD", slot: "leftHand",  sp: -1, hp: +2, aim:  0, bonusDice: 1, bonusReroll: 0 },
  { id: "lh-shield",         name: "SHIELD",         slot: "leftHand",  sp:  0, hp: +2, aim:  0, bonusDice: 0, bonusReroll: 0 },
  { id: "lh-bayonet",        name: "BAYONET",        slot: "leftHand",  sp: -1, hp:  0, aim: +1, bonusDice: 1, bonusReroll: 0 },
  { id: "lh-shield-claw",    name: "SHIELD CLAW",    slot: "leftHand",  sp: -1, hp: +2, aim:  0, bonusDice: 0, bonusReroll: 1 },
  { id: "lh-pile-bunker",    name: "PILE BUNKER",    slot: "leftHand",  sp:  0, hp:  0, aim: +1, bonusDice: 0, bonusReroll: 0 },
  { id: "lh-hero-shield",    name: "HERO SHIELD",    slot: "leftHand",  sp:  0, hp: +3, aim: -1, bonusDice: 0, bonusReroll: 0 },

  // 右手（7枚）— 6・7枚目はカード名未確認
  { id: "rh-rifle",          name: "RIFLE",          slot: "rightHand", sp: -1, hp:  0, aim:  0, bonusDice: 2, bonusReroll: 0 },
  { id: "rh-gatling-gun",    name: "GATLING GUN",    slot: "rightHand", sp:  0, hp:  0, aim: +1, bonusDice: 0, bonusReroll: 0 },
  { id: "rh-mega-rancher",   name: "MEGA RANCHER",   slot: "rightHand", sp:  0, hp:  0, aim:  0, bonusDice: 1, bonusReroll: 0 },
  { id: "rh-twin-rifle",     name: "TWIN RIFLE",     slot: "rightHand", sp: -1, hp:  0, aim: +2, bonusDice: 0, bonusReroll: 0 },
  { id: "rh-hammer",         name: "HAMMER",         slot: "rightHand", sp: -1, hp: -2, aim: +1, bonusDice: 2, bonusReroll: 0 },
  { id: "rh-unknown-6",      name: "（右手6枚目・要確認）", slot: "rightHand", sp:  0, hp: -2, aim:  0, bonusDice: 1, bonusReroll: 1 },
  { id: "rh-unknown-7",      name: "（右手7枚目・要確認）", slot: "rightHand", sp:  0, hp: -2, aim: +2, bonusDice: 0, bonusReroll: 0 },

  // 背中（7枚）— 7枚目はカード名未確認
  { id: "bp-mega-cannon",    name: "MEGA CANNON",    slot: "backpack",  sp: +1, hp: -2, aim:  0, bonusDice: 1, bonusReroll: 0 },
  { id: "bp-missile-pod",    name: "MISSILE POD",    slot: "backpack",  sp:  0, hp: -2, aim: +2, bonusDice: 0, bonusReroll: 0 },
  { id: "bp-combat-cannon",  name: "COMBAT CANNON",  slot: "backpack",  sp: +1, hp: -2, aim:  0, bonusDice: 0, bonusReroll: 1 },
  { id: "bp-cannon",         name: "CANNON",         slot: "backpack",  sp:  0, hp:  0, aim: +1, bonusDice: 0, bonusReroll: 0 },
  { id: "bp-mega-booster",   name: "MEGA BOOSTER",   slot: "backpack",  sp: +2, hp:  0, aim: -1, bonusDice: 0, bonusReroll: 0 },
  { id: "bp-booster",        name: "BOOSTER",        slot: "backpack",  sp: +2, hp: -2, aim:  0, bonusDice: 0, bonusReroll: 0 },
  { id: "bp-unknown-7",      name: "（背中7枚目・要確認）", slot: "backpack",  sp: +1, hp:  0, aim:  0, bonusDice: 0, bonusReroll: 0 },
];
