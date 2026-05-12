import {
  GameState,
  AssemblyConfirmPayload,
  PartCard,
} from "../../shared/types";
import { computeStats, shuffle } from "./gameEngine";

export const CPU_ID = "cpu";

// Draft: pick a random available card for the current step
export function cpuDraftPick(state: GameState): string | null {
  const draft = state.draftState;
  if (!draft) return null;

  if (draft.step === "leader") {
    const cards = draft.availableLeaders;
    if (cards.length === 0) return null;
    return cards[Math.floor(Math.random() * cards.length)].id;
  }
  if (draft.step === "support") {
    const cards = draft.availableSupports;
    if (cards.length === 0) return null;
    return cards[Math.floor(Math.random() * cards.length)].id;
  }
  // parts
  const cards = draft.availableParts;
  if (cards.length === 0) return null;
  return cards[Math.floor(Math.random() * cards.length)].id;
}

// Assembly: randomly assign parts to slots while keeping all stats > 0
export function cpuBuildAssembly(state: GameState): AssemblyConfirmPayload {
  const cpu = state.players.find((p) => p.id === CPU_ID);
  if (!cpu || cpu.selectedMechs.length < 2) {
    return { leader: {}, support: {}, directionChoices: {} };
  }

  const [leaderCard, supportCard] = cpu.selectedMechs;
  const hand = cpu.hand;

  const bySlot = {
    right: shuffle(hand.filter((p) => p.slot === "right")),
    left: shuffle(hand.filter((p) => p.slot === "left")),
    backpack: shuffle(hand.filter((p) => p.slot === "backpack")),
  };

  type Assign = { right?: string; left?: string; backpack?: string };

  function tryAssign(baseCard: typeof leaderCard, usedIds: Set<string>): Assign {
    const assign: Assign = {};
    for (const slot of ["right", "left", "backpack"] as const) {
      const candidates = bySlot[slot].filter((p) => !usedIds.has(p.id));
      for (const part of candidates) {
        const testParts: { right?: PartCard; left?: PartCard; backpack?: PartCard } = {
          right: assign.right ? hand.find((p) => p.id === assign.right) : undefined,
          left: assign.left ? hand.find((p) => p.id === assign.left) : undefined,
          backpack: assign.backpack ? hand.find((p) => p.id === assign.backpack) : undefined,
          [slot]: part,
        };
        if (computeStats(baseCard.baseStats, testParts).hp > 0 &&
            computeStats(baseCard.baseStats, testParts).aim > 0 &&
            computeStats(baseCard.baseStats, testParts).sp > 0) {
          assign[slot] = part.id;
          usedIds.add(part.id);
          break;
        }
      }
    }
    return assign;
  }

  const usedIds = new Set<string>();
  const leader = tryAssign(leaderCard, usedIds);
  const support = tryAssign(supportCard, usedIds);

  return { leader, support, directionChoices: {} };
}

// Defense: pick the alive mech with the highest currentHP
export function cpuSelectDefenderMech(state: GameState): string | null {
  const cpu = state.players.find((p) => p.id === CPU_ID);
  if (!cpu) return null;
  const alive = cpu.mechs.filter((m) => !m.isDestroyed);
  if (alive.length === 0) return null;
  return alive.reduce((best, m) => (m.currentHP > best.currentHP ? m : best)).mechCard.id;
}

// Soul inherit: pick the alive mech with highest currentHP that hasn't inherited yet
export function cpuSelectInherit(state: GameState): string | null {
  const cpu = state.players.find((p) => p.id === CPU_ID);
  if (!cpu) return null;
  const eligible = cpu.mechs.filter((m) => !m.isDestroyed && m.inheritedMechId === null);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, m) => (m.currentHP > best.currentHP ? m : best)).mechCard.id;
}
