import { MechCard, PartCard } from "@shared/types";

export const MECH_LEADERS: MechCard[] = [
  { id: "leader_purple_gray",    name: "紫グレー",          type: "heavy", baseStats: { sp: 3, hp: 3, aim: 3, dice: 2, reroll: 0 } },
  { id: "leader_dark_red",       name: "暗赤色（ずんぐり）",   type: "heavy", baseStats: { sp: 2, hp: 5, aim: 3, dice: 2, reroll: 0 } },
  { id: "leader_green_x",        name: "緑（X印）",           type: "heavy", baseStats: { sp: 3, hp: 5, aim: 2, dice: 2, reroll: 0 } },
  { id: "leader_red_scorpion",   name: "赤（サソリ型）",       type: "heavy", baseStats: { sp: 3, hp: 5, aim: 2, dice: 2, reroll: 0 } },
];

export const MECH_SUPPORTS: MechCard[] = [
  { id: "wingman_red_round",     name: "赤（丸っこい）",       type: "support", baseStats: { sp: 2, hp: 4, aim: 2, dice: 2, reroll: 0 } },
  { id: "wingman_gray_teal",     name: "グレー/青緑",          type: "support", baseStats: { sp: 3, hp: 3, aim: 3, dice: 1, reroll: 0 } },
  { id: "wingman_green_small",   name: "緑（小型）",           type: "support", baseStats: { sp: 2, hp: 4, aim: 2, dice: 2, reroll: 0 } },
  { id: "wingman_purple_blue",   name: "紫青",                type: "support", baseStats: { sp: 2, hp: 5, aim: 1, dice: 2, reroll: 0 } },
];

export const ALL_PARTS: PartCard[] = [
  // 左手
  { id: "lh_missile_shield", name: "MISSILE SHIELD", slot: "left",    spMod: -1, hpMod: +2, aimMod:  0, bonusDice: 1, bonusReroll: 0 },
  { id: "lh_shield",         name: "SHIELD",         slot: "left",    spMod:  0, hpMod: +2, aimMod:  0, bonusDice: 0, bonusReroll: 0 },
  { id: "lh_bayonet",        name: "BAYONET",        slot: "left",    spMod: -1, hpMod:  0, aimMod: +1, bonusDice: 1, bonusReroll: 0 },
  { id: "lh_shield_claw",    name: "SHIELD CLAW",    slot: "left",    spMod: -1, hpMod: +2, aimMod:  0, bonusDice: 0, bonusReroll: 1 },
  { id: "lh_pile_bunker",    name: "PILE BUNKER",    slot: "left",    spMod:  0, hpMod:  0, aimMod: +1, bonusDice: 0, bonusReroll: 0 },
  { id: "lh_hero_shield",    name: "HERO SHIELD",    slot: "left",    spMod:  0, hpMod: +3, aimMod: -1, bonusDice: 0, bonusReroll: 0 },
  // 右手
  { id: "rh_rifle",          name: "RIFLE",          slot: "right",   spMod: -1, hpMod:  0, aimMod:  0, bonusDice: 2, bonusReroll: 0 },
  { id: "rh_gatling_gun",    name: "GATLING GUN",    slot: "right",   spMod:  0, hpMod:  0, aimMod: +1, bonusDice: 0, bonusReroll: 0 },
  { id: "rh_mega_rancher",   name: "MEGA RANCHER",   slot: "right",   spMod:  0, hpMod:  0, aimMod:  0, bonusDice: 1, bonusReroll: 0 },
  { id: "rh_twin_rifle",     name: "TWIN RIFLE",     slot: "right",   spMod: -1, hpMod:  0, aimMod: +2, bonusDice: 0, bonusReroll: 0 },
  { id: "rh_hammer",         name: "HAMMER",         slot: "right",   spMod: -1, hpMod: -2, aimMod: +1, bonusDice: 2, bonusReroll: 0 },
  { id: "rh_unknown_6",      name: "（右手6・要確認）",  slot: "right",   spMod:  0, hpMod: -2, aimMod:  0, bonusDice: 1, bonusReroll: 1 },
  { id: "rh_unknown_7",      name: "（右手7・要確認）",  slot: "right",   spMod:  0, hpMod: -2, aimMod: +2, bonusDice: 0, bonusReroll: 0 },
  // 背中
  { id: "bp_mega_cannon",    name: "MEGA CANNON",    slot: "backpack", spMod: +1, hpMod: -2, aimMod:  0, bonusDice: 1, bonusReroll: 0 },
  { id: "bp_missile_pod",    name: "MISSILE POD",    slot: "backpack", spMod:  0, hpMod: -2, aimMod: +2, bonusDice: 0, bonusReroll: 0 },
  { id: "bp_combat_cannon",  name: "COMBAT CANNON",  slot: "backpack", spMod: +1, hpMod: -2, aimMod:  0, bonusDice: 0, bonusReroll: 1 },
  { id: "bp_cannon",         name: "CANNON",         slot: "backpack", spMod:  0, hpMod:  0, aimMod: +1, bonusDice: 0, bonusReroll: 0 },
  { id: "bp_mega_booster",   name: "MEGA BOOSTER",   slot: "backpack", spMod: +2, hpMod:  0, aimMod: -1, bonusDice: 0, bonusReroll: 0 },
  { id: "bp_booster",        name: "BOOSTER",        slot: "backpack", spMod: +2, hpMod: -2, aimMod:  0, bonusDice: 0, bonusReroll: 0 },
  { id: "bp_unknown_7",      name: "（背中7・要確認）",  slot: "backpack", spMod: +1, hpMod:  0, aimMod:  0, bonusDice: 0, bonusReroll: 0 },
];

export const ALL_MECHS = [...MECH_LEADERS, ...MECH_SUPPORTS];

export function getMechById(id: string): MechCard | undefined {
  return ALL_MECHS.find((m) => m.id === id);
}

export function getPartById(id: string): PartCard | undefined {
  return ALL_PARTS.find((p) => p.id === id);
}
